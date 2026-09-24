import time
import uuid
from unittest.mock import MagicMock, patch

import jwt
from django.conf import settings
from django.test import TestCase, override_settings
from jwt import PyJWKClient, PyJWKClientError
from rest_framework.exceptions import AuthenticationFailed

from apps.authentication.supabase_auth import SupabaseAuthentication, SupabaseUser


class SupabaseAuthenticationSecurityTests(TestCase):
    """
    Regression test suite for SupabaseAuthentication.
    Ensures that NO request can ever authenticate with an unverified or forged token,
    even when Django DEBUG is True.
    """

    def setUp(self):
        self.auth = SupabaseAuthentication()
        self.user_uuid = str(uuid.uuid4())
        self.test_secret = "test-jwt-secret-key-32-chars-long-minimum!!"
        self.supabase_url = "https://testproject.supabase.co"

    @override_settings(DEBUG=True)
    def test_unverified_forged_token_rejected_even_when_debug_true(self):
        """
        CRITICAL P0 REGRESSION TEST:
        Proves that an unsigned token or a token with an untrusted signature
        is rejected with AuthenticationFailed even when DEBUG=True and secret is unset.
        """
        # Create an unsigned/forged token (alg='none')
        forged_payload = {
            "sub": self.user_uuid,
            "email": "victim@example.com",
            "role": "authenticated",
            "aud": "authenticated",
            "exp": int(time.time()) + 3600,
        }
        forged_token = jwt.encode(forged_payload, key="", algorithm="none")

        request = MagicMock()
        request.META = {"HTTP_AUTHORIZATION": f"Bearer {forged_token}"}

        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": "", "SUPABASE_URL": ""}):
            with self.assertRaises(AuthenticationFailed):
                self.auth.authenticate(request)

    @override_settings(DEBUG=True)
    def test_forged_hs256_signature_rejected_when_debug_true(self):
        """
        Proves that a token signed with an attacker's key is rejected when validated
        against the genuine secret, even with DEBUG=True.
        """
        attacker_key = "attacker-secret-key-completely-wrong"
        payload = {
            "sub": self.user_uuid,
            "email": "victim@example.com",
            "role": "authenticated",
            "aud": "authenticated",
            "exp": int(time.time()) + 3600,
        }
        forged_token = jwt.encode(payload, attacker_key, algorithm="HS256")

        request = MagicMock()
        request.META = {"HTTP_AUTHORIZATION": f"Bearer {forged_token}"}

        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": self.test_secret, "SUPABASE_URL": ""}):
            with self.assertRaises(AuthenticationFailed):
                self.auth.authenticate(request)

    @override_settings(DEBUG=True)
    def test_expired_token_rejected(self):
        """Expired tokens must be rejected."""
        payload = {
            "sub": self.user_uuid,
            "email": "user@example.com",
            "role": "authenticated",
            "aud": "authenticated",
            "exp": int(time.time()) - 100,  # in the past
        }
        expired_token = jwt.encode(payload, self.test_secret, algorithm="HS256")

        request = MagicMock()
        request.META = {"HTTP_AUTHORIZATION": f"Bearer {expired_token}"}

        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": self.test_secret, "SUPABASE_URL": ""}):
            with self.assertRaises(AuthenticationFailed) as ctx:
                self.auth.authenticate(request)
            self.assertIn("expired", str(ctx.exception).lower())

    @override_settings(DEBUG=True)
    def test_valid_hs256_token_authenticates_successfully(self):
        """A valid HS256 token signed with the configured secret succeeds."""
        payload = {
            "sub": self.user_uuid,
            "email": "legit@example.com",
            "role": "authenticated",
            "aud": "authenticated",
            "exp": int(time.time()) + 3600,
        }
        valid_token = jwt.encode(payload, self.test_secret, algorithm="HS256")

        request = MagicMock()
        request.META = {"HTTP_AUTHORIZATION": f"Bearer {valid_token}"}

        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": self.test_secret, "SUPABASE_URL": ""}):
            result = self.auth.authenticate(request)
            self.assertIsNotNone(result)
            user, token_str = result
            self.assertEqual(user.id, self.user_uuid)
            self.assertEqual(user.email, "legit@example.com")
            self.assertTrue(user.is_authenticated)

    @override_settings(DEBUG=True)
    def test_invalid_issuer_rejected(self):
        """Token with mismatched issuer claim must be rejected."""
        payload = {
            "sub": self.user_uuid,
            "email": "legit@example.com",
            "role": "authenticated",
            "aud": "authenticated",
            "iss": "https://malicious.issuer.com/auth/v1",
            "exp": int(time.time()) + 3600,
        }
        token = jwt.encode(payload, self.test_secret, algorithm="HS256")

        request = MagicMock()
        request.META = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

        with patch.dict("os.environ", {
            "SUPABASE_JWT_SECRET": self.test_secret,
            "SUPABASE_URL": self.supabase_url
        }):
            with self.assertRaises(AuthenticationFailed) as ctx:
                self.auth.authenticate(request)
            self.assertIn("issuer", str(ctx.exception).lower())

    @override_settings(DEBUG=True)
    def test_invalid_audience_rejected(self):
        """Token with invalid audience must be rejected."""
        payload = {
            "sub": self.user_uuid,
            "email": "legit@example.com",
            "role": "authenticated",
            "aud": "malicious_audience",
            "exp": int(time.time()) + 3600,
        }
        token = jwt.encode(payload, self.test_secret, algorithm="HS256")

        request = MagicMock()
        request.META = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": self.test_secret, "SUPABASE_URL": ""}):
            with self.assertRaises(AuthenticationFailed) as ctx:
                self.auth.authenticate(request)
            self.assertIn("audience", str(ctx.exception).lower())

    def test_jwks_client_instantiation_uses_pyjwkclient(self):
        """
        Verify that SupabaseAuthentication._get_jwks_client() properly instantiates
        PyJWKClient with the expected Supabase JWKS endpoint URL without NameError.
        """
        from jwt import PyJWKClient

        SupabaseAuthentication._jwks_client = None
        try:
            with patch.dict("os.environ", {"SUPABASE_URL": "https://testproject.supabase.co"}):
                client = SupabaseAuthentication._get_jwks_client()
                self.assertIsNotNone(client)
                self.assertIsInstance(client, PyJWKClient)
                self.assertEqual(client.uri, "https://testproject.supabase.co/auth/v1/.well-known/jwks.json")
        finally:
            SupabaseAuthentication._jwks_client = None

    def test_jwks_pyjwkclient_error_raises_authentication_failed(self):
        """
        Verify that PyJWKClient errors during JWKS key retrieval are caught and
        translated into AuthenticationFailed (DRF 401) rather than raising HTTP 500.
        """
        import base64
        import json

        header_b64 = base64.urlsafe_b64encode(json.dumps({"alg": "ES256", "kid": "test-kid"}).encode()).decode().rstrip("=")
        payload_b64 = base64.urlsafe_b64encode(json.dumps({"sub": self.user_uuid, "exp": int(time.time()) + 3600}).encode()).decode().rstrip("=")
        sig_b64 = base64.urlsafe_b64encode(b"fakesignature").decode().rstrip("=")
        fake_es256_token = f"{header_b64}.{payload_b64}.{sig_b64}"

        request = MagicMock()
        request.META = {"HTTP_AUTHORIZATION": f"Bearer {fake_es256_token}"}

        mock_jwks = MagicMock()
        mock_jwks.get_signing_key_from_jwt.side_effect = PyJWKClientError("Network error fetching keys")

        with patch.object(SupabaseAuthentication, "_get_jwks_client", return_value=mock_jwks):
            with self.assertRaises(AuthenticationFailed) as ctx:
                self.auth.authenticate(request)
            self.assertIn("token validation failed", str(ctx.exception).lower())

    def test_user_a_and_user_b_token_distinct_identity(self):
        """
        Verify that authenticated tokens for User A and User B resolve to strictly distinct identities.
        """
        user_a_uuid = str(uuid.uuid4())
        user_b_uuid = str(uuid.uuid4())

        token_a = jwt.encode(
            {
                "sub": user_a_uuid,
                "email": "user_a@example.com",
                "role": "authenticated",
                "aud": "authenticated",
                "exp": int(time.time()) + 3600,
            },
            self.test_secret,
            algorithm="HS256",
        )
        token_b = jwt.encode(
            {
                "sub": user_b_uuid,
                "email": "user_b@example.com",
                "role": "authenticated",
                "aud": "authenticated",
                "exp": int(time.time()) + 3600,
            },
            self.test_secret,
            algorithm="HS256",
        )

        req_a = MagicMock()
        req_a.META = {"HTTP_AUTHORIZATION": f"Bearer {token_a}"}
        req_b = MagicMock()
        req_b.META = {"HTTP_AUTHORIZATION": f"Bearer {token_b}"}

        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": self.test_secret, "SUPABASE_URL": ""}):
            res_a = self.auth.authenticate(req_a)
            res_b = self.auth.authenticate(req_b)

            self.assertIsNotNone(res_a)
            self.assertIsNotNone(res_b)
            user_a, _ = res_a
            user_b, _ = res_b

            self.assertEqual(user_a.id, user_a_uuid)
            self.assertEqual(user_b.id, user_b_uuid)
            self.assertNotEqual(user_a.id, user_b.id)


class AuthenticatedEndpointsRegressionTests(TestCase):
    """
    Direct HTTP endpoint tests ensuring that:
      1. Valid JWT tokens succeed (HTTP 200) and derive distinct identities.
      2. Invalid, expired, and missing tokens fail with HTTP 401 (never HTTP 500).
    """

    def setUp(self):
        from rest_framework.test import APIClient
        self.client = APIClient()
        self.test_secret = "test-secret-key-for-endpoints-regression-tests!!"
        self.user_a_uuid = str(uuid.uuid4())
        self.user_b_uuid = str(uuid.uuid4())

        self.token_a = jwt.encode(
            {
                "sub": self.user_a_uuid,
                "email": "user_a@example.com",
                "role": "authenticated",
                "aud": "authenticated",
                "exp": int(time.time()) + 3600,
            },
            self.test_secret,
            algorithm="HS256",
        )
        self.token_b = jwt.encode(
            {
                "sub": self.user_b_uuid,
                "email": "user_b@example.com",
                "role": "authenticated",
                "aud": "authenticated",
                "exp": int(time.time()) + 3600,
            },
            self.test_secret,
            algorithm="HS256",
        )
        self.expired_token = jwt.encode(
            {
                "sub": self.user_a_uuid,
                "email": "user_a@example.com",
                "role": "authenticated",
                "aud": "authenticated",
                "exp": int(time.time()) - 100,
            },
            self.test_secret,
            algorithm="HS256",
        )

    def test_active_assessment_endpoint_status_codes(self):
        """
        Verify /api/v1/intelligence/assessment/active/ returns:
          - 200 for valid tokens
          - 401 for missing, invalid, or expired tokens (never 500)
        """
        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": self.test_secret, "SUPABASE_URL": ""}):
            # 1. Missing token -> 401
            res_missing = self.client.get("/api/v1/intelligence/assessment/active/?module=female_pcos")
            self.assertEqual(res_missing.status_code, 401)

            # 2. Invalid token -> 401
            self.client.credentials(HTTP_AUTHORIZATION="Bearer totally-invalid-token-format")
            res_invalid = self.client.get("/api/v1/intelligence/assessment/active/?module=female_pcos")
            self.assertEqual(res_invalid.status_code, 401)

            # 3. Expired token -> 401
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.expired_token}")
            res_expired = self.client.get("/api/v1/intelligence/assessment/active/?module=female_pcos")
            self.assertEqual(res_expired.status_code, 401)

            # 4. Valid token User A -> 200
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
            res_a = self.client.get("/api/v1/intelligence/assessment/active/?module=female_pcos")
            self.assertEqual(res_a.status_code, 200)
            self.assertEqual(res_a.data.get("patient_id"), self.user_a_uuid)

            # 5. Valid token User B -> 200 with distinct patient_id
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_b}")
            res_b = self.client.get("/api/v1/intelligence/assessment/active/?module=female_pcos")
            self.assertEqual(res_b.status_code, 200)
            self.assertEqual(res_b.data.get("patient_id"), self.user_b_uuid)
            self.assertNotEqual(res_a.data.get("patient_id"), res_b.data.get("patient_id"))

    def test_assessment_history_endpoint_status_codes(self):
        """
        Verify /api/v1/intelligence/assessment/history/ returns:
          - 200 for valid tokens
          - 401 for missing, invalid, or expired tokens (never 500)
        """
        with patch.dict("os.environ", {"SUPABASE_JWT_SECRET": self.test_secret, "SUPABASE_URL": ""}):
            # 1. Missing token -> 401
            res_missing = self.client.get("/api/v1/intelligence/assessment/history/?module=female_pcos")
            self.assertEqual(res_missing.status_code, 401)

            # 2. Invalid token -> 401
            self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid-token")
            res_invalid = self.client.get("/api/v1/intelligence/assessment/history/?module=female_pcos")
            self.assertEqual(res_invalid.status_code, 401)

            # 3. Expired token -> 401
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.expired_token}")
            res_expired = self.client.get("/api/v1/intelligence/assessment/history/?module=female_pcos")
            self.assertEqual(res_expired.status_code, 401)

            # 4. Valid token User A -> 200
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_a}")
            res_a = self.client.get("/api/v1/intelligence/assessment/history/?module=female_pcos")
            self.assertEqual(res_a.status_code, 200)

            # 5. Valid token User B -> 200
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token_b}")
            res_b = self.client.get("/api/v1/intelligence/assessment/history/?module=female_pcos")
            self.assertEqual(res_b.status_code, 200)

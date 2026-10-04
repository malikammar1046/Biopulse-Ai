"""
OvaSense Supabase JWT Authentication for Django REST Framework.

This authentication backend validates Supabase-issued JWT access tokens.
The authenticated user's UUID (sub claim) is the ONLY identity used for
all subsequent data access — the client can never override this.

Usage:
  Authorization: Bearer <supabase_access_token>

Security guarantees:
  - Token signature is verified against SUPABASE_JWT_SECRET
  - Expired tokens are rejected
  - The patient UUID is always extracted from the verified token, never from
    a client-supplied request body field
  - 401 Unauthorized is returned for missing, malformed, or expired tokens
"""

import logging
import os
from dataclasses import dataclass
from typing import Optional

import jwt
from jwt import PyJWKClient, PyJWKClientError
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

logger = logging.getLogger(__name__)


@dataclass
class SupabaseUser:
    """
    Lightweight user representation derived from a verified Supabase JWT.
    DRF views access request.user which will be an instance of this class.
    """
    id: str          # Supabase UUID (sub claim) — the authoritative patient identity
    email: str       # from JWT email claim
    role: str        # from JWT role claim (e.g. "authenticated")
    raw_token: str   # the original bearer token (needed to query Supabase on behalf of user)

    @property
    def is_authenticated(self) -> bool:
        """Required by DRF permission system."""
        return True

    def __str__(self) -> str:
        return f"SupabaseUser(id={self.id}, email={self.email})"


class SupabaseAuthentication(BaseAuthentication):
    """
    DRF Authentication class that validates Supabase JWT bearer tokens.
    DRF Authentication class that validates Supabase JWTs.

    Supports:
      1. Asymmetric verification via Supabase JWKS (ES256 / RS256)
      2. Symmetric verification via project JWT secret (HS256)

    SECURITY INVARIANT:
      No request may ever authenticate with an unverified signature, even in DEBUG mode.
    """

    BEARER_PREFIX = "Bearer "
    _jwks_client: Optional[PyJWKClient] = None

    @classmethod
    def _get_jwks_client(cls) -> Optional[PyJWKClient]:
        """Returns or lazily initializes the cached PyJWKClient for Supabase JWKS endpoint."""
        if cls._jwks_client is None:
            supabase_url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
            if supabase_url:
                jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
                cls._jwks_client = PyJWKClient(jwks_url, cache_keys=True)
        return cls._jwks_client

    def authenticate(self, request) -> tuple | None:
        """
        Attempt to authenticate the request.

        Returns:
            (SupabaseUser, token_str) if authentication succeeds.
            None if no Authorization header is present (lets other backends try).

        Raises:
            AuthenticationFailed if the header is present but invalid.
        """
        auth_header: str | None = request.META.get("HTTP_AUTHORIZATION", "")

        if not auth_header or not auth_header.startswith(self.BEARER_PREFIX):
            # No bearer token — let DRF try other authenticators or apply permission
            return None

        token = auth_header[len(self.BEARER_PREFIX):].strip()
        if not token:
            raise AuthenticationFailed("Bearer token is empty.")

        user = self._verify_token(token)
        return (user, token)

    def _verify_token(self, token: str) -> SupabaseUser:
        """
        Verify the Supabase JWT signature and claims, returning a SupabaseUser.

        Enforces strict signature verification, expiration, audience, issuer,
        and subject (sub) claims.
        """
        try:
            unverified_header = jwt.get_unverified_header(token)
        except Exception as exc:
            logger.warning("JWT header decode error: %s", exc)
            raise AuthenticationFailed("Token is malformed.") from exc

        alg = unverified_header.get("alg")
        if not alg or alg.lower() == "none":
            raise AuthenticationFailed("Unsigned tokens are strictly rejected.")

        payload = None

        # 1. Asymmetric verification via Supabase JWKS (ES256, RS256)
        if alg in ("ES256", "RS256"):
            jwks_client = self._get_jwks_client()
            if not jwks_client:
                logger.error("SUPABASE_URL is not configured for asymmetric JWT validation.")
                raise AuthenticationFailed("Authentication service is not properly configured.")
            try:
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=[alg],
                    options={"verify_signature": True, "verify_exp": True, "verify_aud": False},
                    leeway=60,
                )
            except jwt.ExpiredSignatureError:
                raise AuthenticationFailed("Session has expired. Please sign in again.")
            except jwt.ImmatureSignatureError:
                logger.warning("Token iat is in the future beyond acceptable leeway.")
                raise AuthenticationFailed("Token is not yet valid. Please check system clock.")
            except jwt.InvalidSignatureError:
                raise AuthenticationFailed("Token signature is invalid.")
            except jwt.DecodeError as exc:
                logger.warning("JWT decode error: %s", exc)
                raise AuthenticationFailed("Token is malformed.")
            except PyJWKClientError as exc:
                logger.warning("JWKS client error: %s", exc)
                raise AuthenticationFailed("Token validation failed.") from exc
            except Exception as exc:
                logger.warning("JWKS token validation error: %s", exc)
                raise AuthenticationFailed("Token validation failed.")

        # 2. Symmetric verification via project JWT secret (HS256)
        elif alg == "HS256":
            jwt_secret = os.environ.get("SUPABASE_JWT_SECRET", "").strip()
            if not jwt_secret:
                logger.error("SUPABASE_JWT_SECRET is not configured for HS256 JWT validation.")
                raise AuthenticationFailed("Authentication service is not configured. Please contact support.")
            try:
                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=["HS256"],
                    options={"verify_signature": True, "verify_exp": True, "verify_aud": False},
                    leeway=60,
                )
            except jwt.ExpiredSignatureError:
                raise AuthenticationFailed("Session has expired. Please sign in again.")
            except jwt.ImmatureSignatureError:
                logger.warning("Token iat is in the future beyond acceptable leeway.")
                raise AuthenticationFailed("Token is not yet valid. Please check system clock.")
            except jwt.InvalidSignatureError:
                raise AuthenticationFailed("Token signature is invalid.")
            except jwt.DecodeError as exc:
                logger.warning("JWT decode error: %s", exc)
                raise AuthenticationFailed("Token is malformed.")
            except Exception as exc:
                logger.warning("JWT validation error: %s", exc)
                raise AuthenticationFailed("Token validation failed.")

        else:
            raise AuthenticationFailed(f"Unsupported token algorithm '{alg}'.")

        # Validate essential claims
        user_id: str | None = payload.get("sub")
        if not user_id or not isinstance(user_id, str) or not user_id.strip():
            raise AuthenticationFailed("Token does not contain a valid user identity (sub claim).")

        # Validate issuer if SUPABASE_URL is configured
        supabase_url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
        if supabase_url:
            expected_iss = f"{supabase_url}/auth/v1"
            iss = payload.get("iss")
            if iss and iss.rstrip("/") != expected_iss:
                raise AuthenticationFailed("Token issuer does not match expected Supabase project.")

        # Validate audience
        aud = payload.get("aud")
        expected_aud = os.environ.get("SUPABASE_JWT_AUDIENCE", "authenticated").strip()
        if aud and aud != expected_aud:
            raise AuthenticationFailed("Token audience does not match expected audience.")

        email: str = payload.get("email", "")
        role: str = payload.get("role", "authenticated")

        return SupabaseUser(
            id=str(user_id).strip(),
            email=email,
            role=role,
            raw_token=token,
        )

    def authenticate_header(self, request) -> str:
        """
        Return the WWW-Authenticate header value for 401 responses.
        This is required by DRF to properly signal authentication is needed.
        """
        return 'Bearer realm="OvaSense Intelligence API"'

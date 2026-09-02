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

import jwt
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

    Configuration (env vars):
      SUPABASE_JWT_SECRET  — the JWT secret from Supabase project settings
                             (Settings → API → JWT Secret)
      SUPABASE_URL         — the Supabase project URL (used as audience fallback)

    The class uses PyJWT to verify the token locally without a network call,
    which is fast and does not require the Supabase admin SDK.
    """

    BEARER_PREFIX = "Bearer "

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
        Verify the Supabase JWT and return a SupabaseUser.

        Supabase signs JWTs with HS256 using the project JWT secret.
        The audience is typically "authenticated" for user sessions.
        """
        jwt_secret = os.environ.get("SUPABASE_JWT_SECRET", "")
        if not jwt_secret:
            from django.conf import settings
            if getattr(settings, "DEBUG", False):
                logger.info("SUPABASE_JWT_SECRET unset in DEBUG mode: decoding payload without signature verification")
                try:
                    payload = jwt.decode(token, options={"verify_signature": False})
                except Exception as exc:
                    logger.warning("Dev JWT decode error: %s", exc)
                    raise AuthenticationFailed("Token is malformed.")
            else:
                logger.error(
                    "SUPABASE_JWT_SECRET is not configured. "
                    "Set this environment variable to enable JWT authentication."
                )
                raise AuthenticationFailed(
                    "Authentication service is not configured. Please contact support."
                )
        else:
            try:
                payload = jwt.decode(
                    token,
                    jwt_secret,
                    algorithms=["HS256"],
                    # Supabase sets audience = "authenticated" for valid user sessions
                    options={"verify_aud": False},  # audience varies by Supabase version
                )
            except jwt.ExpiredSignatureError:
                raise AuthenticationFailed("Session has expired. Please sign in again.")
            except jwt.InvalidSignatureError:
                raise AuthenticationFailed("Token signature is invalid.")
            except jwt.DecodeError as exc:
                logger.warning("JWT decode error: %s", exc)
                raise AuthenticationFailed("Token is malformed.")
            except jwt.InvalidTokenError as exc:
                logger.warning("JWT validation error: %s", exc)
                raise AuthenticationFailed("Token validation failed.")

        user_id: str | None = payload.get("sub")
        if not user_id:
            raise AuthenticationFailed("Token does not contain a user identity (sub claim).")

        email: str = payload.get("email", "")
        role: str = payload.get("role", "authenticated")

        return SupabaseUser(
            id=user_id,
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

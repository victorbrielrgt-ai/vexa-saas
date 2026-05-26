"""
Security utilities.

Authentication strategy:
  - Supabase Auth is the single source of truth.
  - Every protected request must carry the Supabase-issued JWT as Bearer token.
  - The backend verifies the JWT locally using SUPABASE_JWT_SECRET (HS256).
  - On first request, a row is created in our `users` table linked by supabase_id.
  - No separate token exchange needed — the Supabase JWT IS the API token.
"""

import hashlib
import hmac
import logging
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.models import User

logger = logging.getLogger(__name__)
_bearer = HTTPBearer(auto_error=False)


# ── WhatsApp HMAC verification ─────────────────────────────────────────────────

def verify_whatsapp_signature(body: bytes, signature: str) -> bool:
    """Verify Evolution API / Meta webhook HMAC-SHA256 signature."""
    if settings.ENVIRONMENT == "development" and not settings.WHATSAPP_SECRET:
        return True
    if not signature.startswith("sha256="):
        return False
    expected = hmac.new(
        settings.WHATSAPP_SECRET.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


# ── Supabase JWT verification ──────────────────────────────────────────────────

def _verify_supabase_jwt(token: str) -> dict:
    """
    Verify and decode a Supabase-issued JWT.
    Returns the full payload (sub, email, role, aud, exp …).
    """
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_exp": True},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired — please log in again")
    except jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail="Invalid token audience")
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}")


# ── User upsert ────────────────────────────────────────────────────────────────

def _get_or_create_user(db: Session, payload: dict) -> User:
    """
    Fetch the VEXA user linked to this Supabase identity.
    Creates the row on first login (upsert by supabase_id).
    """
    supabase_id: str = payload["sub"]
    email: Optional[str] = payload.get("email")

    user = db.query(User).filter_by(supabase_id=supabase_id).first()
    if not user:
        # First ever login — create the profile row
        user = User(
            supabase_id=supabase_id,
            email=email,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("New user provisioned: supabase_id=%s email=%s", supabase_id, email)
    elif email and user.email != email:
        # Keep email in sync with Supabase (handles email-change flow)
        user.email = email
        db.commit()

    return user


# ── FastAPI dependency ─────────────────────────────────────────────────────────

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency that returns the authenticated VEXA User ORM object.
    Raises 401 if the token is missing, expired, or invalid.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = _verify_supabase_jwt(credentials.credentials)
    return _get_or_create_user(db, payload)


def get_current_user_id(
    current_user: User = Depends(get_current_user),
) -> str:
    """Convenience dependency — returns only the user UUID string."""
    return str(current_user.id)

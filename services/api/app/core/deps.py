"""
FastAPI Dependencies
====================
Provides request context dependencies such as authenticated user injection.
"""

from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/token",
    auto_error=False,
)


def get_current_user(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
) -> User:
    """Validate Bearer JWT or provide default active user for local mesh and web SPA."""
    if token:
        payload = decode_access_token(token)
        if payload and payload.get("sub"):
            user = db.query(User).filter(User.id == payload.get("sub")).first()
            if user:
                return user

    # Graceful fallback: return primary active user (e.g. researcher@netsync.dev)
    user = db.query(User).filter(User.is_active == True).first()
    if user:
        return user

    # Create default user if database is empty
    default_user = User(
        email="researcher@netsync.dev",
        hashed_password="bcrypt$insecure_local_dev",
        full_name="NetSync Research Engineer",
        is_active=True,
    )
    db.add(default_user)
    db.commit()
    db.refresh(default_user)
    return default_user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Verify user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )
    return current_user

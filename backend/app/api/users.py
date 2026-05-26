import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import User, CategoryLimit
from app.schemas import UserOut, UserUpdate, OnboardingUpdate
from app.services.expense_service import set_category_limit

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update profile fields. All fields are optional."""
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/onboarding", response_model=UserOut)
def complete_onboarding(
    payload: OnboardingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Save onboarding data in one call.
    Accepts name, income, goals, currency, step progress, initial limits.
    """
    update_data = payload.model_dump(exclude_none=True, exclude={"initial_limits"})
    for field, value in update_data.items():
        setattr(current_user, field, value)

    # Create initial limits if provided
    if payload.initial_limits:
        for lim in payload.initial_limits:
            if lim.get("category") and lim.get("amount"):
                set_category_limit(db, str(current_user.id), lim["category"], float(lim["amount"]))

    # If step is final, mark onboarding done
    if payload.onboarding_done:
        current_user.onboarding_done = True
        current_user.onboarding_step = 4

    db.commit()
    db.refresh(current_user)
    logger.info("Onboarding updated for user %s step=%s done=%s",
                current_user.id, current_user.onboarding_step, current_user.onboarding_done)
    return current_user

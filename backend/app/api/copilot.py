from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.insights_service import get_copilot_insights, get_streak_data

router = APIRouter(prefix="/copilot", tags=["copilot"])

@router.get("/insights")
def copilot_insights(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    """Real-time contextual insights ranked by priority."""
    return get_copilot_insights(db, user_id)

@router.get("/streak")
def streak(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    """Daily streak and achievement badges."""
    return get_streak_data(db, user_id)

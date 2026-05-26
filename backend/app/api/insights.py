import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas import FinancialScoreOut, AiInsightsOut, SpendingProjectionOut
from app.services.insights_service import (
    compute_financial_score,
    generate_ai_insights,
    get_spending_projection,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/score", response_model=FinancialScoreOut)
def get_score(
    year:  Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    today = date.today()
    return compute_financial_score(db, user_id, year or today.year, month or today.month)


@router.get("/ai", response_model=AiInsightsOut)
def get_ai_insights(
    year:  Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    today = date.today()
    return generate_ai_insights(db, user_id, year or today.year, month or today.month)


@router.get("/projection", response_model=SpendingProjectionOut)
def get_projection(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return get_spending_projection(db, user_id)

import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_id
from app.models.models import User
from app.schemas import (
    ExpenseCreate, ExpenseUpdate, ExpenseOut,
    LimitSet, LimitOut, MonthlySummary, DashboardSummary,
)
from app.services.expense_service import (
    save_expense, update_expense, soft_delete_expense,
    get_recent_expenses, get_monthly_summary, get_dashboard_summary,
    set_category_limit, delete_category_limit, get_limits,
)
from app.services.alert_engine import check_and_trigger_alerts

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/expenses", tags=["expenses"])


# ── Dashboard summary ─────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Single endpoint for the dashboard overview — avoids N separate calls."""
    return get_dashboard_summary(db, user_id)


# ── Expense CRUD ──────────────────────────────────────────────────────────────

@router.get("/", response_model=list[ExpenseOut])
def list_expenses(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return get_recent_expenses(db, user_id, limit=limit, offset=offset)


@router.post("/", response_model=ExpenseOut, status_code=201)
def create_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    expense = save_expense(db, user_id, payload.model_dump())
    # Trigger alert checks async (best-effort)
    try:
        check_and_trigger_alerts(db, user_id, expense.category)
    except Exception as exc:
        logger.warning("Alert check failed (non-fatal): %s", exc)
    return expense


@router.patch("/{expense_id}", response_model=ExpenseOut)
def patch_expense(
    expense_id: str,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    updated = update_expense(db, expense_id, user_id, payload.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    if not soft_delete_expense(db, expense_id, user_id):
        raise HTTPException(status_code=404, detail="Expense not found")


# ── Monthly summary ───────────────────────────────────────────────────────────

@router.get("/summary", response_model=MonthlySummary)
def monthly_summary(
    year:  Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    today = date.today()
    return get_monthly_summary(db, user_id, year or today.year, month or today.month)


# ── Category limits ───────────────────────────────────────────────────────────

@router.get("/limits", response_model=list[LimitOut])
def list_limits(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return get_limits(db, user_id)


@router.post("/limits", response_model=LimitOut, status_code=201)
def upsert_limit(
    payload: LimitSet,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return set_category_limit(db, user_id, payload.category, payload.amount, payload.period)


@router.delete("/limits/{limit_id}", status_code=204)
def remove_limit(
    limit_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    if not delete_category_limit(db, limit_id, user_id):
        raise HTTPException(status_code=404, detail="Limit not found")

"""
Expense business logic — all functions take user_id (VEXA UUID).
No phone-based lookups anywhere.
"""
from datetime import date
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import CategoryLimit, Expense, User


# ── Expense CRUD ──────────────────────────────────────────────────────────────

def save_expense(db: Session, user_id: str, data: Dict[str, Any]) -> Expense:
    expense = Expense(
        user_id=user_id,
        amount=data["amount"],
        category=data["category"],
        description=data.get("description"),
        raw_text=data.get("raw_text"),
        source=data.get("source", "web"),
        confidence=data.get("confidence", 1.0),
        tags=data.get("tags", []),
        is_recurring=data.get("is_recurring", False),
        expense_date=data.get("expense_date"),
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def update_expense(db: Session, expense_id: str, user_id: str, data: Dict[str, Any]) -> Optional[Expense]:
    expense = db.query(Expense).filter_by(id=expense_id, user_id=user_id, is_deleted=False).first()
    if not expense:
        return None
    for field, value in data.items():
        if value is not None:
            setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


def soft_delete_expense(db: Session, expense_id: str, user_id: str) -> bool:
    expense = db.query(Expense).filter_by(id=expense_id, user_id=user_id, is_deleted=False).first()
    if not expense:
        return False
    expense.is_deleted = True
    db.commit()
    return True


def get_recent_expenses(db: Session, user_id: str, limit: int = 20, offset: int = 0) -> List[Expense]:
    return (
        db.query(Expense)
        .filter_by(user_id=user_id, is_deleted=False)
        .order_by(Expense.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


# ── Category Limits ───────────────────────────────────────────────────────────

def set_category_limit(db: Session, user_id: str, category: str, amount: float, period: str = "monthly") -> CategoryLimit:
    existing = db.query(CategoryLimit).filter_by(user_id=user_id, category=category).first()
    if existing:
        existing.amount = amount
        existing.period = period
        existing.alert_70_sent = False
        existing.alert_90_sent = False
        existing.alert_100_sent = False
        db.commit()
        db.refresh(existing)
        return existing
    lim = CategoryLimit(user_id=user_id, category=category, amount=amount, period=period)
    db.add(lim)
    db.commit()
    db.refresh(lim)
    return lim


def delete_category_limit(db: Session, limit_id: str, user_id: str) -> bool:
    lim = db.query(CategoryLimit).filter_by(id=limit_id, user_id=user_id).first()
    if not lim:
        return False
    db.delete(lim)
    db.commit()
    return True


def get_limits(db: Session, user_id: str) -> List[CategoryLimit]:
    return db.query(CategoryLimit).filter_by(user_id=user_id).all()


# ── Monthly Summary ───────────────────────────────────────────────────────────

def get_monthly_summary(db: Session, user_id: str, year: int, month: int) -> dict:
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)

    rows = (
        db.query(Expense.category, func.sum(Expense.amount), func.count(Expense.id))
        .filter(
            Expense.user_id == user_id,
            Expense.is_deleted == False,
            Expense.created_at >= start,
            Expense.created_at < end,
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    limits = {lim.category: lim.amount for lim in get_limits(db, user_id)}
    total = sum(r[1] for r in rows)
    count = sum(r[2] for r in rows)
    days = (date.today() - start).days or 1

    categories = []
    for category, cat_total, cat_count in rows:
        lim = limits.get(category)
        categories.append({
            "category": category,
            "total": round(cat_total, 2),
            "count": cat_count,
            "limit": lim,
            "percent_used": round((cat_total / lim) * 100, 1) if lim else None,
        })

    return {
        "year": year,
        "month": month,
        "period": f"{year}-{month:02d}",
        "total": round(total, 2),
        "count": count,
        "categories": categories,
        "daily_avg": round(total / days, 2) if days > 0 else 0,
    }


def get_dashboard_summary(db: Session, user_id: str) -> dict:
    today = date.today()
    year, month = today.year, today.month

    # Current month
    current = get_monthly_summary(db, user_id, year, month)

    # Previous month
    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    previous = get_monthly_summary(db, user_id, prev_year, prev_month)

    # MoM change
    if previous["total"] > 0:
        mom_pct = round(((current["total"] - previous["total"]) / previous["total"]) * 100, 1)
    else:
        mom_pct = 0.0

    # Projection
    days_elapsed = today.day
    days_in_month = 31  # conservative
    daily_avg = current["total"] / days_elapsed if days_elapsed > 0 else 0
    projected = round(daily_avg * days_in_month, 2)

    # Unread alerts
    from app.models.models import Alert
    unread = db.query(func.count(Alert.id)).filter_by(user_id=user_id, is_read=False, is_dismissed=False).scalar() or 0

    limits = get_limits(db, user_id)

    top = current["categories"][0]["category"] if current["categories"] else None

    return {
        "current_month_total": current["total"],
        "previous_month_total": previous["total"],
        "month_over_month_pct": mom_pct,
        "projected_month_total": projected,
        "daily_average": round(daily_avg, 2),
        "days_elapsed": days_elapsed,
        "days_remaining": days_in_month - days_elapsed,
        "top_category": top,
        "active_limits": len(limits),
        "unread_alerts": unread,
        "categories": current["categories"],
    }

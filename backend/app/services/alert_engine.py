"""Alert engine — creates DB-persisted Alert rows when limits are breached."""
import logging
from datetime import date
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import Alert, CategoryLimit, Expense

logger = logging.getLogger(__name__)


def _create_alert(db: Session, user_id: str, **kwargs) -> Alert:
    alert = Alert(user_id=user_id, **kwargs)
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def check_and_trigger_alerts(db: Session, user_id: str, category: str) -> None:
    """
    Called after every new expense.
    Checks if the category has hit 70 / 90 / 100% of its monthly limit
    and creates an Alert row if so (and it hasn't been created yet).
    """
    limit = db.query(CategoryLimit).filter_by(user_id=user_id, category=category).first()
    if not limit:
        return

    today = date.today()
    start = today.replace(day=1)

    spent = (
        db.query(func.sum(Expense.amount))
        .filter(
            Expense.user_id == user_id,
            Expense.category == category,
            Expense.is_deleted == False,
            Expense.created_at >= start,
        )
        .scalar() or 0.0
    )

    pct = (spent / limit.amount) * 100

    if pct >= 100 and not limit.alert_100_sent:
        _create_alert(db, user_id,
            type="limit_warning", severity="critical",
            title=f"{category.capitalize()} budget exceeded",
            message=f"You've spent R${spent:.2f} — your R${limit.amount:.2f} limit for {category} has been exceeded.",
            category=category, amount=spent,
        )
        limit.alert_100_sent = True
        db.commit()

    elif pct >= 90 and not limit.alert_90_sent:
        _create_alert(db, user_id,
            type="limit_warning", severity="warning",
            title=f"{category.capitalize()} budget at 90%",
            message=f"You've used R${spent:.2f} of your R${limit.amount:.2f} {category} budget (90%).",
            category=category, amount=spent,
        )
        limit.alert_90_sent = True
        db.commit()

    elif pct >= 70 and not limit.alert_70_sent:
        _create_alert(db, user_id,
            type="limit_warning", severity="info",
            title=f"{category.capitalize()} budget at 70%",
            message=f"Heads up — you've used R${spent:.2f} of your R${limit.amount:.2f} {category} budget.",
            category=category, amount=spent,
        )
        limit.alert_70_sent = True
        db.commit()

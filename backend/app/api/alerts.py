import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.models import Alert
from app.schemas import AlertOut

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertOut])
def list_alerts(
    unread_only: bool = Query(False),
    severity: Optional[str] = Query(None),
    limit: int = Query(30, le=100),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    q = db.query(Alert).filter_by(user_id=user_id, is_dismissed=False)
    if unread_only:
        q = q.filter_by(is_read=False)
    if severity:
        q = q.filter(Alert.severity == severity)
    return q.order_by(Alert.created_at.desc()).limit(limit).all()


@router.patch("/{alert_id}/read", response_model=AlertOut)
def mark_read(
    alert_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    alert = db.query(Alert).filter_by(id=alert_id, user_id=user_id).first()
    if not alert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert


@router.patch("/read-all", status_code=204)
def mark_all_read(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    db.query(Alert).filter_by(user_id=user_id, is_read=False).update({"is_read": True})
    db.commit()


@router.patch("/{alert_id}/dismiss", status_code=204)
def dismiss_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    alert = db.query(Alert).filter_by(id=alert_id, user_id=user_id).first()
    if alert:
        alert.is_dismissed = True
        db.commit()

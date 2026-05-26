"""WhatsApp webhook — Evolution API compatible."""
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_whatsapp_signature
from app.models.models import User
from app.services.ai_service import classify_expense_text
from app.services.expense_service import save_expense
from app.services.whatsapp_service import send_whatsapp_message

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["webhook"])


@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None, alias="x-hub-signature-256"),
    db: Session = Depends(get_db),
):
    body = await request.body()

    if not verify_whatsapp_signature(body, x_hub_signature_256 or ""):
        raise HTTPException(status_code=403, detail="Invalid signature")

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Extract message
    try:
        msg_data = data["data"]["message"]
        phone = msg_data["key"]["remoteJid"].replace("@s.whatsapp.net", "")
        text = msg_data.get("message", {}).get("conversation", "")
    except (KeyError, TypeError):
        return {"status": "ignored"}

    if not text:
        return {"status": "no_text"}

    # Find user by phone (WhatsApp users link their phone via settings)
    user = db.query(User).filter_by(phone=phone).first()
    if not user:
        await send_whatsapp_message(phone,
            "Hi! You're not registered with VEXA yet. Sign up at vexa.app 🚀")
        return {"status": "unregistered"}

    # Classify the expense text
    result = await classify_expense_text(text)
    if not result or not result.get("amount"):
        await send_whatsapp_message(phone,
            "I couldn't identify an expense in that message. Try: *Lunch R$35* 🍽️")
        return {"status": "unclassified"}

    expense = save_expense(db, str(user.id), {
        "amount": result["amount"],
        "category": result["category"],
        "description": result.get("description", text),
        "raw_text": text,
        "source": "whatsapp",
        "confidence": result.get("confidence", 0.9),
    })

    await send_whatsapp_message(phone,
        f"✅ Registered: *{expense.description}* — R${expense.amount:.2f} ({expense.category})")

    return {"status": "ok", "expense_id": expense.id}


@router.get("/whatsapp")
def webhook_verify(
    hub_mode: str = None,
    hub_challenge: str = None,
    hub_verify_token: str = None,
):
    """Meta webhook verification endpoint."""
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_SECRET:
        return int(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")

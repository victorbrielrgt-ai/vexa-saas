"""WhatsApp messaging via Evolution API."""
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_whatsapp_message(phone: str, message: str) -> bool:
    if not settings.EVOLUTION_API_URL or not settings.EVOLUTION_API_KEY:
        logger.debug("WhatsApp not configured, skipping send to %s", phone)
        return False

    url = f"{settings.EVOLUTION_API_URL}/message/sendText/{settings.EVOLUTION_INSTANCE}"
    payload = {"number": phone, "options": {"delay": 500}, "textMessage": {"text": message}}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=payload, headers={"apikey": settings.EVOLUTION_API_KEY})
            resp.raise_for_status()
            return True
    except Exception as exc:
        logger.error("WhatsApp send failed: %s", exc)
        return False

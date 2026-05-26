"""Claude AI client — expense classification + insights."""
import json
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

CATEGORIES = [
    "alimentacao", "transporte", "lazer", "saude",
    "moradia", "roupas", "educacao", "outros",
]


def get_client():
    if not settings.ANTHROPIC_API_KEY:
        return None
    import anthropic
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


async def classify_expense_text(text: str) -> Optional[dict]:
    """
    Classify a free-text expense message.
    Returns {amount, category, description, confidence} or None.
    """
    client = get_client()
    if not client:
        return _mock_classify(text)

    prompt = f"""Extract expense info from this message. Respond ONLY with valid JSON, no markdown.

Message: "{text}"
Categories: {', '.join(CATEGORIES)}

JSON format:
{{"amount": <number>, "category": "<category>", "description": "<short description>", "confidence": <0.0-1.0>}}

If no expense found, return: {{"amount": null}}"""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        return json.loads(raw)
    except Exception as exc:
        logger.error("AI classify failed: %s", exc)
        return _mock_classify(text)


def _mock_classify(text: str) -> dict:
    """Fallback parser for when AI is unavailable."""
    import re
    match = re.search(r"R?\$?\s*(\d+(?:[.,]\d{1,2})?)", text)
    if not match:
        return {"amount": None}
    amount = float(match.group(1).replace(",", "."))
    text_lower = text.lower()
    category = "outros"
    if any(w in text_lower for w in ["comida","food","almoco","lanche","restaurante","ifood","pizza","mercado"]):
        category = "alimentacao"
    elif any(w in text_lower for w in ["uber","taxi","onibus","gasolina","combustivel","transporte"]):
        category = "transporte"
    elif any(w in text_lower for w in ["netflix","cinema","game","lazer","show"]):
        category = "lazer"
    elif any(w in text_lower for w in ["farmacia","medico","saude","remedio","hospital"]):
        category = "saude"
    elif any(w in text_lower for w in ["aluguel","condominio","agua","luz","moradia"]):
        category = "moradia"
    return {"amount": amount, "category": category, "description": text[:80], "confidence": 0.7}

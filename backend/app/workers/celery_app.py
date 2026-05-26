import logging

from celery import Celery

from app.core.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "vexa",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


@celery_app.task(bind=True, name="vexa.process_message", max_retries=3)
def process_message_task(self, phone: str, text: str, msg_type: str = "text"):
    """
    Core pipeline:
    1. Get/create user
    2. Classify message with Claude
    3. If expense → save + check limits + reply
    4. If command → handle intent
    """
    from app.core.database import get_db_ctx
    from app.services.ai_service import classify_message
    from app.services.expense_service import get_or_create_user, save_expense, get_monthly_summary
    from app.services.alert_engine import check_limits
    from app.services.whatsapp_service import send_message, build_expense_reply

    logger.info("Processing message: phone=%s type=%s text=%.60s", phone, msg_type, text)

    try:
        result = classify_message(text)

        with get_db_ctx() as db:
            user = get_or_create_user(db, phone)

            if result.get("is_expense"):
                expense = save_expense(db, user.id, {**result, "raw_text": text, "source": msg_type})
                alert = check_limits(db, user.id, result.get("category", "outros"))
                reply = build_expense_reply(result, alert)
                send_message(phone, reply)
                return {"status": "expense_saved", "expense_id": expense.id}

            intent = result.get("intent", "unknown")
            logger.info("Non-expense intent=%s for phone=%s", intent, phone)

            if intent == "query_summary":
                from datetime import date
                today = date.today()
                summary = get_monthly_summary(db, user.id, today.year, today.month)
                total = sum(s["total"] for s in summary)
                lines = [f"📊 *Resumo de {today.strftime('%B/%Y')}*", f"Total: R${total:.2f}", ""]
                for s in summary:
                    bar = "█" * int((s["total"] / total * 10)) if total > 0 else ""
                    lines.append(f"{s['category'].capitalize()}: R${s['total']:.2f} {bar}")
                send_message(phone, "\n".join(lines))
                return {"status": "summary_sent"}

            if intent == "help":
                send_message(
                    phone,
                    "🤖 *VEXA — Como usar:*\n\n"
                    "• Digite um gasto: _'gastei 45 no iFood'_\n"
                    "• Envie áudio descrevendo o gasto\n"
                    "• Fotografe um comprovante\n"
                    "• */resumo* — ver gastos do mês\n"
                    "• */limite alimentacao 500* — definir limite\n"
                    "• */ajuda* — esta mensagem",
                )
                return {"status": "help_sent"}

            send_message(phone, "Não entendi 🤔 Tente: _'gastei 45 no iFood'_ ou */ajuda*")
            return {"status": "unknown_intent"}

    except Exception as exc:
        logger.error("Task failed for phone=%s: %s", phone, exc, exc_info=True)
        raise self.retry(exc=exc, countdown=5)

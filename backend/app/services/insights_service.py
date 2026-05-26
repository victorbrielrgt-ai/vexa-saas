import json
import logging
from datetime import date
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Expense, CategoryLimit, User
from app.services.expense_service import get_monthly_summary

logger = logging.getLogger(__name__)

GRADE_MAP = [(950,"A+"),(900,"A"),(800,"B+"),(750,"B"),(650,"C+"),(600,"C"),(500,"D"),(0,"F")]


def _grade(score: int) -> str:
    for threshold, grade in GRADE_MAP:
        if score >= threshold:
            return grade
    return "F"


def compute_financial_score(db: Session, user_id: str, year: int, month: int) -> dict:
    start = date(year, month, 1)
    end = date(year+1,1,1) if month==12 else date(year,month+1,1)

    total_spent = (db.query(func.sum(Expense.amount))
        .filter(Expense.user_id==user_id, Expense.is_deleted==False,
                Expense.created_at>=start, Expense.created_at<end)
        .scalar() or 0.0)

    user = db.query(User).filter_by(id=user_id).first()
    income = user.monthly_income if user and user.monthly_income else None

    # 1. Savings (0-250)
    if income and income > 0:
        rate = max(0, (income - total_spent) / income)
        savings_score = min(250, int(rate * 350))
    else:
        savings_score = 125

    # 2. Consistency (0-250) — spread of expenses across days
    days_active = (db.query(func.count(func.distinct(func.date(Expense.created_at))))
        .filter(Expense.user_id==user_id, Expense.is_deleted==False,
                Expense.created_at>=start, Expense.created_at<end)
        .scalar() or 0)
    days_in_month = (end - start).days
    consistency_score = min(250, int((days_active / max(days_in_month, 1)) * 300))

    # 3. Limit adherence (0-250)
    limits = db.query(CategoryLimit).filter_by(user_id=user_id).all()
    if limits:
        scores = []
        for lim in limits:
            cat_spent = (db.query(func.sum(Expense.amount))
                .filter(Expense.user_id==user_id, Expense.category==lim.category,
                        Expense.is_deleted==False,
                        Expense.created_at>=start, Expense.created_at<end)
                .scalar() or 0.0)
            ratio = cat_spent / lim.amount if lim.amount > 0 else 0
            scores.append(250 if ratio<=0.7 else 180 if ratio<=0.9 else 100 if ratio<=1.0 else 0)
        limit_adherence_score = int(sum(scores)/len(scores))
    else:
        limit_adherence_score = 125

    # 4. Trend (0-250) — vs previous month
    if month == 1:
        ps, pe = date(year-1,12,1), start
    else:
        ps, pe = date(year,month-1,1), start

    prev_spent = (db.query(func.sum(Expense.amount))
        .filter(Expense.user_id==user_id, Expense.is_deleted==False,
                Expense.created_at>=ps, Expense.created_at<pe)
        .scalar() or 0.0)

    if prev_spent > 0 and total_spent > 0:
        change = (prev_spent - total_spent) / prev_spent
        trend_score = min(250, max(0, 125 + int(change * 200)))
    else:
        trend_score = 125

    total = savings_score + consistency_score + limit_adherence_score + trend_score

    return {
        "score": total,
        "grade": _grade(total),
        "period": f"{year}-{month:02d}",
        "components": {
            "savings": savings_score,
            "consistency": consistency_score,
            "limit_adherence": limit_adherence_score,
            "trend": trend_score,
        },
        "total_spent": round(total_spent, 2),
        "monthly_income": income,
    }


def generate_ai_insights(db: Session, user_id: str, year: int, month: int) -> dict:
    summary = get_monthly_summary(db, user_id, year, month)
    score_data = compute_financial_score(db, user_id, year, month)

    if not summary["categories"]:
        return {
            "summary": "No expenses recorded this month. Start tracking to unlock AI insights.",
            "top_insight": "Add your first expense to get started.",
            "recommendations": [
                "Set your monthly income to enable financial scoring.",
                "Create budget limits per category.",
                "Add expenses via web or WhatsApp.",
            ],
            "risk_flags": [],
            "positive_highlights": [],
        }

    if not settings.ANTHROPIC_API_KEY:
        return _mock_insights(summary["categories"], score_data)

    prompt = f"""You are VEXA, an AI financial copilot. Analyze this financial data and respond ONLY with valid JSON.

Score: {score_data['score']}/1000 (Grade: {score_data['grade']})
Total Spent: R${score_data['total_spent']:.2f}
Income: {'R$'+str(score_data['monthly_income']) if score_data['monthly_income'] else 'Not set'}
Period: {year}-{month:02d}

Spending by Category:
{json.dumps(summary['categories'], indent=2, default=str)}

JSON format (no markdown, no extra text):
{{"summary":"2-3 sentence executive summary","top_insight":"single most impactful insight","recommendations":["action 1","action 2","action 3"],"risk_flags":["category names over 90% limit"],"positive_highlights":["category names under 70% limit"]}}"""

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        resp = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.content[0].text.strip().replace("```json","").replace("```","").strip()
        return json.loads(raw)
    except Exception as exc:
        logger.error("AI insights failed: %s", exc)
        return _mock_insights(summary["categories"], score_data)


def _mock_insights(categories: list, score_data: dict) -> dict:
    top = categories[0] if categories else {}
    risk = [c["category"] for c in categories if c.get("percent_used") and c["percent_used"]>=90]
    positive = [c["category"] for c in categories if c.get("percent_used") and c["percent_used"]<70]
    return {
        "summary": f"You spent R${score_data['total_spent']:.2f} this month with a score of {score_data['score']}/1000. {'Spending is under control.' if score_data['score']>700 else 'There are opportunities to improve.'}",
        "top_insight": f"'{top.get('category','').capitalize()}' is your top category at R${top.get('total',0):.2f}." if top else "Add expenses to get insights.",
        "recommendations": [
            "Set monthly limits for your top spending categories.",
            "Review recurring subscriptions for savings opportunities.",
            "Track daily spending to stay consistent.",
        ],
        "risk_flags": risk,
        "positive_highlights": positive,
    }


def get_spending_projection(db: Session, user_id: str) -> dict:
    today = date.today()
    start = today.replace(day=1)
    days_elapsed = today.day or 1

    total = (db.query(func.sum(Expense.amount))
        .filter(Expense.user_id==user_id, Expense.is_deleted==False,
                Expense.created_at>=start)
        .scalar() or 0.0)

    daily_avg = total / days_elapsed
    days_in_month = 31
    return {
        "current_total": round(total, 2),
        "daily_average": round(daily_avg, 2),
        "projected_month_total": round(daily_avg * days_in_month, 2),
        "days_elapsed": days_elapsed,
        "days_remaining": max(0, days_in_month - days_elapsed),
    }


# ── Copilot intelligence layer ─────────────────────────────────────────────────

def get_copilot_insights(db: Session, user_id: str) -> list:
    """
    Returns a ranked list of real-time, contextual insight objects.
    Each insight has: type, severity, headline, body, cta, icon, data.
    """
    from app.models.models import Expense, CategoryLimit, Alert, User
    from datetime import date, timedelta

    today = date.today()
    start_month = today.replace(day=1)
    week_ago    = today - timedelta(days=7)
    prev_week   = today - timedelta(days=14)

    user   = db.query(User).filter_by(id=user_id).first()
    income = user.monthly_income if user and user.monthly_income else None

    def _spent(since, until=None, category=None):
        q = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.is_deleted == False,
            Expense.created_at >= since,
        )
        if until: q = q.filter(Expense.created_at < until)
        if category: q = q.filter(Expense.category == category)
        return q.scalar() or 0.0

    insights = []

    # 1. Spending pace / end-of-month projection
    mtd     = _spent(start_month)
    days_in = today.day or 1
    daily   = mtd / days_in
    days_left = 31 - days_in
    projection = mtd + daily * days_left

    if income and income > 0:
        proj_pct = (projection / income) * 100
        if proj_pct > 95:
            insights.append({
                "type": "warning", "severity": "critical", "icon": "🔴",
                "headline": "Budget risk — projected to exceed income",
                "body": f"At your current pace of R${daily:.0f}/day, you'll spend R${projection:.0f} this month — {proj_pct:.0f}% of your income.",
                "cta": "Review limits",
                "cta_href": "/dashboard/limits",
                "data": {"projection": round(projection, 2), "income": income},
            })
        elif proj_pct > 80:
            insights.append({
                "type": "caution", "severity": "warning", "icon": "🟡",
                "headline": f"On track to spend {proj_pct:.0f}% of income",
                "body": f"Projected end-of-month: R${projection:.0f}. You have R${max(0, income - mtd):.0f} left this month.",
                "cta": "See projection",
                "cta_href": "/dashboard/insights",
                "data": {"projection": round(projection, 2)},
            })

    # 2. Category week-over-week spike detection
    cats = db.query(Expense.category).filter(
        Expense.user_id == user_id, Expense.is_deleted == False
    ).distinct().all()
    for (cat,) in cats:
        this_week = _spent(week_ago, category=cat)
        last_week = _spent(prev_week, week_ago, category=cat)
        if last_week > 10 and this_week > 0:
            pct_change = ((this_week - last_week) / last_week) * 100
            if pct_change > 40:
                insights.append({
                    "type": "spike", "severity": "info", "icon": "📈",
                    "headline": f"{cat.capitalize()} spending up {pct_change:.0f}% this week",
                    "body": f"You spent R${this_week:.0f} on {cat} this week vs R${last_week:.0f} last week.",
                    "cta": "View expenses",
                    "cta_href": "/dashboard/expenses",
                    "data": {"category": cat, "pct_change": round(pct_change, 1)},
                })

    # 3. Limit approaching alerts
    limits = db.query(CategoryLimit).filter_by(user_id=user_id).all()
    for lim in limits:
        spent = _spent(start_month, category=lim.category)
        pct   = (spent / lim.amount) * 100 if lim.amount else 0
        remaining_budget = lim.amount - spent
        days_at_pace = int(remaining_budget / daily) if daily > 0 else 99
        if 70 <= pct < 90:
            insights.append({
                "type": "limit", "severity": "warning", "icon": "⚠️",
                "headline": f"{lim.category.capitalize()} at {pct:.0f}% of limit",
                "body": f"R${spent:.0f} of R${lim.amount:.0f} used. At current pace, limit hit in ~{days_at_pace} days.",
                "cta": "Adjust limit",
                "cta_href": "/dashboard/limits",
                "data": {"category": lim.category, "pct": round(pct, 1)},
            })

    # 4. Positive: savings streak
    if income and income > 0:
        savings_rate = (income - mtd) / income
        if savings_rate > 0.3 and days_in > 10:
            insights.append({
                "type": "positive", "severity": "info", "icon": "✨",
                "headline": f"Great job — {savings_rate*100:.0f}% saved so far this month",
                "body": f"You've saved R${(income-mtd):.0f} of your income. You're on track for your best month.",
                "cta": None, "cta_href": None,
                "data": {"savings_rate": round(savings_rate, 3)},
            })

    # 5. Positive: spending less than last month
    prev_month = today.month - 1 if today.month > 1 else 12
    prev_year  = today.year if today.month > 1 else today.year - 1
    prev_start = date(prev_year, prev_month, 1)
    prev_end   = start_month
    prev_mtd_equiv = _spent(prev_start, date(prev_year, prev_month, days_in)) if days_in > 5 else 0
    if prev_mtd_equiv > 0 and mtd < prev_mtd_equiv * 0.9:
        saved = prev_mtd_equiv - mtd
        insights.append({
            "type": "positive", "severity": "info", "icon": "🏆",
            "headline": f"Spending R${saved:.0f} less than last month at this point",
            "body": f"Month-over-month comparison: R${mtd:.0f} now vs R${prev_mtd_equiv:.0f} last month ({((prev_mtd_equiv-mtd)/prev_mtd_equiv*100):.0f}% reduction).",
            "cta": None, "cta_href": None,
            "data": {"saved": round(saved, 2)},
        })

    # Priority sort: critical first, then warnings, then positives
    order = {"critical": 0, "warning": 1, "info": 2}
    insights.sort(key=lambda x: order.get(x["severity"], 3))

    return insights[:5]  # Max 5 insights at a time


def get_streak_data(db: Session, user_id: str) -> dict:
    """Calculate daily tracking streak and achievements."""
    from app.models.models import Expense
    from datetime import date, timedelta

    today = date.today()
    streak = 0
    d = today
    while True:
        next_d = d - timedelta(days=1)
        has = db.query(Expense.id).filter(
            Expense.user_id == user_id,
            Expense.is_deleted == False,
            func.date(Expense.created_at) == d,
        ).first()
        if not has:
            break
        streak += 1
        d = next_d
        if streak > 365:
            break

    # Total months tracked
    first = db.query(func.min(Expense.created_at)).filter_by(user_id=user_id).scalar()
    months_tracked = 0
    if first:
        delta = today - first.date()
        months_tracked = max(1, delta.days // 30)

    return {
        "streak_days": streak,
        "months_tracked": months_tracked,
        "achievements": _get_achievements(streak, months_tracked),
    }


def _get_achievements(streak: int, months: int) -> list:
    badges = []
    if streak >= 1:  badges.append({"id": "first_track", "label": "First track",  "icon": "🌱", "unlocked": True})
    if streak >= 7:  badges.append({"id": "week_streak", "label": "Week streak",   "icon": "🔥", "unlocked": True})
    if streak >= 30: badges.append({"id": "month_hero",  "label": "Month hero",    "icon": "🏆", "unlocked": True})
    if months >= 3:  badges.append({"id": "consistent",  "label": "Consistent",    "icon": "💎", "unlocked": True})
    # Locked
    if streak < 7:   badges.append({"id": "week_streak", "label": "7-day streak",  "icon": "🔥", "unlocked": False})
    if streak < 30:  badges.append({"id": "month_hero",  "label": "Month hero",    "icon": "🏆", "unlocked": False})
    return badges[:6]

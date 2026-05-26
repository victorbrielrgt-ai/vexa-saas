from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# ── User ──────────────────────────────────────────────────────────────────────
class UserOut(BaseModel):
    id: str
    supabase_id: str
    email: Optional[str]
    name: Optional[str]
    avatar_url: Optional[str]
    currency: str
    locale: str
    monthly_income: Optional[float]
    financial_goal: Optional[str]
    risk_tolerance: str
    onboarding_done: bool
    onboarding_step: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    locale: Optional[str] = None
    monthly_income: Optional[float] = Field(None, gt=0)
    financial_goal: Optional[str] = None
    risk_tolerance: Optional[str] = None
    avatar_url: Optional[str] = None


class OnboardingUpdate(BaseModel):
    name: Optional[str] = None
    monthly_income: Optional[float] = Field(None, gt=0)
    financial_goal: Optional[str] = None
    currency: Optional[str] = None
    onboarding_step: Optional[int] = None
    onboarding_done: Optional[bool] = None
    initial_limits: Optional[List[dict]] = None   # [{category, amount}]


# ── Expense ───────────────────────────────────────────────────────────────────
class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0)
    category: str
    description: Optional[str] = None
    source: Optional[str] = "web"
    expense_date: Optional[datetime] = None
    tags: Optional[List[str]] = []


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    description: Optional[str] = None
    expense_date: Optional[datetime] = None
    tags: Optional[List[str]] = None


class ExpenseOut(BaseModel):
    id: str
    user_id: str
    amount: float
    category: str
    description: Optional[str]
    source: str
    confidence: float
    tags: List[str]
    is_recurring: bool
    expense_date: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Category Limit ────────────────────────────────────────────────────────────
class LimitSet(BaseModel):
    category: str
    amount: float = Field(..., gt=0)
    period: str = "monthly"


class LimitOut(BaseModel):
    id: str
    user_id: str
    category: str
    amount: float
    period: str
    alert_70_sent: bool
    alert_90_sent: bool
    alert_100_sent: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Summary / Analytics ───────────────────────────────────────────────────────
class CategorySummary(BaseModel):
    category: str
    total: float
    count: int
    limit: Optional[float]
    percent_used: Optional[float]


class MonthlySummary(BaseModel):
    year: int
    month: int
    period: str
    total: float
    count: int
    categories: List[CategorySummary]
    daily_avg: float


class DashboardSummary(BaseModel):
    current_month_total: float
    previous_month_total: float
    month_over_month_pct: float
    projected_month_total: float
    daily_average: float
    days_elapsed: int
    days_remaining: int
    top_category: Optional[str]
    active_limits: int
    unread_alerts: int
    categories: List[CategorySummary]


# ── Financial Score ───────────────────────────────────────────────────────────
class ScoreComponents(BaseModel):
    savings: int
    consistency: int
    limit_adherence: int
    trend: int


class FinancialScoreOut(BaseModel):
    score: int
    grade: str
    period: str
    components: ScoreComponents
    total_spent: float
    monthly_income: Optional[float]


# ── Insights ──────────────────────────────────────────────────────────────────
class AiInsightsOut(BaseModel):
    summary: str
    top_insight: str
    recommendations: List[str]
    risk_flags: List[str] = []
    positive_highlights: List[str] = []


class SpendingProjectionOut(BaseModel):
    current_total: float
    daily_average: float
    projected_month_total: float
    days_elapsed: int
    days_remaining: int


# ── Alert ─────────────────────────────────────────────────────────────────────
class AlertOut(BaseModel):
    id: str
    type: str
    severity: str
    title: str
    message: str
    category: Optional[str]
    amount: Optional[float]
    is_read: bool
    is_dismissed: bool
    created_at: datetime

    class Config:
        from_attributes = True

"""
SQLAlchemy ORM models.

Auth strategy: Supabase Auth is the single source of truth.
  - User.supabase_id  → auth.users.id  (UUID string from Supabase JWT "sub")
  - User.email        → kept in sync with Supabase on every login
  - No passwords stored here — Supabase handles auth completely
"""
import uuid
from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, JSON, String, Text, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


def _uuid():
    return str(uuid.uuid4())


# ── User ──────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id           = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    # Supabase identity — this is what we verify from JWTs
    supabase_id  = Column(String(255), unique=True, nullable=False, index=True)
    email        = Column(String(255), unique=True, nullable=True, index=True)

    # Profile (filled during onboarding)
    name         = Column(String(100), nullable=True)
    avatar_url   = Column(String(500), nullable=True)
    currency     = Column(String(3),  default="BRL", nullable=False)
    locale       = Column(String(10), default="pt-BR", nullable=False)

    # Financial profile
    monthly_income  = Column(Float, nullable=True)
    financial_goal  = Column(String(100), nullable=True)
    risk_tolerance  = Column(String(20), default="moderate", nullable=False)

    # Onboarding state
    onboarding_done = Column(Boolean, default=False, nullable=False)
    onboarding_step = Column(Integer, default=0,     nullable=False)

    # Account state
    is_active    = Column(Boolean, default=True, nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    expenses  = relationship("Expense",       back_populates="user", lazy="dynamic")
    limits    = relationship("CategoryLimit", back_populates="user", lazy="dynamic")
    alerts    = relationship("Alert",         back_populates="user", lazy="dynamic")
    scores    = relationship("FinancialScore",back_populates="user", lazy="dynamic")


# ── Expense ───────────────────────────────────────────────────────────────────
class Expense(Base):
    __tablename__ = "expenses"

    id           = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id      = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount       = Column(Float,   nullable=False)
    category     = Column(String(50), nullable=False)
    description  = Column(String(255), nullable=True)
    raw_text     = Column(Text,    nullable=True)
    source       = Column(String(20), default="web", nullable=False)   # web | whatsapp | api
    confidence   = Column(Float,   default=1.0, nullable=False)
    tags         = Column(JSON,    default=list)
    is_recurring = Column(Boolean, default=False, nullable=False)
    is_deleted   = Column(Boolean, default=False, nullable=False)
    expense_date = Column(DateTime(timezone=True), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="expenses")


# ── CategoryLimit ─────────────────────────────────────────────────────────────
class CategoryLimit(Base):
    __tablename__ = "category_limits"

    id             = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id        = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category       = Column(String(50), nullable=False)
    amount         = Column(Float, nullable=False)
    period         = Column(String(20), default="monthly", nullable=False)
    alert_70_sent  = Column(Boolean, default=False)
    alert_90_sent  = Column(Boolean, default=False)
    alert_100_sent = Column(Boolean, default=False)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="limits")

    __table_args__ = (
        # One limit per category per user
        __import__("sqlalchemy").UniqueConstraint("user_id", "category", name="uq_user_category_limit"),
    )


# ── FinancialScore ────────────────────────────────────────────────────────────
class FinancialScore(Base):
    __tablename__ = "financial_scores"

    id                    = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id               = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score                 = Column(Integer, nullable=False)   # 0-1000
    grade                 = Column(String(2), nullable=False) # A+…F
    period                = Column(String(7), nullable=False) # YYYY-MM
    savings_score         = Column(Integer, default=0)
    consistency_score     = Column(Integer, default=0)
    limit_adherence_score = Column(Integer, default=0)
    trend_score           = Column(Integer, default=0)
    summary               = Column(Text, nullable=True)
    top_insight           = Column(Text, nullable=True)
    recommendations       = Column(JSON, default=list)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="scores")


# ── Alert ─────────────────────────────────────────────────────────────────────
class Alert(Base):
    __tablename__ = "alerts"

    id           = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id      = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type         = Column(String(30), nullable=False)   # limit_warning | anomaly | insight | goal
    severity     = Column(String(10), default="info", nullable=False)  # info | warning | critical
    title        = Column(String(200), nullable=False)
    message      = Column(Text, nullable=False)
    category     = Column(String(50), nullable=True)
    amount       = Column(Float, nullable=True)
    is_read      = Column(Boolean, default=False, nullable=False)
    is_dismissed = Column(Boolean, default=False, nullable=False)
    alert_meta   = Column(JSON, default=dict)
    created_at   = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="alerts")


# ── ConversationState (WhatsApp multi-turn) ───────────────────────────────────
class ConversationState(Base):
    __tablename__ = "conversation_states"

    id         = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_phone = Column(String(20), nullable=False, index=True)
    state      = Column(String(50), nullable=False)
    context    = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

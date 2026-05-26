-- ============================================================
-- VEXA — Production Schema
-- Run in: Supabase → SQL Editor → New Query → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_id      TEXT        UNIQUE NOT NULL,          -- auth.users.id
    email            TEXT        UNIQUE,
    name             TEXT,
    avatar_url       TEXT,
    currency         TEXT        NOT NULL DEFAULT 'BRL',
    locale           TEXT        NOT NULL DEFAULT 'pt-BR',
    monthly_income   NUMERIC(12,2),
    financial_goal   TEXT,
    risk_tolerance   TEXT        NOT NULL DEFAULT 'moderate',
    onboarding_done  BOOLEAN     NOT NULL DEFAULT FALSE,
    onboarding_step  INTEGER     NOT NULL DEFAULT 0,
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ
);

-- ── expenses ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    category     TEXT        NOT NULL,
    description  TEXT,
    raw_text     TEXT,
    source       TEXT        NOT NULL DEFAULT 'web',
    confidence   NUMERIC(3,2) NOT NULL DEFAULT 1.0,
    tags         JSONB       NOT NULL DEFAULT '[]',
    is_recurring BOOLEAN     NOT NULL DEFAULT FALSE,
    is_deleted   BOOLEAN     NOT NULL DEFAULT FALSE,
    expense_date TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id    ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category   ON expenses(category);

-- ── category_limits ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS category_limits (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category        TEXT        NOT NULL,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    period          TEXT        NOT NULL DEFAULT 'monthly',
    alert_70_sent   BOOLEAN     NOT NULL DEFAULT FALSE,
    alert_90_sent   BOOLEAN     NOT NULL DEFAULT FALSE,
    alert_100_sent  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, category)
);

-- ── financial_scores ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_scores (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score                 INTEGER     NOT NULL CHECK (score BETWEEN 0 AND 1000),
    grade                 TEXT        NOT NULL,
    period                TEXT        NOT NULL,            -- YYYY-MM
    savings_score         INTEGER     NOT NULL DEFAULT 0,
    consistency_score     INTEGER     NOT NULL DEFAULT 0,
    limit_adherence_score INTEGER     NOT NULL DEFAULT 0,
    trend_score           INTEGER     NOT NULL DEFAULT 0,
    summary               TEXT,
    top_insight           TEXT,
    recommendations       JSONB       NOT NULL DEFAULT '[]',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, period)
);

-- ── alerts ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         TEXT        NOT NULL,
    severity     TEXT        NOT NULL DEFAULT 'info',
    title        TEXT        NOT NULL,
    message      TEXT        NOT NULL,
    category     TEXT,
    amount       NUMERIC(12,2),
    is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
    is_dismissed BOOLEAN     NOT NULL DEFAULT FALSE,
    alert_meta   JSONB       NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id  ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read  ON alerts(is_read);

-- ── conversation_states (WhatsApp) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversation_states (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_phone TEXT        NOT NULL,
    state      TEXT        NOT NULL,
    context    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_conv_phone ON conversation_states(user_phone);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_limits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts            ENABLE ROW LEVEL SECURITY;

-- Helper: resolve supabase uid → vexa user id
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT id FROM users WHERE supabase_id = auth.uid()::text LIMIT 1;
$$;

CREATE POLICY "users_self"   ON users            FOR ALL USING (supabase_id = auth.uid()::text);
CREATE POLICY "exp_own"      ON expenses         FOR ALL USING (user_id = auth_user_id());
CREATE POLICY "lim_own"      ON category_limits  FOR ALL USING (user_id = auth_user_id());
CREATE POLICY "score_own"    ON financial_scores FOR ALL USING (user_id = auth_user_id());
CREATE POLICY "alerts_own"   ON alerts           FOR ALL USING (user_id = auth_user_id());

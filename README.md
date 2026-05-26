# VEXA — Intelligent Financial Copilot

> Production-ready SaaS platform: FastAPI · Next.js 14 · Supabase · Railway · Vercel · Claude AI

---

## Architecture

```
Browser → Vercel (Next.js) → Railway (FastAPI) → Supabase (PostgreSQL)
                                      ↕
                              WhatsApp (Evolution API)
                                      ↕
                              Claude AI (Anthropic)
```

**Auth flow:**
1. User signs in via Supabase Auth (email or Google OAuth)
2. Supabase returns a JWT with `sub` = Supabase user ID
3. Every API request sends that JWT as `Authorization: Bearer <token>`
4. FastAPI verifies the JWT with `SUPABASE_JWT_SECRET` (no separate token exchange)
5. On first login, a `users` row is auto-created linked by `supabase_id`

---

## Quick Deploy (3 services, ~15 minutes)

### 1 · Supabase (database + auth)
1. Create project at [supabase.com](https://supabase.com)
2. SQL Editor → paste `migrations/001_initial_schema.sql` → Run
3. Authentication → Providers → enable **Email** and **Google**
4. Collect these values for the next steps:
   - `SUPABASE_URL` — Project Settings → API → Project URL
   - `SUPABASE_ANON_KEY` — Settings → API → `anon public`
   - `SUPABASE_SERVICE_ROLE_KEY` — Settings → API → `service_role`
   - `SUPABASE_JWT_SECRET` — Settings → API → JWT Settings → Secret
   - `DATABASE_URL` — Settings → Database → Transaction pooler URI

### 2 · Railway (backend API)
1. New project → Deploy from GitHub → root: `backend/`
2. Add **Redis** plugin from the Railway marketplace
3. Set environment variables (all from `backend/.env.example`):
   ```
   DATABASE_URL        = <Supabase Transaction Pooler URI>
   REDIS_URL           = <auto-injected by Railway Redis plugin>
   SUPABASE_URL        = https://xxx.supabase.co
   SUPABASE_ANON_KEY   = ...
   SUPABASE_SERVICE_ROLE_KEY = ...
   SUPABASE_JWT_SECRET = ...
   CORS_ORIGINS        = https://your-project.vercel.app
   ANTHROPIC_API_KEY   = sk-ant-...
   ENVIRONMENT         = production
   ```
4. Railway auto-detects the Dockerfile and deploys. Your API URL: `https://xxx.up.railway.app`

**Worker service** (for Celery/WhatsApp tasks):
- Add a second service pointing to the same repo + `backend/`
- Override start command: `celery -A app.workers.celery_app worker --loglevel=info`

### 3 · Vercel (frontend)
1. Import repo at [vercel.com](https://vercel.com) → root: `frontend/`
2. Framework preset: **Next.js**
3. Set environment variables (from `frontend/.env.example`):
   ```
   NEXT_PUBLIC_API_URL              = https://xxx.up.railway.app
   NEXT_PUBLIC_SUPABASE_URL         = https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY    = <anon public key>
   ```
4. Deploy. Go live.

### 4 · Final step — update CORS
Back in Railway, update `CORS_ORIGINS` to your actual Vercel URL:
```
CORS_ORIGINS=https://your-project.vercel.app,https://yourdomain.com
```

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/you/vexa-saas
cd vexa-saas

# 2. Backend
cd backend
cp .env.example .env    # fill in your Supabase values
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/health

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
vexa-saas/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── users.py        GET /v1/users/me, PATCH /v1/users/me, POST /v1/users/me/onboarding
│   │   │   ├── expenses.py     GET|POST /v1/expenses/, PATCH|DELETE /:id, GET /dashboard, /summary, /limits
│   │   │   ├── insights.py     GET /v1/insights/score, /ai, /projection
│   │   │   ├── alerts.py       GET /v1/alerts/, PATCH /:id/read, /read-all, /:id/dismiss
│   │   │   └── webhook.py      POST /v1/webhook/whatsapp
│   │   ├── core/
│   │   │   ├── config.py       Pydantic settings — all env vars, no localhost defaults
│   │   │   ├── database.py     SQLAlchemy engine (SSL + pooling for Supabase)
│   │   │   ├── security.py     Supabase JWT verification + user auto-provision
│   │   │   └── logging.py      Structured stdout logging
│   │   ├── models/models.py    User, Expense, CategoryLimit, FinancialScore, Alert
│   │   ├── schemas/schemas.py  Pydantic v2 request/response schemas
│   │   ├── services/
│   │   │   ├── expense_service.py    CRUD + monthly summary + dashboard
│   │   │   ├── insights_service.py   Financial score (0-1000) + Claude AI insights
│   │   │   ├── alert_engine.py       DB-persisted limit-breach alerts
│   │   │   ├── ai_service.py         Claude Haiku expense classifier
│   │   │   └── whatsapp_service.py   Evolution API message sender
│   │   ├── workers/celery_app.py     Celery + Redis async tasks
│   │   └── main.py                   FastAPI app, CORS, lifespan
│   ├── Dockerfile              Multi-stage, non-root user, $PORT injection
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/   Real Supabase signInWithPassword + Google OAuth
│   │   │   ├── (auth)/signup/  Real Supabase signUp + email confirmation flow
│   │   │   ├── auth/callback/  OAuth code-exchange route
│   │   │   ├── onboarding/     4-step flow wired to POST /v1/users/me/onboarding
│   │   │   └── (dashboard)/    Protected by middleware + layout auth guard
│   │   │       ├── page.tsx        Dashboard — live API data, loading states, skeletons
│   │   │       ├── expenses/       Full CRUD with add modal + delete
│   │   │       ├── insights/       AI score + Claude analysis + projection
│   │   │       ├── limits/         Set/edit/delete budget limits per category
│   │   │       └── alerts/         Read/dismiss alerts with filter tabs
│   │   ├── components/
│   │   │   ├── layout/Sidebar.tsx  Real profile + logout
│   │   │   └── dashboard/          ScoreRing, MetricCard, Charts (Recharts)
│   │   ├── hooks/useAuth.ts    Supabase session + profile + login/logout/signup
│   │   ├── store/auth.ts       Zustand — session, token, profile
│   │   ├── lib/api.ts          Typed API client (all endpoints)
│   │   ├── lib/supabase/       client.ts (browser) + server.ts (SSR)
│   │   └── middleware.ts       Route protection (redirects unauthenticated users)
│   ├── tailwind.config.ts      Full design system tokens
│   ├── vercel.json
│   └── .env.example
│
├── migrations/
│   └── 001_initial_schema.sql  Full schema + RLS policies
├── railway.toml
└── README.md
```

---

## Design System

| Token | Hex | Meaning |
|-------|-----|---------|
| `brand-purple` | `#5B2EFF` | Primary identity, AI, CTAs |
| `brand-green` | `#00D084` | Gains, success, positive metrics |
| `brand-red` | `#FF4444` | Risk, limits exceeded, errors |
| `brand-amber` | `#FFB800` | Caution, approaching limits |
| `base-bg` | `#0B1020` | Page background |
| `base-surface` | `#111827` | Cards |
| `base-surface-2` | `#1A2235` | Input backgrounds |

**Typography:** Syne (display) · DM Sans (body) · JetBrains Mono (amounts)

---

## What's Complete

### Backend ✅
- Supabase JWT verification (no token exchange, no separate auth server)
- Auto-provision user on first login (`supabase_id` as foreign key)
- Full expense CRUD (create, list, update, soft-delete)
- Monthly summary + dashboard summary (single endpoint)
- Financial health score 0–1000 (4 components)
- Claude AI insights + recommendations
- Spending projection
- DB-persisted alerts (70/90/100% limit thresholds)
- Alert read/dismiss API
- Onboarding endpoint (profile + initial limits in one call)
- WhatsApp webhook (Evolution API)
- Zero `localhost` in production paths — all Railway/Supabase-ready
- Multi-stage Docker build, non-root user, `$PORT` injection

### Frontend ✅
- Real Supabase auth: login, signup, Google OAuth, email confirmation
- Session persistence via Supabase SSR cookies
- Route protection: middleware + layout auth guard
- Onboarding redirect for new users
- Dashboard: live metrics, score, charts, budget bars, recent expenses
- Insights: financial score, AI analysis, projection, recommendations
- Expenses: list with filters, add modal, delete with optimistic UI
- Limits: set/edit/delete per category with progress bars
- Alerts: read/dismiss with filter tabs
- Sidebar shows real user name + logout

---

## Known Limitations

| Area | Status | Notes |
|------|--------|-------|
| Token refresh | Handled by Supabase SDK | Auto-refreshes 5min before expiry |
| Expense edit | UI shows ✏️ emoji only | PATCH endpoint exists, modal not built |
| WhatsApp | Requires Evolution API instance | Optional feature |
| Celery beat | Not scheduled | Score computation triggered on demand only |
| Mobile layout | Desktop-first | Sidebar needs responsive breakpoints |
| Open Banking | Not integrated | Pluggy/Belvo recommended for bank sync |

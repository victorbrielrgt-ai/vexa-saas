/**
 * Typed API client for VEXA backend.
 * Authentication: Supabase JWT passed as Bearer token on every call.
 * Token is retrieved from the Supabase session — no token exchange needed.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL && typeof window !== "undefined") {
  console.error("NEXT_PUBLIC_API_URL is not set");
}

// ── Error class ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Core fetch helper ─────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail: unknown;
    try { detail = await res.json(); } catch { detail = res.statusText; }
    const message = typeof detail === "object" && detail !== null && "detail" in detail
      ? String((detail as { detail: unknown }).detail)
      : `HTTP ${res.status}`;
    throw new ApiError(res.status, message, detail);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  me: (token: string) =>
    request<UserProfile>("/v1/users/me", {}, token),

  update: (token: string, data: Partial<UserUpdate>) =>
    request<UserProfile>("/v1/users/me", { method: "PATCH", body: JSON.stringify(data) }, token),

  onboarding: (token: string, data: OnboardingPayload) =>
    request<UserProfile>("/v1/users/me/onboarding", { method: "POST", body: JSON.stringify(data) }, token),
};

// ── Expenses ──────────────────────────────────────────────────────────────────

export const expensesApi = {
  list: (token: string, params?: { limit?: number; offset?: number }) => {
    const q = new URLSearchParams({ limit: String(params?.limit ?? 20), offset: String(params?.offset ?? 0) });
    return request<Expense[]>(`/v1/expenses/?${q}`, {}, token);
  },

  create: (token: string, data: CreateExpensePayload) =>
    request<Expense>("/v1/expenses/", { method: "POST", body: JSON.stringify(data) }, token),

  update: (token: string, id: string, data: Partial<CreateExpensePayload>) =>
    request<Expense>(`/v1/expenses/${id}`, { method: "PATCH", body: JSON.stringify(data) }, token),

  delete: (token: string, id: string) =>
    request<void>(`/v1/expenses/${id}`, { method: "DELETE" }, token),

  summary: (token: string, year?: number, month?: number) => {
    const q = new URLSearchParams();
    if (year)  q.set("year",  String(year));
    if (month) q.set("month", String(month));
    return request<MonthlySummary>(`/v1/expenses/summary?${q}`, {}, token);
  },

  dashboard: (token: string) =>
    request<DashboardSummary>("/v1/expenses/dashboard", {}, token),

  limits: (token: string) =>
    request<CategoryLimit[]>("/v1/expenses/limits", {}, token),

  setLimit: (token: string, data: { category: string; amount: number; period?: string }) =>
    request<CategoryLimit>("/v1/expenses/limits", { method: "POST", body: JSON.stringify(data) }, token),

  deleteLimit: (token: string, limitId: string) =>
    request<void>(`/v1/expenses/limits/${limitId}`, { method: "DELETE" }, token),
};

// ── Insights ──────────────────────────────────────────────────────────────────

export const insightsApi = {
  score: (token: string, year?: number, month?: number) => {
    const q = new URLSearchParams();
    if (year)  q.set("year",  String(year));
    if (month) q.set("month", String(month));
    return request<FinancialScore>(`/v1/insights/score?${q}`, {}, token);
  },

  aiInsights: (token: string, year?: number, month?: number) => {
    const q = new URLSearchParams();
    if (year)  q.set("year",  String(year));
    if (month) q.set("month", String(month));
    return request<AiInsights>(`/v1/insights/ai?${q}`, {}, token);
  },

  projection: (token: string) =>
    request<SpendingProjection>("/v1/insights/projection", {}, token),
};

// ── Alerts ────────────────────────────────────────────────────────────────────

export const alertsApi = {
  list: (token: string, params?: { unread_only?: boolean; severity?: string }) => {
    const q = new URLSearchParams();
    if (params?.unread_only) q.set("unread_only", "true");
    if (params?.severity)    q.set("severity", params.severity);
    return request<Alert[]>(`/v1/alerts/?${q}`, {}, token);
  },

  markRead: (token: string, id: string) =>
    request<Alert>(`/v1/alerts/${id}/read`, { method: "PATCH" }, token),

  markAllRead: (token: string) =>
    request<void>("/v1/alerts/read-all", { method: "PATCH" }, token),

  dismiss: (token: string, id: string) =>
    request<void>(`/v1/alerts/${id}/dismiss`, { method: "PATCH" }, token),
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  supabase_id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  currency: string;
  locale: string;
  monthly_income: number | null;
  financial_goal: string | null;
  risk_tolerance: string;
  onboarding_done: boolean;
  onboarding_step: number;
  created_at: string;
}

export interface UserUpdate {
  name?: string;
  currency?: string;
  locale?: string;
  monthly_income?: number;
  financial_goal?: string;
  risk_tolerance?: string;
  avatar_url?: string;
}

export interface OnboardingPayload {
  name?: string;
  monthly_income?: number;
  financial_goal?: string;
  currency?: string;
  onboarding_step?: number;
  onboarding_done?: boolean;
  initial_limits?: Array<{ category: string; amount: number }>;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string | null;
  source: string;
  confidence: number;
  tags: string[];
  is_recurring: boolean;
  expense_date: string | null;
  created_at: string;
}

export interface CreateExpensePayload {
  amount: number;
  category: string;
  description?: string;
  source?: string;
  expense_date?: string;
  tags?: string[];
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  limit: number | null;
  percent_used: number | null;
}

export interface MonthlySummary {
  year: number;
  month: number;
  period: string;
  total: number;
  count: number;
  categories: CategorySummary[];
  daily_avg: number;
}

export interface DashboardSummary {
  current_month_total: number;
  previous_month_total: number;
  month_over_month_pct: number;
  projected_month_total: number;
  daily_average: number;
  days_elapsed: number;
  days_remaining: number;
  top_category: string | null;
  active_limits: number;
  unread_alerts: number;
  categories: CategorySummary[];
}

export interface CategoryLimit {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  period: string;
  alert_70_sent: boolean;
  alert_90_sent: boolean;
  alert_100_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialScore {
  score: number;
  grade: string;
  period: string;
  components: {
    savings: number;
    consistency: number;
    limit_adherence: number;
    trend: number;
  };
  total_spent: number;
  monthly_income: number | null;
}

export interface AiInsights {
  summary: string;
  top_insight: string;
  recommendations: string[];
  risk_flags: string[];
  positive_highlights: string[];
}

export interface SpendingProjection {
  current_total: number;
  daily_average: number;
  projected_month_total: number;
  days_elapsed: number;
  days_remaining: number;
}

export interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  category: string | null;
  amount: number | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

// ── Copilot ───────────────────────────────────────────────────────────────────

export const copilotApi = {
  insights: (token: string) =>
    request<CopilotInsight[]>("/v1/copilot/insights", {}, token),

  streak: (token: string) =>
    request<StreakData>("/v1/copilot/streak", {}, token),
};

export interface CopilotInsight {
  type: string;
  severity: "critical" | "warning" | "info";
  icon: string;
  headline: string;
  body: string;
  cta: string | null;
  cta_href: string | null;
  data: Record<string, unknown>;
}

export interface Achievement {
  id: string;
  label: string;
  icon: string;
  unlocked: boolean;
}

export interface StreakData {
  streak_days: number;
  months_tracked: number;
  achievements: Achievement[];
}

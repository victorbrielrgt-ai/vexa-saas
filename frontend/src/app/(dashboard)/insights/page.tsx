"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, ChevronRight, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { insightsApi, type FinancialScore, type AiInsights, type SpendingProjection } from "@/lib/api";
import { ScoreRing } from "@/components/dashboard/ScoreRing";

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

const SCORE_COMPONENTS = [
  { key: "savings",         label: "Savings Rate",       max: 250, desc: "Income vs. spending ratio" },
  { key: "consistency",     label: "Daily Consistency",  max: 250, desc: "How evenly you spread spending" },
  { key: "limit_adherence", label: "Budget Adherence",   max: 250, desc: "Staying within your limits" },
  { key: "trend",           label: "Month-over-Month",   max: 250, desc: "Improvement vs. last month" },
];

function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={clsx("skeleton rounded-lg", className)} />;
}

export default function InsightsPage() {
  const { token } = useAuth();
  const [score, setScore]           = useState<FinancialScore | null>(null);
  const [insights, setInsights]     = useState<AiInsights | null>(null);
  const [projection, setProjection] = useState<SpendingProjection | null>(null);
  const [loading, setLoading]       = useState(true);
  const [aiLoading, setAiLoading]   = useState(false);
  const [error, setError]           = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const [sc, proj] = await Promise.all([
        insightsApi.score(token),
        insightsApi.projection(token),
      ]);
      setScore(sc);
      setProjection(proj);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadAI = useCallback(async () => {
    if (!token) return;
    setAiLoading(true);
    try {
      const ai = await insightsApi.aiInsights(token);
      setInsights(ai);
    } catch {
      // non-fatal — AI might be unavailable
    } finally {
      setAiLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load().then(() => loadAI());
  }, [load, loadAI]);

  const today = new Date();
  const components = score?.components as Record<string, number> | undefined;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-brand-purple" />
            <span className="text-xs font-semibold text-brand-purple uppercase tracking-wide">AI Intelligence</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-primary">Financial Insights</h1>
          <p className="text-ink-secondary mt-1">
            {today.toLocaleString("en-US", { month: "long" })} {today.getFullYear()} · AI-powered analysis
          </p>
        </div>
        <button onClick={() => { load(); loadAI(); }} disabled={loading}
          className="btn-secondary text-sm">
          <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="card p-4 flex items-center gap-3 border-brand-red/20">
          <AlertCircle className="w-5 h-5 text-brand-red flex-shrink-0" />
          <span className="text-sm text-ink-secondary">{error}</span>
          <button onClick={load} className="ml-auto btn-ghost text-xs">Retry</button>
        </div>
      )}

      {/* Score + Summary */}
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-4 card-purple p-6 flex flex-col items-center gap-5">
          <div className="w-full flex justify-between items-start">
            <div>
              <div className="text-xs font-semibold text-ink-muted uppercase tracking-widest">Health Score</div>
              {loading ? <div className="h-7 skeleton rounded w-28 mt-1" /> :
                <div className="text-2xl font-display font-bold text-ink-primary mt-1">
                  {(score?.score ?? 0) >= 900 ? "Excellent" : (score?.score ?? 0) >= 750 ? "Very Good" : (score?.score ?? 0) >= 600 ? "Good" : "Fair"}
                </div>
              }
            </div>
            <div className="badge-purple">{today.toLocaleString("en-US", { month: "short" })} {today.getFullYear()}</div>
          </div>

          {loading ? <div className="w-[150px] h-[150px] skeleton rounded-full" /> :
            <ScoreRing score={score?.score ?? 0} grade={score?.grade ?? "F"} size={150} />
          }

          <div className="w-full space-y-3">
            {SCORE_COMPONENTS.map(({ key, label, max }) => {
              const val = components?.[key] ?? 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-ink-secondary">{label}</span>
                    {loading ? <div className="h-3 skeleton rounded w-12" /> :
                      <span className="font-mono text-ink-primary">{val}<span className="text-ink-muted">/{max}</span></span>
                    }
                  </div>
                  <div className="h-1.5 bg-base-surface-3 rounded-full overflow-hidden">
                    {!loading && <div className="h-full bg-brand-purple rounded-full transition-all duration-700"
                      style={{ width: `${(val / max) * 100}%` }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-8 space-y-4">
          {/* AI Summary */}
          <div className="card p-6 border-brand-purple/20"
            style={{ background: "linear-gradient(135deg,rgba(91,46,255,.08),rgba(11,16,32,.9))" }}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-purple/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-brand-purple-light" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-brand-purple uppercase tracking-wide mb-2">Executive Summary</div>
                {aiLoading ? (
                  <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
                ) : insights ? (
                  <p className="text-sm text-ink-secondary leading-relaxed">{insights.summary}</p>
                ) : (
                  <p className="text-sm text-ink-muted">AI analysis loading…</p>
                )}
              </div>
            </div>
          </div>

          {/* Top Insight */}
          <div className="card-green p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-green/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <div className="text-xs font-semibold text-brand-green uppercase tracking-wide mb-1">Top Opportunity</div>
              {aiLoading ? <Skeleton className="h-4 w-64" /> :
                <p className="text-sm text-ink-primary font-medium">{insights?.top_insight ?? "Loading AI analysis…"}</p>
              }
            </div>
          </div>

          {/* Projections */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Current Spend",      val: projection?.current_total,          warn: false },
              { label: "Daily Average",       val: projection?.daily_average,          warn: false },
              { label: "Month Projection",    val: projection?.projected_month_total,  warn: true  },
            ].map(({ label, val, warn }) => (
              <div key={label} className={clsx("card p-4", warn && "border-brand-amber/20")}>
                <div className="text-xs text-ink-muted mb-1">{label}</div>
                {loading ? <Skeleton className="h-7 w-28 mt-1" /> : (
                  <>
                    <div className={clsx("font-display text-xl font-bold", warn ? "text-brand-amber" : "text-ink-primary")}>
                      {val !== undefined ? fmt(val) : "—"}
                    </div>
                    {projection && (
                      <div className="text-xs text-ink-muted mt-0.5">
                        {warn ? `${projection.days_remaining} days remaining` : `${projection.days_elapsed} days tracked`}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations + Risk/Highlights */}
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 card p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-brand-purple" />
            <div className="section-title">AI Recommendations</div>
          </div>
          {aiLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
          ) : insights?.recommendations.length ? (
            <div className="space-y-3">
              {insights.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-base-surface-2 hover:bg-base-surface-3 transition-all group cursor-pointer">
                  <div className="w-7 h-7 rounded-lg bg-brand-purple/20 flex items-center justify-center flex-shrink-0 text-brand-purple-light font-display font-bold text-sm">
                    {i + 1}
                  </div>
                  <p className="text-sm text-ink-secondary group-hover:text-ink-primary transition-colors flex-1">{rec}</p>
                  <ChevronRight className="w-4 h-4 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">No recommendations available yet. Add more expenses to unlock AI analysis.</p>
          )}
        </div>

        <div className="col-span-4 space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-brand-red" />
              <span className="font-display font-semibold text-ink-primary text-sm">Risk Flags</span>
            </div>
            {aiLoading ? <Skeleton className="h-10 w-full" /> :
              insights?.risk_flags.length ? (
                <div className="space-y-2">
                  {insights.risk_flags.map(cat => (
                    <div key={cat} className="flex items-center gap-3 p-3 rounded-lg bg-brand-red-glow border border-brand-red/15">
                      <div className="w-2 h-2 rounded-full bg-brand-red flex-shrink-0" />
                      <span className="text-sm text-brand-red-light capitalize font-medium">{cat}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-ink-muted">No critical flags this month.</p>
            }
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 text-brand-green" />
              <span className="font-display font-semibold text-ink-primary text-sm">Doing Well</span>
            </div>
            {aiLoading ? <Skeleton className="h-10 w-full" /> :
              insights?.positive_highlights.length ? (
                <div className="space-y-2">
                  {insights.positive_highlights.map(cat => (
                    <div key={cat} className="flex items-center gap-3 p-3 rounded-lg bg-brand-green-glow border border-brand-green/15">
                      <div className="w-2 h-2 rounded-full bg-brand-green flex-shrink-0" />
                      <span className="text-sm text-brand-green capitalize font-medium">{cat}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-ink-muted">Analyze more data for highlights.</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

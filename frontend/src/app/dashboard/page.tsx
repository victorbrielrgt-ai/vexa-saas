"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { DollarSign, TrendingDown, Target, Brain, Clock, ChevronRight, AlertCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { expensesApi, insightsApi, type DashboardSummary, type FinancialScore, type Expense } from "@/lib/api";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ScoreRing } from "@/components/dashboard/ScoreRing";
import { CategoryBreakdownChart } from "@/components/dashboard/Charts";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { StreakBadge } from "@/components/retention/StreakBadge";

const CAT_ICONS: Record<string,string> = { alimentacao:"🍽️",transporte:"🚗",lazer:"🎮",saude:"💊",moradia:"🏠",roupas:"👕",outros:"📦",educacao:"📚" };
const CAT_CLR: Record<string,string>   = { alimentacao:"#5B2EFF",transporte:"#00D084",lazer:"#FFB800",saude:"#00C4FF",moradia:"#FF4444",roupas:"#FF6B6B",educacao:"#00D084",outros:"#8B9AB5" };

function fmt(n:number){ return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(n); }
function timeAgo(s:string){ const h=Math.floor((Date.now()-new Date(s).getTime())/3600000); return h<1?"just now":h<24?h+"h ago":Math.floor(h/24)+"d ago"; }

function SkeletonRow(){ return <div className="flex gap-3 p-3"><div className="w-9 h-9 rounded-xl skeleton flex-shrink-0"/><div className="flex-1 space-y-2"><div className="h-4 skeleton rounded w-48"/><div className="h-3 skeleton rounded w-24"/></div><div className="w-16 h-4 skeleton rounded"/></div>; }
function SkeletonCard(){ return <div className="card p-5 space-y-3 animate-pulse"><div className="h-4 skeleton rounded w-24"/><div className="h-8 skeleton rounded w-32"/><div className="h-3 skeleton rounded w-20"/></div>; }

export default function DashboardPage() {
  const { token, profile } = useAuth();
  const [summary,  setSummary]  = useState<DashboardSummary|null>(null);
  const [score,    setScore]    = useState<FinancialScore|null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true); setError("");
      const [s, sc, ex] = await Promise.all([
        expensesApi.dashboard(token),
        insightsApi.score(token),
        expensesApi.list(token, { limit: 6 }),
      ]);
      setSummary(s); setScore(sc); setExpenses(ex);
    } catch(e:unknown){ setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const today     = new Date();
  const hour      = today.getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = profile?.name?.split(" ")[0] || "";
  const monthName = today.toLocaleString("en-US", { month: "long" });

  if (error) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="card p-8 text-center max-w-md">
        <AlertCircle className="w-10 h-10 text-brand-red mx-auto mb-3"/>
        <p className="text-ink-secondary text-sm mb-4">{error}</p>
        <button onClick={load} className="btn-primary text-sm">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse inline-block"/>
            <span className="text-[11px] font-semibold text-brand-green tracking-widest uppercase">Live</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink-primary tracking-tight">
            {greeting}{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="text-ink-secondary mt-1 text-sm">{monthName} {today.getFullYear()} — your financial overview</p>
        </div>
        <div className="flex items-center gap-3">
          <StreakBadge compact />
          <Link href="/dashboard/expenses" className="btn-secondary text-sm">+ Add expense</Link>
          <Link href="/dashboard/insights" className="btn-primary text-sm"><Brain className="w-4 h-4"/>AI report</Link>
        </div>
      </div>

      {/* ── Row 1: Score + Metrics + Copilot ─────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Score card */}
        <div className="col-span-3 card-purple p-5 flex flex-col gap-4">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-widest">Financial Health</div>
          <div className="flex flex-col items-center gap-4">
            {loading || !score
              ? <div className="w-[110px] h-[110px] skeleton rounded-full"/>
              : <ScoreRing score={score.score} grade={score.grade} size={110}/>
            }
            {!loading && score && (
              <div className="w-full space-y-2">
                {[
                  { label:"Savings",     val:score.components.savings },
                  { label:"Consistency", val:score.components.consistency },
                  { label:"Limits",      val:score.components.limit_adherence },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-[10px] text-ink-muted w-20">{label}</span>
                    <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-purple rounded-full transition-all duration-1000" style={{ width:`${(val/250)*100}%` }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Link href="/dashboard/insights" className="flex items-center justify-center gap-1 text-xs text-brand-purple-light hover:text-brand-purple font-medium transition-colors">
            Full report <ArrowUpRight className="w-3 h-3"/>
          </Link>
        </div>

        {/* KPI metrics */}
        <div className="col-span-5 grid grid-cols-2 gap-4 content-start">
          {loading ? <><SkeletonCard/><SkeletonCard/><SkeletonCard/><SkeletonCard/></> : summary ? (
            <>
              <MetricCard label="Spent this month" icon={DollarSign}
                value={fmt(summary.current_month_total)} subvalue={`${summary.days_elapsed} days tracked`}
                trend={{ value:Math.abs(summary.month_over_month_pct), label:"vs last month", positive:summary.month_over_month_pct<=0 }}/>
              <MetricCard label="Projected total" icon={TrendingDown}
                value={fmt(summary.projected_month_total)} subvalue={`${summary.days_remaining} days left`}
                variant={summary.projected_month_total > summary.current_month_total * 2.2 ? "red" : "default"}/>
              <MetricCard label="Daily average" icon={Target}
                value={fmt(summary.daily_average)} subvalue="per day this month" variant="purple"/>
              <MetricCard label="Budget alerts" icon={Brain}
                value={`${summary.unread_alerts}`} subvalue={`${summary.active_limits} limits active`}
                variant={summary.unread_alerts > 0 ? "red" : "default"}/>
            </>
          ) : null}
        </div>

        {/* AI Copilot */}
        <div className="col-span-4">
          <CopilotPanel/>
        </div>
      </div>

      {/* ── Row 2: Category chart + Budget bars + Streak ─────────────────────── */}
      <div className="grid grid-cols-12 gap-5">

        {/* Category breakdown */}
        <div className="col-span-5 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="section-title text-base">Spending breakdown</div>
              <div className="text-xs text-ink-muted mt-0.5">{monthName} by category</div>
            </div>
          </div>
          {loading
            ? <div className="h-[200px] skeleton rounded-xl"/>
            : <CategoryBreakdownChart data={summary?.categories ?? []}/>
          }
        </div>

        {/* Budget progress */}
        <div className="col-span-4 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title text-base">Budget limits</div>
            <Link href="/dashboard/limits" className="text-[11px] text-brand-purple-light hover:text-brand-purple font-medium transition-colors">Manage →</Link>
          </div>
          {loading ? (
            <div className="space-y-4">{[1,2,3].map(i=><div key={i} className="h-10 skeleton rounded-lg"/>)}</div>
          ) : !summary?.categories.some(c=>c.limit) ? (
            <div className="py-6 text-center">
              <Target className="w-8 h-8 text-ink-muted mx-auto mb-2"/>
              <p className="text-xs text-ink-secondary mb-3">No limits set yet.</p>
              <Link href="/dashboard/limits" className="btn-secondary text-xs inline-flex">Set limits</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {summary?.categories.filter(c=>c.limit).slice(0,5).map(cat=>{
                const pct = cat.percent_used??0;
                const clr = pct>=100?"#FF4444":pct>=90?"#FFB800":"#00D084";
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{CAT_ICONS[cat.category]??"📦"}</span>
                        <span className="text-xs font-medium text-ink-primary capitalize">{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-ink-secondary">{fmt(cat.total)}</span>
                        <span className="text-[10px] font-bold" style={{color:clr}}>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${Math.min(pct,100)}%`,background:clr}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Streak */}
        <div className="col-span-3">
          <StreakBadge/>
        </div>
      </div>

      {/* ── Row 3: Recent transactions ────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-border">
          <div className="section-title text-base">Recent expenses</div>
          <Link href="/dashboard/expenses" className="text-[11px] text-brand-purple-light hover:text-brand-purple font-medium transition-colors">View all →</Link>
        </div>
        <div className="divide-y divide-base-border/50">
          {loading ? [1,2,3,4].map(i=><SkeletonRow key={i}/>) :
           expenses.length===0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">💸</p>
              <p className="text-sm text-ink-secondary mb-3">No expenses tracked yet.</p>
              <Link href="/dashboard/expenses" className="btn-primary text-xs inline-flex">Add first expense</Link>
            </div>
          ) : expenses.map(ex=>(
            <div key={ex.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/2 transition-all group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{background:`${CAT_CLR[ex.category]??"#8B9AB5"}18`}}>
                {CAT_ICONS[ex.category]??"📦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink-primary truncate">{ex.description||ex.category}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-md capitalize font-medium"
                    style={{background:`${CAT_CLR[ex.category]??"#8B9AB5"}18`,color:CAT_CLR[ex.category]??"#8B9AB5"}}>
                    {ex.category}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-ink-muted">
                    <Clock className="w-2.5 h-2.5"/>{timeAgo(ex.created_at)}
                  </span>
                </div>
              </div>
              <span className="font-mono text-sm font-semibold text-ink-primary flex-shrink-0">
                − {fmt(ex.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

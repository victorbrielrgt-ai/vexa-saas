"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { clsx } from "clsx";
import { copilotApi, type CopilotInsight } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const SEV: Record<string, { bar: string; bg: string }> = {
  critical: { bar: "bg-brand-red",    bg: "rgba(255,68,68,0.10)"   },
  warning:  { bar: "bg-brand-amber",  bg: "rgba(255,184,0,0.10)"   },
  info:     { bar: "bg-brand-purple", bg: "rgba(91,46,255,0.08)"   },
};
const TICON: Record<string, React.ElementType> = {
  warning: AlertTriangle, caution: AlertTriangle,
  positive: CheckCircle,  spike: TrendingUp, limit: AlertTriangle,
};

function InsightCard({ insight, index }: { insight: CopilotInsight; index: number }) {
  const s = SEV[insight.severity] ?? SEV.info;
  const Icon = TICON[insight.type] ?? Zap;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/10 cursor-default"
      style={{ background: `linear-gradient(135deg, ${s.bg} 0%, rgba(11,16,32,.8) 100%)`, animation: `fadeUp 0.4s ease-out ${index*80}ms both` }}>
      <div className={clsx("absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full", s.bar)} />
      <div className="flex items-start gap-3 p-4 pl-5">
        <span className="text-lg leading-none flex-shrink-0 mt-0.5">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink-primary leading-snug mb-1">{insight.headline}</p>
          <p className="text-xs text-ink-secondary leading-relaxed">{insight.body}</p>
        </div>
        {insight.cta && insight.cta_href && (
          <Link href={insight.cta_href} className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-brand-purple-light hover:text-brand-purple transition-colors mt-0.5 whitespace-nowrap">
            {insight.cta} <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function CopilotPanel() {
  const { token } = useAuth();
  const [insights, setInsights] = useState<CopilotInsight[]>([]);
  const [loading, setLoading]   = useState(true);
  const [spin, setSpin]         = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true); else setSpin(true);
    try { setInsights(await copilotApi.insights(token)); }
    catch { /* additive — fail silently */ }
    finally { setLoading(false); setSpin(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background:"linear-gradient(135deg,#5B2EFF,#3D1ECC)", boxShadow:"0 2px 12px rgba(91,46,255,.45)" }}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-ink-primary">AI Copilot</div>
            <div className="text-[10px] text-ink-muted">Live analysis</div>
          </div>
        </div>
        <button onClick={() => load(true)} disabled={spin} className="p-1.5 rounded-lg hover:bg-base-surface-2 transition-colors">
          <RefreshCw className={clsx("w-3.5 h-3.5 text-ink-muted", spin && "animate-spin")} />
        </button>
      </div>
      <div className="space-y-2">
        {loading
          ? [1,2,3].map(i => <div key={i} className="h-16 rounded-2xl skeleton" />)
          : insights.length === 0
            ? <div className="py-6 text-center"><p className="text-3xl mb-2">🎯</p><p className="text-sm text-ink-secondary">Add expenses to unlock insights.</p></div>
            : insights.map((ins, i) => <InsightCard key={i} insight={ins} index={i} />)
        }
      </div>
      {insights.length > 0 && (
        <Link href="/dashboard/insights" className="mt-4 flex items-center justify-center gap-1.5 text-xs text-brand-purple-light hover:text-brand-purple font-medium transition-colors">
          Full AI report <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

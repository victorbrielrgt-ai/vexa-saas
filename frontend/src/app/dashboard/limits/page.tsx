"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { Target, Plus, Trash2, AlertCircle, X, Check } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { expensesApi, type CategoryLimit, type MonthlySummary } from "@/lib/api";
import toast from "react-hot-toast";

const ALL_CATS = [
  { key:"alimentacao", label:"Food & Dining",  icon:"🍽️", suggested:800  },
  { key:"transporte",  label:"Transport",       icon:"🚗", suggested:400  },
  { key:"lazer",       label:"Leisure",         icon:"🎮", suggested:300  },
  { key:"saude",       label:"Health",          icon:"💊", suggested:200  },
  { key:"moradia",     label:"Housing",         icon:"🏠", suggested:1500 },
  { key:"roupas",      label:"Clothing",        icon:"👕", suggested:200  },
  { key:"educacao",    label:"Education",       icon:"📚", suggested:300  },
  { key:"outros",      label:"Other",           icon:"📦", suggested:200  },
];

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(n);
}
function getStatus(pct: number) {
  if (pct >= 100) return { label:"Exceeded",  color:"#FF4444", cls:"text-brand-red"   };
  if (pct >= 90)  return { label:"Critical",  color:"#FFB800", cls:"text-brand-amber" };
  if (pct >= 70)  return { label:"Warning",   color:"#FFB800", cls:"text-brand-amber" };
  return           { label:"Healthy",    color:"#00D084", cls:"text-brand-green"  };
}

// ── Set Limit Modal ───────────────────────────────────────────────────────────
function SetLimitModal({ category, current, onClose, onSaved }: {
  category: string; current?: number; onClose: () => void; onSaved: () => void;
}) {
  const { token } = useAuth();
  const meta = ALL_CATS.find(c => c.key === category)!;
  const [amount, setAmount] = useState(String(current ?? meta.suggested));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const val = parseFloat(amount);
    if (!val || val <= 0) { setErr("Enter a valid amount"); return; }
    setSaving(true);
    try {
      await expensesApi.setLimit(token, { category, amount: val });
      toast.success("Budget limit saved!");
      onSaved();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(11,16,32,.8)", backdropFilter:"blur(8px)" }}>
      <div className="card w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-base-surface-2 flex items-center justify-center text-xl">{meta.icon}</div>
            <div>
              <div className="font-display font-semibold text-ink-primary capitalize">{meta.label}</div>
              <div className="text-xs text-ink-muted">Monthly limit</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
        </div>
        {err && <div className="mb-4 p-3 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">Monthly limit</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-mono">R$</span>
              <input className="input pl-10 font-mono" type="number" step="0.01" min="1" value={amount}
                onChange={e => setAmount(e.target.value)} required />
            </div>
            <p className="text-xs text-ink-muted mt-1.5">Suggested: {fmt(meta.suggested)}</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <span className="flex gap-2 items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : <><Check className="w-4 h-4" />Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LimitsPage() {
  const { token } = useAuth();
  const [limits, setLimits]       = useState<CategoryLimit[]>([]);
  const [summary, setSummary]     = useState<MonthlySummary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [modal, setModal]         = useState<string | null>(null);  // category being edited
  const [deleting, setDeleting]   = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true); setError("");
      const [lims, sum] = await Promise.all([
        expensesApi.limits(token),
        expensesApi.summary(token),
      ]);
      setLimits(lims);
      setSummary(sum);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(limitId: string) {
    if (!token) return;
    setDeleting(limitId);
    try {
      await expensesApi.deleteLimit(token, limitId);
      setLimits(l => l.filter(x => x.id !== limitId));
      toast.success("Limit removed");
    } catch { toast.error("Failed to remove limit"); }
    finally { setDeleting(null); }
  }

  const limitedCats = new Set(limits.map(l => l.category));
  const unlimitedCats = ALL_CATS.filter(c => !limitedCats.has(c.key));
  const totalBudget = limits.reduce((s, l) => s + l.amount, 0);
  const totalSpent  = summary?.categories.reduce((s, c) => s + c.total, 0) ?? 0;
  const overallPct  = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const editingLimit = modal ? limits.find(l => l.category === modal) : undefined;

  return (
    <div className="space-y-6">
      {modal && (
        <SetLimitModal
          category={modal}
          current={editingLimit?.amount}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-primary">Budget Limits</h1>
          <p className="text-ink-secondary mt-1">Set monthly spending limits per category</p>
        </div>
        {unlimitedCats.length > 0 && (
          <button onClick={() => setModal(unlimitedCats[0].key)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> New Limit
          </button>
        )}
      </div>

      {error && (
        <div className="card p-4 flex gap-3 border-brand-red/20">
          <AlertCircle className="w-5 h-5 text-brand-red flex-shrink-0" />
          <span className="text-sm text-ink-secondary">{error}</span>
          <button onClick={load} className="ml-auto btn-ghost text-xs">Retry</button>
        </div>
      )}

      {/* Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs text-ink-muted mb-1">Total Budget</div>
          <div className="font-display text-2xl font-bold text-ink-primary">{fmt(totalBudget)}</div>
          <div className="text-xs text-ink-muted mt-1">{limits.length} limits set</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-ink-muted mb-1">Total Spent</div>
          <div className="font-display text-2xl font-bold text-ink-primary">{fmt(totalSpent)}</div>
          <div className={clsx("text-xs mt-1", totalBudget > totalSpent ? "text-brand-green" : "text-brand-red")}>
            {totalBudget > totalSpent ? `+${fmt(totalBudget - totalSpent)} remaining` : `${fmt(totalSpent - totalBudget)} over budget`}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-ink-muted mb-2">Overall Usage</div>
          <div className="flex items-end gap-2">
            <div className="font-display text-2xl font-bold text-ink-primary">{overallPct}%</div>
            <div className={clsx("badge mb-1", overallPct>=90?"badge-red":overallPct>=70?"badge-amber":"badge-green")}>
              {overallPct>=90?"Critical":overallPct>=70?"Warning":"On Track"}
            </div>
          </div>
          <div className="mt-2 h-2 bg-base-surface-3 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width:`${Math.min(overallPct,100)}%`, background:overallPct>=90?"#FF4444":overallPct>=70?"#FFB800":"#00D084" }} />
          </div>
        </div>
      </div>

      {/* Active Limits */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      ) : limits.length === 0 ? (
        <div className="card p-12 text-center">
          <Target className="w-12 h-12 text-ink-muted mx-auto mb-4" />
          <h3 className="font-display font-semibold text-ink-primary mb-2">No budget limits yet</h3>
          <p className="text-sm text-ink-secondary mb-5">Set limits to get alerts before you overspend.</p>
          <button onClick={() => setModal("alimentacao")} className="btn-primary text-sm inline-flex">
            <Plus className="w-4 h-4" /> Set first limit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="section-title">Active Limits</div>
          {limits.map(lim => {
            const spent = summary?.categories.find(c => c.category === lim.category)?.total ?? 0;
            const pct = lim.amount > 0 ? Math.round((spent / lim.amount) * 100) : 0;
            const remaining = lim.amount - spent;
            const status = getStatus(pct);
            const meta = ALL_CATS.find(c => c.key === lim.category);
            return (
              <div key={lim.id} className="card p-5 hover:border-base-border-light transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-base-surface-2">
                    {meta?.icon ?? "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-ink-primary capitalize">{meta?.label ?? lim.category}</span>
                        <span className={clsx("badge text-[10px]", pct>=100?"badge-red":pct>=70?"badge-amber":"badge-green")}>{status.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-mono text-sm font-semibold text-ink-primary">{fmt(spent)}</span>
                          <span className="text-ink-muted text-sm"> / {fmt(lim.amount)}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setModal(lim.category)}
                            className="w-7 h-7 rounded-lg bg-base-surface-2 hover:bg-base-surface-3 flex items-center justify-center text-xs text-ink-secondary transition-all">
                            ✏️
                          </button>
                          <button onClick={() => handleDelete(lim.id)} disabled={deleting===lim.id}
                            className="w-7 h-7 rounded-lg hover:bg-brand-red/15 flex items-center justify-center transition-all">
                            {deleting===lim.id
                              ? <div className="w-3.5 h-3.5 border border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5 text-brand-red" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-base-surface-3 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width:`${Math.min(pct,100)}%`, background:status.color }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted">{pct}% used</span>
                      <span className={clsx("font-medium", remaining<=0?"text-brand-red":"text-ink-secondary")}>
                        {remaining<=0 ? `${fmt(Math.abs(remaining))} over budget` : `${fmt(remaining)} remaining`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unlimited categories */}
      {unlimitedCats.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-ink-muted">No Limit Set</div>
          <div className="grid grid-cols-2 gap-3">
            {unlimitedCats.map(cat => (
              <div key={cat.key} className="card p-4 flex items-center gap-3 hover:border-brand-purple/30 cursor-pointer transition-all group"
                onClick={() => setModal(cat.key)}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-base-surface-2">{cat.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink-primary">{cat.label}</div>
                  <div className="text-xs text-ink-muted">No budget limit</div>
                </div>
                <button className="btn-ghost text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-3.5 h-3.5" /> Set
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

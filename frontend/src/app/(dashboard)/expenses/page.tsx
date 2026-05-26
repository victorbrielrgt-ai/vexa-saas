"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { Search, Filter, Plus, Trash2, Clock, AlertCircle, X } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { expensesApi, type Expense, type CreateExpensePayload } from "@/lib/api";
import toast from "react-hot-toast";

const CATEGORIES = ["all","alimentacao","transporte","lazer","saude","moradia","roupas","educacao","outros"];
const CAT_COLORS: Record<string, string> = {
  alimentacao:"#5B2EFF", transporte:"#00D084", lazer:"#FFB800",
  saude:"#00C4FF", moradia:"#FF4444", roupas:"#FF6B6B",
  educacao:"#00D084", outros:"#8B9AB5",
};
const CAT_ICONS: Record<string, string> = {
  alimentacao:"🍽️", transporte:"🚗", lazer:"🎮",
  saude:"💊", moradia:"🏠", roupas:"👕", educacao:"📚", outros:"📦",
};

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}
function fmtDate(str: string) {
  return new Date(str).toLocaleDateString("pt-BR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
}
function timeAgo(str: string) {
  const h = Math.floor((Date.now() - new Date(str).getTime()) / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

// ── Add Expense Modal ─────────────────────────────────────────────────────────
function AddExpenseModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { token } = useAuth();
  const [form, setForm] = useState<CreateExpensePayload>({ amount: 0, category: "outros", description: "", source: "web" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (form.amount <= 0) { setErr("Amount must be greater than 0"); return; }
    setSaving(true);
    try {
      await expensesApi.create(token, form);
      toast.success("Expense added!");
      onAdded();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(11,16,32,.8)", backdropFilter: "blur(8px)" }}>
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink-primary">Add Expense</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
        </div>
        {err && (
          <div className="mb-4 p-3 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{err}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">Amount (R$)</label>
            <input className="input font-mono" type="number" step="0.01" min="0.01" placeholder="0.00"
              value={form.amount || ""} onChange={e => setForm(f => ({...f, amount: parseFloat(e.target.value) || 0}))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">Category</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.filter(c => c !== "all").map(cat => (
                <button key={cat} type="button" onClick={() => setForm(f => ({...f, category: cat}))}
                  className={clsx("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
                    form.category === cat ? "bg-brand-purple text-white" : "bg-base-surface-2 text-ink-secondary hover:text-ink-primary"
                  )}>
                  {CAT_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">Description (optional)</label>
            <input className="input text-sm" type="text" placeholder="e.g. Lunch at restaurant"
              value={form.description || ""} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <span className="flex gap-2 items-center"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span> : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const { token } = useAuth();
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [activeCat, setActiveCat]   = useState("all");
  const [showAdd, setShowAdd]       = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await expensesApi.list(token, { limit: 100 });
      setExpenses(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!token) return;
    setDeleting(id);
    try {
      await expensesApi.delete(token, id);
      setExpenses(ex => ex.filter(e => e.id !== id));
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  const filtered = expenses.filter(e => {
    const matchCat = activeCat === "all" || e.category === activeCat;
    const matchSearch = !search || (e.description ?? "").toLowerCase().includes(search.toLowerCase()) || e.category.includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onAdded={load} />}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-primary">Expenses</h1>
          <p className="text-ink-secondary mt-1">{filtered.length} transactions · {fmt(total)}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {error && (
        <div className="card p-4 flex gap-3 border-brand-red/20">
          <AlertCircle className="w-5 h-5 text-brand-red flex-shrink-0" />
          <span className="text-sm text-ink-secondary">{error}</span>
          <button onClick={load} className="ml-auto btn-ghost text-xs">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="card p-5 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input className="input pl-10 text-sm" placeholder="Search expenses…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-secondary text-sm"><Filter className="w-4 h-4" /> Filter</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className={clsx("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
                activeCat === cat ? "bg-brand-purple text-white" : "bg-base-surface-2 text-ink-secondary hover:text-ink-primary hover:bg-base-surface-3"
              )}>
              {cat === "all" ? "All" : `${CAT_ICONS[cat]} ${cat}`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-base-border flex items-center gap-3">
          <div className="flex-1 text-xs font-semibold text-ink-muted uppercase tracking-wide">Description</div>
          <div className="w-28 text-xs font-semibold text-ink-muted uppercase tracking-wide">Category</div>
          <div className="w-24 text-xs font-semibold text-ink-muted uppercase tracking-wide">Source</div>
          <div className="w-36 text-xs font-semibold text-ink-muted uppercase tracking-wide">Date</div>
          <div className="w-28 text-xs font-semibold text-ink-muted uppercase tracking-wide text-right">Amount</div>
          <div className="w-8" />
        </div>
        <div className="divide-y divide-base-border">
          {loading ? (
            [1,2,3,4,5].map(i => (
              <div key={i} className="px-6 py-4 flex gap-3">
                <div className="w-9 h-9 skeleton rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-4 skeleton rounded w-48" /><div className="h-3 skeleton rounded w-24" /></div>
                <div className="w-28 h-4 skeleton rounded" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-ink-secondary text-sm">No expenses found.</p>
              {expenses.length === 0 && (
                <button onClick={() => setShowAdd(true)} className="mt-4 btn-primary text-sm inline-flex">
                  <Plus className="w-4 h-4" /> Add your first expense
                </button>
              )}
            </div>
          ) : (
            filtered.map(expense => (
              <div key={expense.id} className="px-6 py-4 flex items-center gap-3 hover:bg-base-surface-2 transition-all group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${CAT_COLORS[expense.category] ?? "#8B9AB5"}18` }}>
                    {CAT_ICONS[expense.category] ?? "📦"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink-primary truncate">{expense.description || expense.category}</div>
                    {expense.confidence < 0.95 && (
                      <div className="text-[10px] text-brand-amber">AI classified · {Math.round(expense.confidence*100)}% confidence</div>
                    )}
                  </div>
                </div>
                <div className="w-28">
                  <span className="text-[10px] px-2 py-0.5 rounded-md capitalize font-medium"
                    style={{ background:`${CAT_COLORS[expense.category]??"#8B9AB5"}18`, color:CAT_COLORS[expense.category]??"#8B9AB5", border:`1px solid ${CAT_COLORS[expense.category]??"#8B9AB5"}30` }}>
                    {expense.category}
                  </span>
                </div>
                <div className="w-24">
                  <span className={clsx("badge text-[10px] px-2 py-0.5 rounded-md capitalize",
                    expense.source === "whatsapp" ? "badge-green" : "badge-purple")}>
                    {expense.source}
                  </span>
                </div>
                <div className="w-36 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{fmtDate(expense.created_at)}</span>
                </div>
                <div className="w-28 text-right">
                  <span className="font-mono text-sm font-semibold text-ink-primary">{fmt(expense.amount)}</span>
                </div>
                <div className="w-8 flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={deleting === expense.id}
                    className="w-7 h-7 rounded-lg hover:bg-brand-red/15 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                    {deleting === expense.id
                      ? <div className="w-3.5 h-3.5 border border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5 text-brand-red" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { Bell, AlertTriangle, TrendingUp, Target, CheckCircle, X, Zap, Clock, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { alertsApi, type Alert } from "@/lib/api";
import toast from "react-hot-toast";

const ALERT_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  critical:{ icon:AlertTriangle, color:"text-brand-red",          bg:"bg-brand-red-glow",    border:"border-brand-red/20"    },
  warning: { icon:AlertTriangle, color:"text-brand-amber",        bg:"bg-brand-amber-glow",  border:"border-brand-amber/20"  },
  info:    { icon:Zap,           color:"text-brand-purple-light", bg:"bg-brand-purple-glow", border:"border-brand-purple/20" },
};
const TYPE_ICONS: Record<string, React.ElementType> = {
  limit_warning:AlertTriangle, anomaly:TrendingUp, insight:Zap, goal:CheckCircle,
};

function timeAgo(str: string) {
  const h = Math.floor((Date.now() - new Date(str).getTime()) / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

export default function AlertsPage() {
  const { token } = useAuth();
  const [alerts, setAlerts]     = useState<Alert[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState<"all"|"unread"|"critical">("all");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true); setError("");
      const data = await alertsApi.list(token);
      setAlerts(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleDismiss(id: string) {
    if (!token) return;
    try {
      await alertsApi.dismiss(token, id);
      setDismissed(d => new Set([...d, id]));
    } catch { toast.error("Failed to dismiss"); }
  }

  async function handleRead(id: string) {
    if (!token) return;
    try {
      await alertsApi.markRead(token, id);
      setAlerts(a => a.map(x => x.id === id ? {...x, is_read: true} : x));
    } catch { /* non-fatal */ }
  }

  async function handleMarkAllRead() {
    if (!token) return;
    setMarkingAll(true);
    try {
      await alertsApi.markAllRead(token);
      setAlerts(a => a.map(x => ({...x, is_read: true})));
      toast.success("All alerts marked as read");
    } catch { toast.error("Failed"); }
    finally { setMarkingAll(false); }
  }

  const visible = alerts.filter(a => {
    if (dismissed.has(a.id) || a.is_dismissed) return false;
    if (filter === "unread")   return !a.is_read;
    if (filter === "critical") return a.severity === "critical";
    return true;
  });

  const unreadCount = alerts.filter(a => !a.is_read && !dismissed.has(a.id) && !a.is_dismissed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-ink-primary">Alerts</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-brand-purple text-white text-xs font-bold">{unreadCount} new</span>
            )}
          </div>
          <p className="text-ink-secondary mt-1">Smart notifications powered by AI monitoring</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} disabled={markingAll} className="btn-ghost text-sm text-ink-muted">
            {markingAll ? "Marking…" : "Mark all as read"}
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:"Total",    value:alerts.length,                                        color:"text-ink-primary"         },
          { label:"Unread",   value:unreadCount,                                          color:"text-brand-purple-light"  },
          { label:"Critical", value:alerts.filter(a=>a.severity==="critical").length,     color:"text-brand-red"           },
          { label:"Insights", value:alerts.filter(a=>a.type==="insight").length,          color:"text-brand-green"         },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            {loading ? <div className="h-8 skeleton rounded w-12 mx-auto mb-1" /> :
              <div className={clsx("font-display text-2xl font-bold", color)}>{value}</div>
            }
            <div className="text-xs text-ink-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-base-surface rounded-xl w-fit">
        {(["all","unread","critical"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx("px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
              filter === f ? "bg-brand-purple text-white" : "text-ink-secondary hover:text-ink-primary"
            )}>{f}</button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)
        ) : visible.length === 0 ? (
          <div className="card py-16 text-center">
            <Bell className="w-10 h-10 text-ink-muted mx-auto mb-3" />
            <p className="text-ink-secondary">
              {filter === "unread" ? "No unread alerts." : filter === "critical" ? "No critical alerts." : "No alerts yet."}
            </p>
            {alerts.length === 0 && (
              <p className="text-xs text-ink-muted mt-2">
                Alerts are generated automatically when you approach budget limits.
              </p>
            )}
          </div>
        ) : (
          visible.map(alert => {
            const cfg  = ALERT_CFG[alert.severity] ?? ALERT_CFG.info;
            const Icon = cfg.icon;
            const TypeIcon = TYPE_ICONS[alert.type] ?? Bell;
            return (
              <div key={alert.id}
                onClick={() => !alert.is_read && handleRead(alert.id)}
                className={clsx(
                  "card p-5 flex gap-4 transition-all hover:border-base-border-light cursor-pointer",
                  !alert.is_read && "border-l-2 border-l-brand-purple"
                )}>
                <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border", cfg.bg, cfg.border)}>
                  <TypeIcon className={clsx("w-5 h-5", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-semibold text-ink-primary text-sm">{alert.title}</span>
                      {!alert.is_read && <span className="w-1.5 h-1.5 rounded-full bg-brand-purple flex-shrink-0" />}
                      <span className={clsx("badge text-[10px] px-2 py-0.5 rounded-md capitalize border", cfg.bg, cfg.color, cfg.border)}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="flex items-center gap-1 text-xs text-ink-muted whitespace-nowrap">
                        <Clock className="w-3 h-3" />{timeAgo(alert.created_at)}
                      </span>
                      <button onClick={e => { e.stopPropagation(); handleDismiss(alert.id); }}
                        className="w-6 h-6 rounded-md hover:bg-base-surface-3 flex items-center justify-center transition-all">
                        <X className="w-3.5 h-3.5 text-ink-muted" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-ink-secondary leading-relaxed">{alert.message}</p>
                  {alert.category && (
                    <div className="mt-2">
                      <span className="badge-purple text-[10px] px-2 py-0.5 rounded-md capitalize">{alert.category}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

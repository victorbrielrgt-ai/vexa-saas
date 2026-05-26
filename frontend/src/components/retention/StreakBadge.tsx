"use client";
import { useEffect, useState, useCallback } from "react";
import { clsx } from "clsx";
import { copilotApi, type StreakData } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

function FireIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c0 0-4 4-4 8a4 4 0 0 0 8 0c0-1.5-.5-3-1.5-4.5C14 7 14 9 12 10c0 0 1-3-1-5C10 7 9 9 9 10.5A3 3 0 0 0 12 13.5 3 3 0 0 0 15 10.5C15 7 12 2 12 2Z" />
    </svg>
  );
}

export function StreakBadge({ compact = false }: { compact?: boolean }) {
  const { token } = useAuth();
  const [data, setData] = useState<StreakData | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try { setData(await copilotApi.streak(token)); } catch {}
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (!data) return null;

  const { streak_days, achievements } = data;
  const unlocked = achievements.filter(a => a.unlocked);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {streak_days > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background:"rgba(255,184,0,0.12)", color:"#FFB800", border:"1px solid rgba(255,184,0,.2)" }}>
            <FireIcon size={12} />
            {streak_days}
          </div>
        )}
        {unlocked.slice(0,3).map(a => (
          <span key={a.id} className="text-base" title={a.label}>{a.icon}</span>
        ))}
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-primary">Tracking streak</span>
        <span className="text-[10px] text-ink-muted uppercase tracking-wide">Retention</span>
      </div>

      {/* Streak counter */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center"
            style={{ background: streak_days > 0 ? "linear-gradient(135deg,rgba(255,184,0,.2),rgba(255,184,0,.05))" : "rgba(255,255,255,.04)", border: streak_days > 0 ? "1px solid rgba(255,184,0,.3)" : "1px solid rgba(255,255,255,.06)" }}>
            <div className={clsx("text-2xl", streak_days > 0 ? "text-brand-amber" : "text-ink-muted")}>
              <FireIcon size={28} />
            </div>
            <span className="text-xs font-bold" style={{ color: streak_days > 0 ? "#FFB800" : undefined }}>{streak_days}d</span>
          </div>
          {streak_days >= 7 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-amber flex items-center justify-center text-[8px] font-bold text-black">
              ✓
            </div>
          )}
        </div>
        <div>
          <div className="text-lg font-display font-bold text-ink-primary">
            {streak_days === 0 ? "Start today" : streak_days === 1 ? "1 day" : `${streak_days} days`}
          </div>
          <div className="text-xs text-ink-secondary">
            {streak_days === 0 ? "Add an expense to begin your streak"
             : streak_days < 7  ? `${7 - streak_days} more days for the week badge 🔥`
             : streak_days < 30 ? `${30 - streak_days} more days for month hero 🏆`
             : "You're a tracking champion! 🥇"
            }
          </div>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div>
          <div className="text-xs text-ink-muted mb-2">Achievements</div>
          <div className="flex gap-2 flex-wrap">
            {achievements.map(a => (
              <div key={a.id}
                className={clsx("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                  a.unlocked
                    ? "bg-brand-purple/12 text-brand-purple-light border border-brand-purple/20"
                    : "bg-white/3 text-ink-muted border border-white/5 opacity-50"
                )}>
                <span>{a.icon}</span>
                <span>{a.label}</span>
                {!a.unlocked && <span className="text-[10px]">🔒</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { clsx } from "clsx";

interface MetricCardProps {
  label: string;
  value: string;
  subvalue?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string; positive?: boolean };
  variant?: "default" | "purple" | "green" | "red";
  className?: string;
}

const VARIANTS = {
  default: "card",
  purple: "card-purple",
  green: "card-green",
  red: "border border-brand-red/20 bg-brand-red-glow/20 rounded-2xl",
};
const ICON_BG   = { default:"bg-base-surface-3", purple:"bg-brand-purple/20", green:"bg-brand-green/15", red:"bg-brand-red/15" };
const ICON_CLR  = { default:"text-ink-secondary", purple:"text-brand-purple-light", green:"text-brand-green", red:"text-brand-red" };

export function MetricCard({ label, value, subvalue, icon: Icon, trend, variant="default", className }: MetricCardProps) {
  const isPositive = trend?.positive ?? (trend ? trend.value >= 0 : false);
  return (
    <div className={clsx(VARIANTS[variant], "p-5", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", ICON_BG[variant])}>
          <Icon className={clsx("w-5 h-5", ICON_CLR[variant])} />
        </div>
        {trend && (
          <div className={clsx("flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg",
            isPositive ? "text-brand-green bg-brand-green-glow" : "text-brand-red bg-brand-red-glow"
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
        {subvalue && <div className="text-xs text-ink-muted mt-1">{subvalue}</div>}
        {trend && <div className="text-xs text-ink-muted">{trend.label}</div>}
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, TrendingUp, Target, Bell, Settings, LogOut, Zap, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/expenses", icon: Receipt, label: "Expenses" },
  { href: "/dashboard/insights", icon: TrendingUp, label: "AI Insights" },
  { href: "/dashboard/limits", icon: Target, label: "Budget Limits" },
  { href: "/dashboard/alerts", icon: Bell, label: "Alerts" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-30"
      style={{ background: "rgba(11,16,32,0.97)", backdropFilter: "blur(20px)", borderRight: "1px solid #1E2D4A" }}>
      <div className="flex items-center gap-3 px-6 py-6 border-b border-base-border">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #5B2EFF, #3D1ECC)", boxShadow: "0 4px 20px rgba(91,46,255,.5)" }}>
          <Zap className="w-5 h-5 text-white" fill="white" />
        </div>
        <div>
          <span className="font-display text-lg font-bold text-ink-primary">VEXA</span>
          <div className="text-[10px] text-ink-muted font-medium tracking-widest uppercase">Financial AI</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 mb-3">
          <span className="text-[10px] font-semibold text-ink-muted tracking-widest uppercase">Core</span>
        </div>
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                active ? "bg-brand-purple/15 text-brand-purple-light border border-brand-purple/20"
                       : "text-ink-secondary hover:text-ink-primary hover:bg-base-surface-2"
              )}>
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand-purple rounded-r-full" />}
              <item.icon className={clsx("w-4 h-4 flex-shrink-0", active ? "text-brand-purple" : "text-ink-muted group-hover:text-ink-secondary")} />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
            </Link>
          );
        })}
        <div className="px-3 pt-4 mb-3">
          <span className="text-[10px] font-semibold text-ink-muted tracking-widest uppercase">System</span>
        </div>
        <Link href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-base-surface-2 transition-all">
          <Settings className="w-4 h-4 text-ink-muted" />
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-base-border">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-surface-2 transition-all group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-purple-dim flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-ink-primary truncate">{profile?.name || "User"}</div>
            <div className="text-xs text-ink-muted truncate">{profile?.email || ""}</div>
          </div>
          <button onClick={logout} title="Sign out"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-brand-red/10">
            <LogOut className="w-4 h-4 text-ink-muted hover:text-brand-red transition-colors" />
          </button>
        </div>
      </div>
    </aside>
  );
}

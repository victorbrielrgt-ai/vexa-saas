"use client";

export const dynamic = "force-dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
    if (!isLoading && isAuthenticated && profile && !profile.onboarding_done) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, isLoading, profile, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-base-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin" />
          <span className="text-ink-muted text-sm">Loading your workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-bg bg-mesh">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

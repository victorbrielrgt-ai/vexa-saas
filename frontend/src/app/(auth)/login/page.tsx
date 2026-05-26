"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, isAuthenticated, isLoading, profile } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const next = searchParams.get("next") || "/dashboard";
  const authError = searchParams.get("error");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (profile && !profile.onboarding_done) {
        router.replace("/onboarding");
      } else {
        router.replace(next);
      }
    }
  }, [isAuthenticated, isLoading, profile, router, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError("");
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      setError(msg);
    }
  }

  return (
    <div className="min-h-screen bg-base-bg bg-mesh flex">
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #5B2EFF 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #00D084 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #5B2EFF, #3D1ECC)", boxShadow: "0 4px 20px rgba(91,46,255,.5)" }}>
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="font-display text-2xl font-bold text-ink-primary">VEXA</span>
        </div>
        <div className="relative z-10">
          <h1 className="font-display text-5xl font-bold text-ink-primary leading-tight mb-6">
            Your intelligent<br /><span className="gradient-text">financial copilot</span>
          </h1>
          <p className="text-lg text-ink-secondary leading-relaxed mb-10">
            AI-powered insights, smart alerts, and real-time financial scoring.
          </p>
          <div className="space-y-4">
            {[
              { icon: "🧠", title: "AI Financial Analysis", desc: "Claude-powered insights on your spending" },
              { icon: "🎯", title: "Smart Budget Limits", desc: "Get alerted before you overspend" },
              { icon: "📊", title: "Financial Health Score", desc: "Track your progress from 0 to 1000" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-base-surface-2 flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                <div>
                  <div className="font-medium text-ink-primary">{title}</div>
                  <div className="text-sm text-ink-muted">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-ink-muted relative z-10">2026 VEXA. Intelligent finance for everyone.</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-ink-primary">Welcome back</h2>
            <p className="text-ink-secondary mt-1 text-sm">Sign in to your account</p>
          </div>

          {(authError || error) && (
            <div className="mb-5 flex items-start gap-3 p-3 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error || "Authentication failed. Please try again."}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input className="input pl-10 text-sm" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-ink-secondary">Password</label>
                <Link href="/forgot" className="text-xs text-brand-purple-light hover:text-brand-purple transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input className="input pl-10 pr-10 text-sm" type={showPwd ? "text" : "password"}
                  placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center mt-2">
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">Sign in <ArrowRight className="w-4 h-4" /></span>
              )}
            </button>
          </form>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-base-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-base-bg px-3 text-ink-muted">or</span>
            </div>
          </div>

          <button onClick={handleGoogle} className="btn-secondary w-full justify-center mt-4 text-sm gap-3">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-ink-muted">
            No account?{" "}
            <Link href="/signup" className="text-brand-purple-light hover:text-brand-purple font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-base-bg" />}>
      <LoginPageInner />
    </Suspense>
  );
}

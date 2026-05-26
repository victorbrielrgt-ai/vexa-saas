"use client";

export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError(""); setSubmitting(true);
    try {
      const { user } = await signup(email, password);
      if (user?.identities?.length === 0) {
        setError("An account with this email already exists. Please log in.");
      } else {
        setEmailSent(true);
        toast.success("Check your email to confirm your account!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-base-bg bg-mesh flex items-center justify-center p-8">
        <div className="w-full max-w-sm text-center card p-10">
          <div className="w-16 h-16 rounded-full bg-brand-green/15 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-brand-green" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink-primary mb-2">Check your inbox</h2>
          <p className="text-ink-secondary text-sm leading-relaxed mb-6">
            We sent a confirmation link to <strong className="text-ink-primary">{email}</strong>.
            Click it to activate your account and start your financial journey.
          </p>
          <Link href="/login" className="btn-primary justify-center w-full">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-bg bg-mesh flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #5B2EFF, #3D1ECC)", boxShadow: "0 4px 20px rgba(91,46,255,.5)" }}>
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="font-display text-2xl font-bold text-ink-primary">VEXA</span>
        </div>
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold text-ink-primary">Create your account</h2>
          <p className="text-ink-secondary mt-1 text-sm">Start your financial intelligence journey</p>
        </div>
        {error && (
          <div className="mb-5 flex items-start gap-3 p-3 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
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
            <label className="block text-sm font-medium text-ink-secondary mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input className="input pl-10 text-sm" type="password" placeholder="Min 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center mt-2">
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              <span className="flex items-center gap-2">Create account <ArrowRight className="w-4 h-4" /></span>
            )}
          </button>
        </form>
        <div className="mt-4 relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-base-border" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-base-bg px-3 text-ink-muted">or</span></div>
        </div>
        <button onClick={loginWithGoogle} className="btn-secondary w-full justify-center mt-4 text-sm gap-3">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-purple-light hover:text-brand-purple font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

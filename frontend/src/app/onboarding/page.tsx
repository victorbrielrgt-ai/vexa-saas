"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api";
import toast from "react-hot-toast";

const GOALS = [
  { key:"save_emergency", label:"Build emergency fund", icon:"🛡️" },
  { key:"reduce_debt",    label:"Pay off debt",          icon:"💳" },
  { key:"invest",         label:"Start investing",       icon:"📈" },
  { key:"travel",         label:"Save for travel",       icon:"✈️" },
  { key:"house",          label:"Buy a property",        icon:"🏠" },
  { key:"control",        label:"Control spending",      icon:"📊" },
];

const CATS = [
  { key:"alimentacao", label:"Food",      icon:"🍽️", suggested:800  },
  { key:"transporte",  label:"Transport", icon:"🚗", suggested:400  },
  { key:"lazer",       label:"Leisure",   icon:"🎮", suggested:300  },
  { key:"saude",       label:"Health",    icon:"💊", suggested:200  },
  { key:"moradia",     label:"Housing",   icon:"🏠", suggested:1500 },
];

const STEPS = [
  { id:"welcome", label:"Welcome" },
  { id:"profile", label:"Profile" },
  { id:"goals",   label:"Goals"   },
  { id:"limits",  label:"Limits"  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { token, profile, refreshProfile, isLoading } = useAuth();

  const [step, setStep]           = useState(0);
  const [name, setName]           = useState("");
  const [income, setIncome]       = useState("");
  const [currency, setCurrency]   = useState("BRL");
  const [goals, setGoals]         = useState<string[]>([]);
  const [limits, setLimits]       = useState<Record<string,string>>({});
  const [saving, setSaving]       = useState(false);

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      if (profile.name)           setName(profile.name);
      if (profile.monthly_income) setIncome(String(profile.monthly_income));
      if (profile.currency)       setCurrency(profile.currency);
      if (profile.financial_goal) setGoals([profile.financial_goal]);
      if (profile.onboarding_done) router.replace("/dashboard");
    }
  }, [profile, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple/30 border-t-brand-purple rounded-full animate-spin" />
      </div>
    );
  }

  const isLast = step === STEPS.length - 1;
  const progress = (step / (STEPS.length - 1)) * 100;

  function toggleGoal(key: string) {
    setGoals(g => g.includes(key) ? g.filter(k => k !== key) : [...g, key]);
  }

  async function saveStep(isFinish = false) {
    if (!token) return;
    setSaving(true);
    try {
      const initial_limits = isFinish
        ? Object.entries(limits)
            .filter(([, v]) => v && parseFloat(v) > 0)
            .map(([category, amount]) => ({ category, amount: parseFloat(amount) }))
        : undefined;

      await usersApi.onboarding(token, {
        name:           name || undefined,
        monthly_income: income ? parseFloat(income) : undefined,
        financial_goal: goals[0] || undefined,
        currency,
        onboarding_step: step + 1,
        onboarding_done: isFinish,
        initial_limits,
      });

      await refreshProfile();

      if (isFinish) {
        toast.success("Welcome to VEXA! 🎉");
        router.push("/dashboard");
      } else {
        setStep(s => s + 1);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-base-bg bg-mesh flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20"
          style={{ background:"radial-gradient(ellipse, #5B2EFF 0%, transparent 70%)", filter:"blur(80px)" }} />
      </div>
      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background:"linear-gradient(135deg, #5B2EFF, #3D1ECC)", boxShadow:"0 4px 20px rgba(91,46,255,.5)" }}>
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="font-display text-2xl font-bold text-ink-primary">VEXA</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center gap-1.5">
                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                  i < step  ? "bg-brand-purple" :
                  i === step ? "bg-brand-purple ring-4 ring-brand-purple/20" : "bg-base-surface-2")}>
                  {i < step
                    ? <Check className="w-3.5 h-3.5 text-white" />
                    : <span className={clsx("text-xs font-bold", i===step?"text-white":"text-ink-muted")}>{i+1}</span>
                  }
                </div>
                <span className={clsx("text-[10px] font-medium", i<=step?"text-ink-secondary":"text-ink-muted")}>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-base-surface-2 rounded-full overflow-hidden">
            <div className="h-full bg-brand-purple rounded-full transition-all duration-500" style={{ width:`${progress}%` }} />
          </div>
        </div>

        {/* Card */}
        <div className="card p-8">
          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-2"
                style={{ background:"linear-gradient(135deg,rgba(91,46,255,.2),rgba(0,208,132,.1))" }}>👋</div>
              <h2 className="font-display text-2xl font-bold text-ink-primary">Welcome to VEXA</h2>
              <p className="text-ink-secondary leading-relaxed">
                Your intelligent financial copilot, powered by AI. Let&apos;s set up your profile so VEXA can give you
                personalized insights and help you reach your goals.
              </p>
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[{icon:"🧠",label:"AI Analysis"},{icon:"📊",label:"Smart Alerts"},{icon:"🎯",label:"Goal Tracking"}].map(({icon,label})=>(
                  <div key={label} className="card-purple p-3 text-center rounded-xl">
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-xs font-medium text-ink-secondary">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — Profile */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-ink-primary">Your profile</h2>
                <p className="text-sm text-ink-secondary mt-1">Helps VEXA personalize your experience</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">Your name</label>
                <input className="input" placeholder="e.g. João Silva" value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">Monthly income (optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-mono">R$</span>
                  <input className="input pl-10 font-mono" type="number" placeholder="0.00" value={income} onChange={e=>setIncome(e.target.value)} />
                </div>
                <p className="text-xs text-ink-muted mt-1.5">Used to calculate your savings rate and financial score</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">Currency</label>
                <div className="flex gap-2">
                  {["BRL","USD","EUR"].map(c=>(
                    <button key={c} type="button" onClick={()=>setCurrency(c)}
                      className={clsx("px-4 py-2 rounded-lg text-sm font-mono font-medium transition-all border",
                        currency===c ? "bg-brand-purple text-white border-brand-purple" : "bg-base-surface-2 text-ink-secondary border-base-border hover:border-brand-purple/40"
                      )}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Goals */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-ink-primary">What are your goals?</h2>
                <p className="text-sm text-ink-secondary mt-1">VEXA will tailor insights for you</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map(({key,label,icon})=>(
                  <button key={key} type="button" onClick={()=>toggleGoal(key)}
                    className={clsx("p-4 rounded-xl border text-left transition-all",
                      goals.includes(key) ? "bg-brand-purple/15 border-brand-purple/40" : "bg-base-surface-2 border-base-border hover:border-brand-purple/30"
                    )}>
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="text-sm font-medium text-ink-primary">{label}</div>
                    {goals.includes(key) && (
                      <div className="mt-1.5 w-5 h-5 rounded-full bg-brand-purple flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Limits */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-ink-primary">Set budget limits</h2>
                <p className="text-sm text-ink-secondary mt-1">AI-suggested amounts. Adjust as needed.</p>
              </div>
              <div className="space-y-3">
                {CATS.map(({key,label,icon,suggested})=>(
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-base-surface-2 flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-primary">{label}</div>
                      <div className="text-xs text-ink-muted">Suggested: R${suggested}</div>
                    </div>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-xs font-mono">R$</span>
                      <input
                        className="w-full bg-base-surface-2 border border-base-border rounded-lg px-3 py-2 pl-8 text-sm font-mono text-ink-primary focus:outline-none focus:border-brand-purple/60"
                        type="number" placeholder={String(suggested)}
                        value={limits[key]||""} onChange={e=>setLimits(l=>({...l,[key]:e.target.value}))} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-ink-muted">Leave blank to skip. You can always set limits later.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step===0}
            className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={() => saveStep(isLast)} disabled={saving} className="btn-primary">
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {isLast ? "Go to Dashboard" : "Continue"} <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

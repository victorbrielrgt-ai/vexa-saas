"use client";
import Link from "next/link";
import { ArrowRight, Zap, Brain, Target, Shield, MessageCircle, TrendingUp, Star, Check } from "lucide-react";

const FEATURES = [
  { icon: Brain,          title: "AI that understands your money",   desc: "VEXA analyzes your spending patterns and delivers personalized insights — not generic advice.",                                                             color: "#5B2EFF" },
  { icon: MessageCircle,  title: "Track expenses via WhatsApp",       desc: "Send 'Lunch R$35' and VEXA categorizes, confirms and tracks it instantly. No app switching.",                                                            color: "#00D084" },
  { icon: Target,         title: "Limits that actually protect you",  desc: "Get smart alerts before you overspend — not after. Know in real time when you are close to limits.",                                                          color: "#FFB800" },
  { icon: TrendingUp,     title: "Financial health score 0–1000",     desc: "A single number that reflects your full financial behavior. Improve it month over month.",                                                                    color: "#00C4FF" },
  { icon: Shield,         title: "Predictive warnings",               desc: "Know 6 days in advance if you are trending over budget.",                                                                                                     color: "#5B2EFF" },
  { icon: Zap,            title: "Weekly and monthly reports",        desc: "Receive automated summaries every Sunday via WhatsApp. Your financial week at a glance.",                                                                     color: "#00D084" },
];

const SOCIAL_PROOF = [
  { quote: "Finally an app that tells me what I need to hear, not what I want to hear.", name: "Mariana L.", role: "Designer, SP" },
  { quote: "I started tracking expenses via WhatsApp during lunch. It changed my habits completely.",        name: "Carlos R.",   role: "Developer, BH" },
  { quote: "The financial score made me competitive with myself. I went from 620 to 810 in 3 months.",      name: "Fernanda S.", role: "Analyst, RJ" },
];

const PRICING = [
  {
    name: "Free", price: "R$0", period: "forever",
    desc: "Start your financial journey today.",
    features: ["Unlimited expense tracking", "Basic monthly summary", "3 budget limits", "Mobile + WhatsApp registration"],
    cta: "Start free", href: "/signup", highlight: false,
  },
  {
    name: "Pro", price: "R$19", period: "per month",
    desc: "Full AI intelligence, unlimited everything.",
    features: ["Everything in Free", "AI financial score (0–1000)", "Unlimited budget limits", "Predictive warnings", "Weekly WhatsApp report", "Priority AI insights"],
    cta: "Start Pro free for 14 days", href: "/signup?plan=pro", highlight: true,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-base-bg text-ink-primary">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(11,16,32,.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#5B2EFF,#3D1ECC)", boxShadow: "0 4px 16px rgba(91,46,255,.5)" }}>
            <Zap className="w-4 h-4 text-white" fill="white" />
          </div>
          <span className="font-display text-lg font-bold text-ink-primary">VEXA</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-ink-secondary">
          <a href="#features"  className="hover:text-ink-primary transition-colors">Features</a>
          <a href="#how"       className="hover:text-ink-primary transition-colors">How it works</a>
          <a href="#pricing"   className="hover:text-ink-primary transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"  className="text-sm text-ink-secondary hover:text-ink-primary transition-colors font-medium">Sign in</Link>
          <Link href="/signup" className="btn-primary text-sm py-2 px-4">Get started free <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-25"
            style={{ background: "radial-gradient(ellipse, #5B2EFF 0%, transparent 65%)", filter: "blur(80px)" }} />
          <div className="absolute top-48 left-1/4 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse, #00D084 0%, transparent 65%)", filter: "blur(60px)" }} />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
            style={{ background: "rgba(91,46,255,.12)", color: "#7B5CFF", border: "1px solid rgba(91,46,255,.25)" }}>
            <Zap className="w-3 h-3" fill="currentColor" /> Powered by Claude AI · Now in beta
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
            Your money,{" "}<span className="gradient-text">finally intelligent</span>
          </h1>
          <p className="text-xl text-ink-secondary leading-relaxed mb-10 max-w-2xl mx-auto">
            VEXA is an AI financial copilot that analyzes your spending behavior, predicts risks before they happen, and delivers insights that actually change your habits.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/signup" className="btn-primary text-base px-8 py-4">
              Start for free — no card needed <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how" className="btn-secondary text-base px-8 py-4">See how it works</a>
          </div>
          <div className="flex items-center justify-center gap-12 text-center">
            {[{ num:"2,400+",label:"users tracking" },{ num:"R$4.2M",label:"managed monthly" },{ num:"89%",label:"reduce overspending" }]
              .map(({ num, label }) => (
              <div key={label}>
                <div className="font-display text-2xl font-bold text-ink-primary">{num}</div>
                <div className="text-xs text-ink-muted mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="absolute inset-0 pointer-events-none" style={{ background:"linear-gradient(to bottom, transparent 60%, #0B1020 100%)", zIndex:10 }} />
          <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background:"#111827", boxShadow:"0 40px 120px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.05)" }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5" style={{ background:"#0F1828" }}>
              <div className="w-3 h-3 rounded-full bg-red-500/60"/><div className="w-3 h-3 rounded-full bg-yellow-500/60"/><div className="w-3 h-3 rounded-full bg-green-500/60"/>
              <div className="flex-1 mx-4 h-6 rounded-md flex items-center justify-center text-xs text-ink-muted" style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.06)" }}>app.vexa.ai/dashboard</div>
            </div>
            <div className="p-6 grid grid-cols-12 gap-4">
              <div className="col-span-9 grid grid-cols-4 gap-3">
                {[{ label:"Spent",val:"R$2,540",color:"#7B5CFF" },{ label:"Projected",val:"R$4,120",color:"#FFB800" },{ label:"Saved",val:"R$960",color:"#00D084" },{ label:"Score",val:"742",color:"#7B5CFF" }]
                  .map(m => (
                  <div key={m.label} className="rounded-xl p-3" style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.06)" }}>
                    <div className="text-[10px] text-ink-muted mb-1">{m.label}</div>
                    <div className="font-display text-lg font-bold" style={{ color:m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>
              <div className="col-span-3 rounded-xl p-3" style={{ background:"rgba(91,46,255,.08)", border:"1px solid rgba(91,46,255,.2)" }}>
                <div className="text-[10px] font-semibold text-brand-purple mb-2 uppercase tracking-wide">AI Copilot</div>
                {["🔴 Budget risk in 6 days","📈 Food +42% this week","✨ Saved 23% this month"].map(t => (
                  <div key={t} className="text-[10px] text-ink-secondary py-1.5 border-b border-white/5 last:border-0">{t}</div>
                ))}
              </div>
              <div className="col-span-7 rounded-xl p-3" style={{ background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)" }}>
                <div className="text-[10px] text-ink-muted mb-3">Spending by category</div>
                <div className="flex items-end gap-2 h-16">
                  {[65,42,80,35,90,55,70].map((h,i) => (
                    <div key={i} className="flex-1 rounded-sm" style={{ height:`${h}%`, background:`hsl(${240+i*20},70%,60%)`, opacity:.7 }}/>
                  ))}
                </div>
              </div>
              <div className="col-span-5 rounded-xl p-3" style={{ background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)" }}>
                <div className="text-[10px] text-ink-muted mb-2">Recent</div>
                {[{e:"🍽️",n:"iFood",a:"R$52.90"},{e:"🚗",n:"Uber",a:"R$18.50"},{e:"🎮",n:"Netflix",a:"R$55.90"}].map(t => (
                  <div key={t.n} className="flex justify-between items-center py-1 text-[10px] border-b border-white/4 last:border-0">
                    <span>{t.e} {t.n}</span><span className="text-ink-primary font-mono">{t.a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold text-brand-purple uppercase tracking-widest mb-3">How VEXA works</div>
            <h2 className="font-display text-4xl font-bold text-ink-primary mb-4">Track. Analyze. Improve.</h2>
            <p className="text-ink-secondary text-lg max-w-xl mx-auto">Three simple steps to complete financial intelligence.</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { step:"01", title:"Register expenses",    desc:'Send a WhatsApp message: "Lunch R$35". VEXA categorizes and confirms in seconds.',                         icon:"💬", color:"#5B2EFF" },
              { step:"02", title:"Get AI analysis",      desc:"Every day, VEXA analyzes patterns and surfaces insights: spikes, risks, savings opportunities.",           icon:"🧠", color:"#00D084" },
              { step:"03", title:"Improve your score",   desc:"Your financial score grows as your habits improve. Concrete, motivating, honest.",                         icon:"📈", color:"#FFB800" },
            ].map(s => (
              <div key={s.step} className="card p-6 hover:border-brand-purple/25 transition-all duration-300">
                <div className="text-4xl mb-4">{s.icon}</div>
                <div className="text-xs font-mono font-bold mb-2" style={{ color:s.color }}>{s.step}</div>
                <h3 className="font-display text-lg font-bold text-ink-primary mb-2">{s.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6" style={{ background:"rgba(255,255,255,.01)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold text-brand-green uppercase tracking-widest mb-3">Features</div>
            <h2 className="font-display text-4xl font-bold text-ink-primary mb-4">Intelligence, not just data</h2>
            <p className="text-ink-secondary text-lg max-w-xl mx-auto">VEXA does not just show numbers. It understands what they mean for you.</p>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-6 hover:-translate-y-1 transition-all duration-300"
                style={{ background:"rgba(17,24,39,.8)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background:`${f.color}18`, border:`1px solid ${f.color}30` }}>
                  <f.icon className="w-5 h-5" style={{ color:f.color }} />
                </div>
                <h3 className="font-display text-base font-bold text-ink-primary mb-2">{f.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs font-semibold text-brand-green uppercase tracking-widest mb-3">WhatsApp-first</div>
            <h2 className="font-display text-4xl font-bold text-ink-primary mb-4 leading-tight">Track money the way you live</h2>
            <p className="text-ink-secondary text-lg mb-8 leading-relaxed">
              No friction. No apps to open. Just send a message and VEXA handles the rest — categorization, confirmation, budget check, all in one reply.
            </p>
            <div className="space-y-3">
              {["Natural language registration: 'Coffee R$8'","Instant AI categorization","Budget check in real time","Weekly financial summary via WhatsApp","Smart alerts when limits are approaching"]
                .map(f => (
                <div key={f} className="flex items-center gap-3 text-sm text-ink-secondary">
                  <Check className="w-4 h-4 text-brand-green flex-shrink-0"/>{f}
                </div>
              ))}
            </div>
          </div>
          {/* WhatsApp chat mockup */}
          <div className="rounded-3xl overflow-hidden border border-white/8"
            style={{ background:"#0F1828", boxShadow:"0 24px 80px rgba(0,0,0,.6)" }}>
            <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5" style={{ background:"#0A1220" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:"linear-gradient(135deg,#5B2EFF,#3D1ECC)" }}>
                <Zap className="w-4 h-4 text-white" fill="white"/>
              </div>
              <div>
                <div className="text-sm font-medium text-ink-primary">VEXA</div>
                <div className="text-[10px] text-brand-green">online</div>
              </div>
            </div>
            <div className="p-4 space-y-3 text-sm">
              {[
                { from:"user", text:"Lunch R$42" },
                { from:"vexa", text:"✅ Registered: Lunch R$42 in food.\n💡 You have R$178 left in your food budget (78% used)." },
                { from:"user", text:"Uber to the office 18.50" },
                { from:"vexa", text:"✅ Transport R$18.50 registered.\n📊 This week: R$312 spent · R$48/day average." },
                { from:"user", text:"How am I doing this month?" },
                { from:"vexa", text:"📈 Score: 742/1000 (B+)\n✨ Spending 12% less than last month!\n⚠️ Food at 78% of limit. Be careful this week." },
              ].map((m, i) => (
                <div key={i} className={`flex ${m.from==="user" ? "justify-end" : ""}`}>
                  <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed"
                    style={m.from==="user"
                      ? { background:"#5B2EFF", color:"#fff" }
                      : { background:"rgba(255,255,255,.07)", color:"#C8D4F0", whiteSpace:"pre-line" }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-24 px-6" style={{ background:"rgba(255,255,255,.01)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-brand-amber" fill="currentColor"/>)}
            </div>
            <h2 className="font-display text-3xl font-bold text-ink-primary">Trusted by people who take money seriously</h2>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {SOCIAL_PROOF.map(s => (
              <div key={s.name} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-brand-amber" fill="currentColor"/>)}
                </div>
                <p className="text-sm text-ink-secondary leading-relaxed mb-4 italic">&ldquo;{s.quote}&rdquo;</p>
                <div>
                  <div className="text-sm font-semibold text-ink-primary">{s.name}</div>
                  <div className="text-xs text-ink-muted">{s.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-semibold text-brand-purple uppercase tracking-widest mb-3">Pricing</div>
            <h2 className="font-display text-4xl font-bold text-ink-primary mb-4">Simple, honest pricing</h2>
            <p className="text-ink-secondary">Start free. Upgrade when ready for full AI power.</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {PRICING.map(plan => (
              <div key={plan.name} className={`rounded-3xl p-8 relative overflow-hidden border ${plan.highlight ? "border-brand-purple/30" : "border-base-border"}`}
                style={plan.highlight
                  ? { background:"linear-gradient(135deg,rgba(91,46,255,.12),rgba(61,30,204,.06))", boxShadow:"0 0 60px rgba(91,46,255,.15)" }
                  : { background:"rgba(17,24,39,.8)" }}>
                {plan.highlight && (
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold" style={{ background:"#5B2EFF", color:"#fff" }}>RECOMMENDED</div>
                )}
                <div className="mb-6">
                  <div className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-1">{plan.name}</div>
                  <div className="font-display text-5xl font-bold text-ink-primary mb-1">{plan.price}</div>
                  <div className="text-sm text-ink-muted">{plan.period}</div>
                </div>
                <p className="text-sm text-ink-secondary mb-6">{plan.desc}</p>
                <div className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-3 text-sm text-ink-secondary">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-brand-green" : "text-ink-muted"}`}/>{f}
                    </div>
                  ))}
                </div>
                <Link href={plan.href} className={`w-full justify-center flex items-center gap-2 ${plan.highlight ? "btn-primary" : "btn-secondary"}`}>
                  {plan.cta} <ArrowRight className="w-4 h-4"/>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center">
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full opacity-20"
              style={{ background:"radial-gradient(ellipse, #5B2EFF 0%, transparent 70%)", filter:"blur(60px)" }}/>
          </div>
          <div className="relative">
            <h2 className="font-display text-5xl font-bold text-ink-primary mb-6 leading-tight">
              Start your financial<br/><span className="gradient-text">intelligence journey</span>
            </h2>
            <p className="text-xl text-ink-secondary mb-10">Join thousands of Brazilians who stopped guessing and started knowing.</p>
            <Link href="/signup" className="btn-primary text-lg px-10 py-5 inline-flex">
              Create free account <ArrowRight className="w-5 h-5"/>
            </Link>
            <p className="text-xs text-ink-muted mt-4">No credit card required. Free forever plan available.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-base-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:"linear-gradient(135deg,#5B2EFF,#3D1ECC)" }}>
              <Zap className="w-3.5 h-3.5 text-white" fill="white"/>
            </div>
            <span className="font-display font-bold text-ink-primary">VEXA</span>
          </div>
          <div className="text-xs text-ink-muted">© 2026 VEXA. Intelligent finance for everyone.</div>
          <div className="flex gap-6 text-xs text-ink-muted">
            <a href="#" className="hover:text-ink-secondary transition-colors">Privacy</a>
            <a href="#" className="hover:text-ink-secondary transition-colors">Terms</a>
            <a href="#" className="hover:text-ink-secondary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

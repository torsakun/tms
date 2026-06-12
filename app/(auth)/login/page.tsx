"use client";

export const dynamic = "force-dynamic";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Zap, BrainCircuit, Bot, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { Suspense } from "react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteAccepted = searchParams.get("invite_accepted");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans" style={{ background: "#f0f2f8" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(145deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6d28d9 100%)" }}>

        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #818cf8, transparent)" }} />
          <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
          <div className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #34d399, transparent)" }} />
          {/* Dot grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px"
          }} />
          {/* Floating shapes */}
          <div className="absolute top-[18%] right-[12%] w-16 h-16 rounded-2xl rotate-12 bg-white/5 border border-white/10" />
          <div className="absolute bottom-[22%] left-[8%] w-10 h-10 rounded-xl rotate-45 bg-white/5 border border-white/10" />
          <div className="absolute top-[60%] right-[25%] w-6 h-6 rounded-full bg-emerald-400/30" />
          <div className="absolute top-[30%] left-[15%] w-4 h-4 rounded-full bg-indigo-300/40" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <Zap className="text-white" size={20} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">QMaster</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(165,180,252,0.3)", color: "#c7d2fe" }}>
            <Sparkles size={12} />
            Powered by Generative AI
          </div>

          <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Test Intelligence<br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(90deg, #818cf8, #c084fc, #34d399)" }}>
              Reimagined.
            </span>
          </h1>

          <p className="text-lg text-indigo-200 mb-10 leading-relaxed font-light">
            Leverage state-of-the-art LLMs to auto-generate test cases, orchestrate smart automation, and guarantee flawless software delivery.
          </p>

          <div className="space-y-5">
            {[
              { icon: BrainCircuit, color: "#818cf8", bg: "rgba(129,140,248,0.15)", title: "LLM Case Generation", desc: "Instantly write test cases from requirements" },
              { icon: Bot, color: "#c084fc", bg: "rgba(192,132,252,0.15)", title: "Autonomous Execution", desc: "Self-healing Playwright scripts via AI" },
              { icon: ShieldCheck, color: "#34d399", bg: "rgba(52,211,153,0.15)", title: "Predictive Insights", desc: "Spot defects before they reach production" },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="flex items-center gap-4 group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{ background: bg, border: `1px solid ${color}30` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <div className="font-semibold text-white text-[15px]">{title}</div>
                  <div className="text-sm text-indigo-300">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-indigo-400 text-sm font-medium">
          © 2026 QMaster Systems Inc.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              <Zap className="text-white" size={20} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">QMaster</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[2rem] font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
              Welcome back
            </h2>
            <p className="text-slate-500 text-[15px]">
              Sign in to your workspace to continue
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {inviteAccepted && (
              <div className="p-4 bg-emerald-50 text-emerald-700 flex items-center rounded-xl border border-emerald-200 text-sm font-medium">
                <CheckCircle2 size={18} className="mr-3 shrink-0" />
                Invitation accepted! You can now sign in.
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-600 flex items-center rounded-xl border border-red-200 text-sm font-medium">
                <AlertCircle size={18} className="mr-3 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all text-[15px]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-sm font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all text-[15px]"
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:outline-none disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-md transition-all duration-200"
                style={{ background: loading ? "#6366f1" : "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating…
                  </>
                ) : (
                  <>
                    Sign in to Workspace
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Access is invite-only. Need an account?{" "}
            <a href="mailto:support@qmaster.app?subject=Workspace%20access%20request" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              Contact your admin
            </a>
          </p>

          {/* Decorative divider */}
          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium tracking-wider uppercase">
              Trusted by QA teams worldwide
            </p>
            <div className="flex justify-center gap-6 mt-3">
              {["99.9% uptime", "SOC 2", "GDPR"].map(label => (
                <span key={label} className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 inline-block" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f0f2f8] flex items-center justify-center text-slate-400">
        Loading workspace…
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

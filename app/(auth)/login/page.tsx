"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Zap,
  BrainCircuit,
  Bot,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Suspense } from "react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteAccepted = searchParams.get("invite_accepted");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [msEnabled, setMsEnabled] = useState(false);

  // Only show the Microsoft button when the azure-ad provider is actually
  // registered (env configured on this environment).
  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((d) => setMsEnabled(!!d?.["azure-ad"]))
      .catch(() => setMsEnabled(false));
  }, []);

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
      // NextAuth encodes the thrown Error message in res.error for CredentialsProvider
      const msg =
        res.error === "CredentialsSignin"
          ? "Invalid email or password"
          : res.error;
      setError(msg);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div
      className="min-h-screen flex w-full font-sans"
      style={{ background: "var(--bg-background)" }}
    >
      {/* Left Panel */}
      <div
        className="hidden lg:flex w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{
          background:
            "linear-gradient(145deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6d28d9 100%)",
        }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, #818cf8, transparent)",
            }}
          />
          <div
            className="absolute top-1/2 -right-24 w-80 h-80 rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, #a78bfa, transparent)",
            }}
          />
          <div
            className="absolute -bottom-24 left-1/4 w-96 h-96 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, #34d399, transparent)",
            }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Floating shapes */}
          <div className="absolute top-[18%] right-[12%] w-16 h-16 rounded-2xl rotate-12 bg-surface/5 border border-white/10" />
          <div className="absolute bottom-[22%] left-[8%] w-10 h-10 rounded-xl rotate-45 bg-surface/5 border border-white/10" />
          <div className="absolute top-[60%] right-[25%] w-6 h-6 rounded-full bg-emerald-400/30" />
          <div className="absolute top-[30%] left-[15%] w-4 h-4 rounded-full bg-indigo-300/40" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              <Zap className="text-white" size={20} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              QMaster
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-lg">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{
              background: "rgba(99,102,241,0.25)",
              border: "1px solid rgba(165,180,252,0.3)",
              color: "#c7d2fe",
            }}
          >
            <Sparkles size={12} />
            Powered by Generative AI
          </div>

          <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Test Intelligence
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #818cf8, #c084fc, #34d399)",
              }}
            >
              Reimagined.
            </span>
          </h1>

          <p className="text-lg text-indigo-200 mb-10 leading-relaxed font-light">
            Leverage state-of-the-art LLMs to auto-generate test cases,
            orchestrate smart automation, and guarantee flawless software
            delivery.
          </p>

          <div className="space-y-5">
            {[
              {
                icon: BrainCircuit,
                color: "#818cf8",
                bg: "rgba(129,140,248,0.15)",
                title: "LLM Case Generation",
                desc: "Instantly write test cases from requirements",
              },
              {
                icon: Bot,
                color: "#c084fc",
                bg: "rgba(192,132,252,0.15)",
                title: "Autonomous Execution",
                desc: "Self-healing Playwright scripts via AI",
              },
              {
                icon: ShieldCheck,
                color: "#34d399",
                bg: "rgba(52,211,153,0.15)",
                title: "Predictive Insights",
                desc: "Spot defects before they reach production",
              },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="flex items-center gap-4 group">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{ background: bg, border: `1px solid ${color}30` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <div className="font-semibold text-white text-[15px]">
                    {title}
                  </div>
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
      <div className="w-full lg:w-[48%] flex items-center justify-center p-8 sm:p-12 bg-slate-50 dark:bg-background/95">
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-surface rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-indigo-900/5 dark:shadow-indigo-900/20 border border-border/60 relative overflow-hidden">
            {/* Subtle top glare */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: "var(--primary)",
              }}
            >
              <Zap className="text-white" size={20} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-bold text-text-main tracking-tight">
              QMaster
            </span>
          </div>

          {/* Header */}
          <div className="mb-10 text-center">
            <h2 className="text-[32px] sm:text-[40px] font-black text-text-main tracking-tight leading-none mb-3">
              Welcome back
            </h2>
            <p className="text-text-muted text-[15px] font-medium">
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

            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-widest text-text-main opacity-80">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-3.5 bg-surface-hover/50 border border-border/80 rounded-xl text-text-main font-semibold placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[15px] hover:border-text-muted/40 shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-black uppercase tracking-widest text-text-main opacity-80">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[13px] font-bold text-indigo-500 hover:text-indigo-600 hover:underline transition-all"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-surface-hover/50 border border-border/80 rounded-xl text-text-main font-semibold placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[15px] hover:border-text-muted/40 shadow-inner"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl text-[15px] font-black tracking-wide text-white shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 focus:outline-none disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-indigo-500/20 transition-all duration-300"
                style={{
                  background: loading
                    ? "#6366f1"
                    : "linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)",
                }}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
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

          {/* SSO — only shown when Microsoft Entra is configured on this environment */}
          {msEnabled && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  or
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-[14px] font-bold text-text-main bg-surface border border-border/80 hover:bg-surface-hover hover:border-text-muted/40 hover:-translate-y-0.5 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 23 23"
                  aria-hidden="true"
                >
                  <rect x="1" y="1" width="10" height="10" fill="#f25022" />
                  <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
                  <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
                  <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
                </svg>
                Sign in with Microsoft
              </button>
            </>
          )}

          <p className="mt-8 text-center text-sm text-text-muted">
            Access is invite-only. Need an account?{" "}
            <a
              href="mailto:support@qmaster.app?subject=Workspace%20access%20request"
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Contact your admin
            </a>
          </p>

          {/* Decorative divider */}
          <div className="mt-10 pt-6 border-t border-border text-center">
            <p className="text-[11px] text-text-muted font-black tracking-wider uppercase">
              Trusted by QA teams worldwide
            </p>
            <div className="flex justify-center gap-6 mt-3">
              {["99.9% uptime", "SOC 2", "GDPR"].map((label) => (
                <span
                  key={label}
                  className="text-[11px] font-bold text-text-muted flex items-center gap-1.5 transition-colors hover:text-text-main"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block shadow-[0_0_6px_rgba(129,140,248,0.5)]" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-text-muted">
          Loading workspace…
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

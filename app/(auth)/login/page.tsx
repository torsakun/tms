"use client";

export const dynamic = "force-dynamic";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Activity, AlertCircle, CheckCircle2, Target, ShieldCheck, Zap, Sparkles, BrainCircuit, Bot } from "lucide-react";

import { Suspense } from "react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteAccepted = searchParams.get("invite_accepted");
  
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password123");
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
    <div className="min-h-screen flex w-full font-sans bg-background">
      {/* Left Panel - Branding & Visuals (Hidden on small screens) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 border-r border-slate-800">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[120px]"></div>
          <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[100px]"></div>
          <div className="absolute bottom-0 left-[20%] w-[80%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CgkJPGcgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiPgoJCQk8cGF0aCBkPSJNMCAwaDQwTTAgNDBoNDBNMCAwdjQwTTQwIDB2NDAiIC8+CgkJPC9nPgoJPC9zdmc+')] opacity-50 z-0"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <Activity className="text-white" size={24} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">QMaster</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center px-3 py-1 mb-6 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Sparkles size={14} className="mr-2 text-indigo-400" />
            Powered by Generative AI
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Test Intelligence <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">Reimagined.</span>
          </h1>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed font-light">
            Leverage state-of-the-art Large Language Models to auto-generate test cases, orchestrate smart automation, and guarantee flawless software delivery.
          </p>

          <div className="space-y-6">
            <div className="flex items-center text-slate-300 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mr-4 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:bg-indigo-500/20 transition-all duration-300">
                <BrainCircuit size={20} className="text-indigo-400" />
              </div>
              <div>
                <span className="font-semibold text-white block">LLM Case Generation</span>
                <span className="text-sm text-text-muted">Instantly write test cases from requirements</span>
              </div>
            </div>
            <div className="flex items-center text-slate-300 group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mr-4 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] group-hover:bg-purple-500/20 transition-all duration-300">
                <Bot size={20} className="text-purple-400" />
              </div>
              <div>
                <span className="font-semibold text-white block">Autonomous Execution</span>
                <span className="text-sm text-text-muted">Self-healing Playwright scripts via AI</span>
              </div>
            </div>
            <div className="flex items-center text-slate-300 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mr-4 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] group-hover:bg-emerald-500/20 transition-all duration-300">
                <Sparkles size={20} className="text-emerald-400" />
              </div>
              <div>
                <span className="font-semibold text-white block">Predictive Insights</span>
                <span className="text-sm text-text-muted">Spot defects before they reach production</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-text-muted text-sm font-medium">
          © 2026 QMaster Systems Inc.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-surface">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
              <Activity className="text-white" size={32} />
            </div>
          </div>
          
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">
              Welcome back
            </h2>
            <p className="text-text-muted">
              Please enter your credentials to access your workspace.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {inviteAccepted && (
              <div className="p-4 bg-emerald-50 text-emerald-700 flex items-center rounded-xl border border-emerald-100 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 size={20} className="mr-3 shrink-0" />
                Invitation accepted! You can now sign in.
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 flex items-center rounded-xl border border-red-100 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} className="mr-3 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-text-main">Work Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-background border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-text-main">Password</label>
                <a href="#" className="text-sm font-medium text-primary hover:text-blue-700 transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-background border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-primary-foreground bg-primary hover:bg-primary-hover hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all duration-200"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : "Sign in to Workspace"}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-text-muted">
            Don't have an account yet?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:text-blue-700 transition-colors">
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-text-muted">Loading workspace...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

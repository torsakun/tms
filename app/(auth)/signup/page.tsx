"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  AlertCircle,
  Loader2,
  Lock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // null = checking, true = open (first-admin setup), false = invite-only
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/register")
      .then((r) => r.json())
      .then((d) => setOpen(!!d.open))
      .catch(() => setOpen(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register");

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signInRes?.error) router.push("/login");
      else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--bg-background)" }}
    >
      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: "var(--primary)" }}
          >
            <Zap className="text-white" size={20} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-text-main tracking-tight">
            QMaster
          </span>
        </div>

        <div className="bg-surface rounded-2xl shadow-sm border border-border p-8">
          {open === null ? (
            <div className="py-12 flex flex-col items-center gap-3 text-text-muted">
              <Loader2 className="animate-spin" size={26} />
              <span className="text-sm">Checking…</span>
            </div>
          ) : open === false ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <Lock className="text-indigo-500" size={26} />
              </div>
              <h2 className="text-xl font-bold text-text-main tracking-tight mb-2">
                Invite-only workspace
              </h2>
              <p className="text-sm text-text-muted leading-relaxed mb-6">
                New accounts are created by invitation only. Please ask a
                workspace administrator to send you an invite — you&apos;ll
                receive a link to set up your account.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all"
                style={{
                  background: "var(--primary)",
                }}
              >
                Back to sign in <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full mb-3">
                  <ShieldCheck size={12} /> First-time setup
                </div>
                <h2 className="text-2xl font-extrabold text-text-main tracking-tight">
                  Create admin account
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  This first account becomes the workspace administrator.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 flex items-center rounded-xl border border-red-200 text-sm font-medium">
                    <AlertCircle size={16} className="mr-2 shrink-0" />
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
                  style={{
                    background: "var(--primary)",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      Create admin account <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-text-muted">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

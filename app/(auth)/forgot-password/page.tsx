"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Loader2, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSent(true); // Always show the same confirmation (no account enumeration)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-premium"
            style={{ background: "var(--primary)" }}
          >
            <Zap className="text-white" size={20} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-text-main tracking-tight">
            QMaster
          </span>
        </div>

        <div className="bg-surface rounded-2xl shadow-premium border border-border/80 p-8">
          {sent ? (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-success-soft flex items-center justify-center mx-auto mb-4">
                <MailCheck className="text-success-foreground" size={26} />
              </div>
              <h2 className="text-xl font-bold text-text-main tracking-tight mb-2">
                Check your inbox
              </h2>
              <p className="text-sm text-text-muted leading-relaxed mb-6">
                If an account exists for{" "}
                <span className="font-semibold text-text-main">{email}</span>,
                we&apos;ve sent a password reset link. It expires in 2 hours.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white shadow-premium hover:-translate-y-0.5 transition-all"
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
                <h2 className="text-2xl font-extrabold text-text-main tracking-tight">
                  Forgot password?
                </h2>
                <p className="text-text-muted text-sm mt-1">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3.5 bg-surface-hover/50 border border-border/80 rounded-xl text-text-main font-semibold placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-[15px] hover:border-text-muted/40 shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-premium hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
                  style={{
                    background: "var(--primary)",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      Send reset link <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-1.5 text-sm font-bold text-text-muted hover:text-primary transition-colors"
              >
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

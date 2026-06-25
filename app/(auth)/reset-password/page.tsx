"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [status, setStatus] = useState<"checking" | "valid" | "invalid">(
    "checking",
  );
  const [invalidMsg, setInvalidMsg] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setInvalidMsg("Missing reset token.");
      return;
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (r.ok && d.valid) setStatus("valid");
        else {
          setStatus("invalid");
          setInvalidMsg(d.error || "Invalid reset link.");
        }
      })
      .catch(() => {
        setStatus("invalid");
        setInvalidMsg("Could not validate reset link.");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(d.error || "Failed to reset password");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const card = (children: React.ReactNode) => (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--bg-background)" }}
    >
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
          {children}
        </div>
      </div>
    </div>
  );

  if (status === "checking") {
    return card(
      <div className="py-12 flex flex-col items-center gap-3 text-text-muted">
        <Loader2 className="animate-spin" size={26} />
        <span className="text-sm">Validating link…</span>
      </div>,
    );
  }

  if (status === "invalid") {
    return card(
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-2xl bg-danger-soft flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="text-danger-foreground" size={26} />
        </div>
        <h2 className="text-xl font-bold text-text-main tracking-tight mb-2">
          Link not valid
        </h2>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          {invalidMsg}
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white shadow-premium hover:-translate-y-0.5 transition-all"
          style={{ background: "var(--primary)" }}
        >
          Request a new link <ArrowRight size={16} />
        </Link>
      </div>,
    );
  }

  if (done) {
    return card(
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-2xl bg-success-soft flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="text-success-foreground" size={26} />
        </div>
        <h2 className="text-xl font-bold text-text-main tracking-tight mb-2">
          Password updated
        </h2>
        <p className="text-sm text-text-muted mb-2">
          Redirecting you to sign in…
        </p>
        <Loader2 className="animate-spin text-primary mx-auto" size={20} />
      </div>,
    );
  }

  return card(
    <>
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-3">
          <Lock size={12} /> Reset password
        </div>
        <h2 className="text-2xl font-extrabold text-text-main tracking-tight">
          Choose a new password
        </h2>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 bg-danger-soft text-danger-foreground flex items-center rounded-xl border border-danger/25 text-sm font-bold">
            <AlertCircle size={16} className="mr-2 shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-text-main mb-1.5">
            New password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3.5 bg-surface-hover/50 border border-border/80 rounded-xl text-text-main font-semibold placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-[15px] hover:border-text-muted/40 shadow-inner"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-main mb-1.5">
            Confirm password
          </label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3.5 bg-surface-hover/50 border border-border/80 rounded-xl text-text-main font-semibold placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-[15px] hover:border-text-muted/40 shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white shadow-premium hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
          style={{ background: "var(--primary)" }}
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Updating…
            </>
          ) : (
            <>
              Update password <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </>,
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-text-muted">
          Loading…
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

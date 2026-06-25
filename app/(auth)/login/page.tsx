"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { Inter } from "next/font/google";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Radar,
} from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteAccepted = searchParams.get("invite_accepted");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [msEnabled, setMsEnabled] = useState(false);

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
      setError(
        res.error === "CredentialsSignin"
          ? "Invalid email or password"
          : res.error,
      );
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className={`${inter.className} min-h-screen w-full bg-background text-[14px] text-text-main antialiased lg:grid lg:grid-cols-2`}>
      <section className="relative hidden min-h-screen overflow-hidden bg-[var(--neutral-950)] px-[44px] py-[40px] text-white lg:flex lg:flex-col">
        <svg
          className="absolute right-[-120px] top-1/2 -translate-y-1/2 opacity-40"
          width="560"
          height="560"
          viewBox="0 0 560 560"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="280" cy="280" r="90" stroke="var(--blue-500)" strokeWidth="1" />
          <circle cx="280" cy="280" r="150" stroke="var(--blue-500)" strokeWidth="1" strokeOpacity=".6" />
          <circle cx="280" cy="280" r="220" stroke="var(--blue-500)" strokeWidth="1" strokeOpacity=".35" />
          <circle cx="280" cy="280" r="290" stroke="var(--blue-500)" strokeWidth="1" strokeOpacity=".18" />
          <line x1="280" y1="0" x2="280" y2="560" stroke="var(--blue-500)" strokeWidth="1" strokeOpacity=".2" />
          <line x1="0" y1="280" x2="560" y2="280" stroke="var(--blue-500)" strokeWidth="1" strokeOpacity=".2" />
          <path d="M280 280 L470 170" stroke="var(--blue-400)" strokeWidth="2" />
          <circle cx="470" cy="170" r="5" fill="var(--blue-400)" />
          <circle cx="370" cy="350" r="3.5" fill="var(--green-400)" />
          <circle cx="200" cy="180" r="3.5" fill="var(--amber-400)" />
          </svg>

        <div className="relative flex items-center gap-[10px]">
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-primary text-primary-foreground">
            <Radar size={20} strokeWidth={2.2} />
          </div>
          <span className="text-[17px] font-bold tracking-[-0.01em]">
            QMaster
          </span>
        </div>

        <div className="relative mt-auto max-w-[380px]">
          <h1 className="max-w-[380px] text-[27px] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
            Every test cycle, read at a glance.
          </h1>
          <p className="mt-[14px] max-w-[360px] text-[14px] leading-[1.6] text-[var(--neutral-400)]">
            Plan, execute and triage with a precision instrument built for QA
            teams under pressure.
          </p>

          <div className="mt-[26px] flex gap-[22px]">
            {[
              ["94.2%", "avg pass rate"],
              ["2,484", "cases tracked"],
              ["11", "active runs"],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="text-[20px] font-semibold tabular-nums text-white">
                  {value}
                </div>
                <div className="text-[11px] text-[var(--neutral-400)]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-surface p-[40px] max-sm:px-6">
        <div className="flex w-full max-w-[340px] flex-col gap-[18px]">
          <div className="flex items-center gap-[10px] lg:hidden">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-primary text-primary-foreground">
              <Radar size={20} strokeWidth={2.2} />
            </div>
            <span className="text-[17px] font-bold tracking-[-0.01em] text-text-main">
              QMaster
            </span>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-text-main">
              Welcome back
            </h2>
            <p className="mt-1 text-[13.5px] text-text-muted">
              Sign in to your workspace.
            </p>
          </div>

          <form className="flex flex-col gap-[18px]" onSubmit={handleSubmit}>
            {inviteAccepted && (
              <div className="flex items-center rounded-[11px] border border-success/25 bg-success-soft px-3 py-2.5 text-[13px] font-semibold text-success-foreground">
                <CheckCircle2 size={17} className="mr-2 shrink-0" />
                Invitation accepted! You can now sign in.
              </div>
            )}

            {error && (
              <div className="flex items-center rounded-[11px] border border-danger/25 bg-danger-soft px-3 py-2.5 text-[13px] font-semibold text-danger-foreground">
                <AlertCircle size={17} className="mr-2 shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="mb-[7px] block text-[13px] text-text-muted">
                Work email
              </label>
              <div className="flex h-[44px] items-center gap-[9px] rounded-[11px] bg-surface px-[13px] text-[14px] shadow-[inset_0_0_0_1px_var(--border-color)]">
                <Mail size={19} className="shrink-0 text-text-faint" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@checkout.dev"
                  className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-text-main outline-none placeholder:text-text-muted"
                />
              </div>
            </div>

            <div>
              <div className="mb-[7px] flex items-center justify-between">
                <label className="text-[13px] text-text-muted">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-semibold text-primary hover:text-primary-hover"
                >
                  Forgot?
                </Link>
              </div>
              <div className="flex h-[44px] items-center gap-[9px] rounded-[11px] bg-surface px-[13px] text-[14px] tracking-[2px] text-text-muted shadow-[inset_0_0_0_2px_var(--ring)]">
                <Lock size={19} className="shrink-0 text-text-faint" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="h-full min-w-0 flex-1 bg-transparent text-[14px] tracking-[2px] text-text-muted outline-none placeholder:text-text-muted"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[11px] bg-primary px-4 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
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
                  Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="flex items-center gap-3 text-[12px] text-text-faint">
              <div className="h-px flex-1 bg-border" />
              or
              <div className="h-px flex-1 bg-border" />
            </div>
            <button
              type="button"
              onClick={() => {
                if (msEnabled) signIn("azure-ad", { callbackUrl: "/" });
              }}
              aria-disabled={!msEnabled}
              className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[11px] border border-border bg-surface px-4 text-[15px] font-semibold text-text-main transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <KeyRound size={18} />
              Continue with SSO
            </button>

            <p className="text-center text-[13px] text-text-muted">
              No account?{" "}
              <a
                href="mailto:support@qmaster.app?subject=Workspace%20access%20request"
                className="font-semibold text-primary hover:text-primary-hover"
              >
                Request access
              </a>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-text-muted">
          Loading workspace…
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

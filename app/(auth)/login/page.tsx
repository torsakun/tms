"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { Inter } from "next/font/google";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Mail, Lock, KeyRound, ArrowRight } from "lucide-react";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  AuthPrimaryButton,
  AuthOutlineButton,
  AuthBanner,
} from "@/components/auth/AuthShell";

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

  const statRow = (
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
  );

  return (
    <div className={inter.className}>
      <AuthShell
        headline="Every test cycle, read at a glance."
        subtext="Plan, execute and triage with a precision instrument built for QA teams under pressure."
        brandBottom={statRow}
      >
        <AuthHeading
          title="Welcome back"
          subtitle="Sign in to your workspace."
        />

        <form className="flex flex-col gap-[18px]" onSubmit={handleSubmit}>
          {inviteAccepted && (
            <AuthBanner variant="success" icon={CheckCircle2}>
              Invitation accepted! You can now sign in.
            </AuthBanner>
          )}

          {error && (
            <AuthBanner variant="danger" icon={AlertCircle}>
              {error}
            </AuthBanner>
          )}

          <AuthField
            label="Work email"
            icon={Mail}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jordan@checkout.dev"
          />

          <AuthField
            label="Password"
            icon={Lock}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            className="tracking-[2px]"
            labelRight={
              <Link
                href="/forgot-password"
                className="text-[12px] font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                Forgot?
              </Link>
            }
          />

          <AuthPrimaryButton loading={loading} loadingText="Signing in" trailingIcon={ArrowRight}>
            Sign in
          </AuthPrimaryButton>

          <div className="flex items-center gap-3 text-[12px] text-text-faint">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <AuthOutlineButton
            type="button"
            onClick={() => {
              if (msEnabled) signIn("azure-ad", { callbackUrl: "/" });
            }}
            disabled={!msEnabled}
            leadingIcon={KeyRound}
          >
            Continue with SSO
          </AuthOutlineButton>

          <p className="text-center text-[13px] text-text-muted mt-[-2px]">
            No account?{" "}
            <a
              href="mailto:support@qmaster.app?subject=Workspace%20access%20request"
              className="font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              Request access
            </a>
          </p>
        </form>
      </AuthShell>
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

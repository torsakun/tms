"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  AuthPrimaryButton,
  AuthOutlineButton,
  AuthBanner,
  AuthEyebrow,
} from "@/components/auth/AuthShell";

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

  const wrapper = (children: React.ReactNode) => (
    <AuthShell
      headline="Choose a new password"
      subtext="Use at least 12 characters with a number and a symbol."
    >
      <div className="flex flex-col gap-[18px]">
        {children}
      </div>
    </AuthShell>
  );

  if (status === "checking") {
    return wrapper(
      <div className="py-12 flex flex-col items-center gap-3 text-text-muted">
        <Loader2 className="animate-spin" size={26} />
        <span className="text-sm">Validating link…</span>
      </div>,
    );
  }

  if (status === "invalid") {
    return wrapper(
      <>
        <div className="flex flex-col items-center text-center gap-2 mt-4">
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[11px] bg-danger-soft text-danger">
            <AlertCircle size={22} />
          </div>
          <AuthHeading
            title="Link not valid"
            subtitle={invalidMsg}
          />
        </div>
        <Link href="/forgot-password" className="w-full mt-4">
          <AuthPrimaryButton type="button" trailingIcon={ArrowRight}>
            Request a new link
          </AuthPrimaryButton>
        </Link>
      </>
    );
  }

  if (done) {
    return wrapper(
      <div className="flex flex-col items-center text-center gap-4 mt-4">
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[11px] bg-success-soft text-success">
          <CheckCircle2 size={22} />
        </div>
        <AuthHeading
          title="Password updated"
          subtitle="Redirecting you to sign in…"
        />
        <Loader2 className="animate-spin text-primary mt-2" size={20} />
      </div>
    );
  }

  return wrapper(
    <>
      <div>
        <AuthEyebrow>Reset password</AuthEyebrow>
        <div className="mt-2">
          <AuthHeading title="New password" />
        </div>
      </div>

      <form className="flex flex-col gap-[18px]" onSubmit={handleSubmit}>
        {error && (
          <AuthBanner variant="danger" icon={AlertCircle}>
            {error}
          </AuthBanner>
        )}

        <AuthField
          label="New password"
          icon={Lock}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••••"
          className="tracking-[2px]"
        />

        <AuthField
          label="Confirm password"
          icon={Lock}
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••••••"
          className="tracking-[2px]"
          rightSlot={password === confirm && password.length >= 6 ? <CheckCircle2 size={19} className="shrink-0 text-success" /> : undefined}
        />

        <AuthPrimaryButton loading={loading} loadingText="Updating..." trailingIcon={CheckCircle2}>
          Set new password
        </AuthPrimaryButton>
      </form>
    </>
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

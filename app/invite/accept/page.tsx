"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import {
  AuthShell,
  AuthEyebrow,
  AuthHeading,
  AuthField,
  AuthPrimaryButton,
  AuthOutlineButton,
  AuthBanner,
} from "@/components/auth/AuthShell";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setError("Invalid or missing invitation token.");
        setIsValidating(false);
        return;
      }
      try {
        const res = await fetch(`/api/auth/invite-status?token=${token}`);
        if (res.ok) {
          setIsValidToken(true);
        } else {
          const data = await res.json();
          setError(data.error || "Invalid invitation token.");
        }
      } catch (err) {
        setError("Failed to verify invitation status.");
      } finally {
        setIsValidating(false);
      }
    }
    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        router.push("/login?invite_accepted=true");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to accept invitation");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <AuthShell
        headline="Verifying your invitation…"
        subtext="One moment while we check your invite link."
      >
        <div className="flex items-center justify-center py-10 text-text-muted">
          <Loader2 className="mr-2 animate-spin text-primary" size={22} /> Validating link…
        </div>
      </AuthShell>
    );
  }

  if (!isValidToken) {
    return (
      <AuthShell
        headline="Invitation unavailable"
        subtext="This invite link is invalid, expired, or already used. Ask an admin to send a new one."
      >
        <AuthEyebrow>Accept invite</AuthEyebrow>
        <AuthBanner variant="danger" icon={AlertCircle}>
          {error || "No invitation token was provided."}
        </AuthBanner>
        <AuthOutlineButton
          type="button"
          leadingIcon={ArrowLeft}
          onClick={() => router.push("/login")}
        >
          Go to sign in
        </AuthOutlineButton>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      headline="Join the workspace."
      subtext="QMaster is invite-only. Set a password to finish creating your account."
    >
      <AuthEyebrow>Accept invite</AuthEyebrow>
      <AuthHeading
        title="Set your password"
        subtitle="Choose a password to join the workspace."
      />

      <form className="flex flex-col gap-[15px]" onSubmit={handleSubmit}>
        {error && <AuthBanner variant="danger">{error}</AuthBanner>}

        <AuthField
          label="Password"
          icon={Lock}
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
        />
        <AuthField
          label="Confirm password"
          icon={Lock}
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••••"
        />
        <AuthPrimaryButton
          type="submit"
          loading={isSubmitting}
          loadingText="Processing…"
        >
          Create account
        </AuthPrimaryButton>
      </form>
    </AuthShell>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}

"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, User, Lock, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
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
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [projectCode, setProjectCode] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/accept-project-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: formData.name,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      setSuccess(true);
      setProjectCode(data.projectCode);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell
        headline="Invitation link invalid"
        subtext="This link is missing its invitation token. Ask the person who invited you for a fresh link."
      >
        <AuthEyebrow>Accept invite</AuthEyebrow>
        <AuthBanner variant="danger">
          No invitation token was provided in the URL.
        </AuthBanner>
        <AuthOutlineButton
          type="button"
          leadingIcon={ArrowLeft}
          onClick={() => router.push("/login")}
        >
          Back to sign in
        </AuthOutlineButton>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell
        headline="You're in."
        subtext="Your account is ready. Sign in to start working on the project."
      >
        <AuthEyebrow>Accept invite</AuthEyebrow>
        <AuthBanner variant="success" icon={ShieldCheck}>
          <div className="text-text-main">Invitation accepted</div>
          <div className="mt-0.5 font-medium text-text-muted">
            You&apos;ve successfully joined the project.
          </div>
        </AuthBanner>
        <AuthPrimaryButton
          type="button"
          onClick={() =>
            router.push(`/login?redirect=/projects/${projectCode}/repository`)
          }
        >
          Sign in to continue
        </AuthPrimaryButton>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      headline="You've been invited to a project."
      subtext="QMaster is invite-only. Set your name and a password to join the team."
    >
      <AuthEyebrow>Accept invite</AuthEyebrow>
      <AuthHeading
        title="Join the project"
        subtitle="Complete your profile to join the project team."
      />

      <form className="flex flex-col gap-[15px]" onSubmit={handleSubmit}>
        {error && <AuthBanner variant="danger">{error}</AuthBanner>}

        <AuthField
          label="Full name"
          icon={User}
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Priya Sharma"
        />
        <AuthField
          label="Password"
          icon={Lock}
          type="password"
          required
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          placeholder="••••••••••"
        />
        <AuthField
          label="Confirm password"
          icon={Lock}
          type="password"
          required
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          placeholder="••••••••••"
        />
        <p className="-mt-1 text-[12px] leading-relaxed text-text-faint">
          If you already have an account with this email, your password
          won&apos;t be changed.
        </p>
        <AuthPrimaryButton
          type="submit"
          loading={isLoading}
          loadingText="Joining…"
        >
          Join workspace
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck, Mail, ArrowRight } from "lucide-react";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  AuthPrimaryButton,
  AuthOutlineButton,
  AuthEyebrow,
} from "@/components/auth/AuthShell";

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
    <AuthShell
      headline="Reset your password"
      subtext="We'll email you a secure link to choose a new one."
    >
      <div className="flex flex-col gap-[18px]">
        {sent ? (
          <>
            <div>
              <AuthEyebrow>Forgot password</AuthEyebrow>
              {/* success banner state */}
              <div className="mt-2 flex gap-[11px] rounded-[12px] border border-success/25 bg-success-soft p-[14px]">
                <MailCheck size={20} className="mt-0.5 shrink-0 text-success-foreground" />
                <div>
                  <div className="text-[13px] font-semibold text-text-main">
                    Check your inbox
                  </div>
                  <div className="mt-[2px] text-[12px] leading-[1.5] text-text-muted">
                    We sent a reset link to{" "}
                    <span className="font-semibold text-text-main">{email}</span>. It
                    expires in 30 minutes.
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[12.5px] leading-[1.5] text-text-faint">
              Didn't get it? Check spam, or{" "}
              <button
                type="button"
                onClick={handleSubmit}
                className="font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                resend the link
              </button>
              .
            </div>

            <Link href="/login" className="mt-2 w-full">
              <AuthOutlineButton type="button" leadingIcon={ArrowLeft}>
                Back to sign in
              </AuthOutlineButton>
            </Link>
          </>
        ) : (
          <>
            <div>
              <AuthEyebrow>Forgot password</AuthEyebrow>
              <div className="mt-2">
                <AuthHeading
                  title="Reset your password"
                  subtitle="Enter your email and we'll send you a reset link."
                />
              </div>
            </div>

            <form className="flex flex-col gap-[18px]" onSubmit={handleSubmit}>
              <AuthField
                label="Work email"
                icon={Mail}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />

              <AuthPrimaryButton loading={loading} loadingText="Sending..." trailingIcon={ArrowRight}>
                Send reset link
              </AuthPrimaryButton>

              <Link href="/login" className="w-full">
                <AuthOutlineButton type="button" leadingIcon={ArrowLeft}>
                  Back to sign in
                </AuthOutlineButton>
              </Link>
            </form>
          </>
        )}
      </div>
    </AuthShell>
  );
}

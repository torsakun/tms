"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
} from "lucide-react";
import {
  AuthShell,
  AuthHeading,
  AuthField,
  AuthPrimaryButton,
  AuthBanner,
  AuthEyebrow,
} from "@/components/auth/AuthShell";

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

  const headline = open === true ? "Create your account" : "Join Checkout Inc.";
  const subtext = open === true ? "Set up the workspace administrator account to get started." : "QMaster is invite-only. You must be invited by an administrator.";

  return (
    <AuthShell
      headline={headline}
      subtext={subtext}
    >
      {open === null ? (
        <div className="py-12 flex flex-col items-center gap-3 text-text-muted">
          <Loader2 className="animate-spin" size={26} />
          <span className="text-sm">Checking…</span>
        </div>
      ) : open === false ? (
        <div className="flex flex-col gap-[18px]">
          <div className="flex items-center gap-[10px]">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[11px] bg-primary-light text-primary">
              <Lock size={22} />
            </div>
          </div>
          <AuthHeading
            title="Invite-only workspace"
            subtitle="New accounts are created by invitation only. Please ask a workspace administrator to send you an invite — you'll receive a link to set up your account."
          />
          <Link href="/login" className="w-full mt-2">
            <AuthPrimaryButton type="button" trailingIcon={ArrowRight}>
              Back to sign in
            </AuthPrimaryButton>
          </Link>
        </div>
      ) : (
        <>
          <div>
            <AuthEyebrow>First-time setup</AuthEyebrow>
            <div className="mt-2">
              <AuthHeading
                title="Create admin account"
                subtitle="This first account becomes the workspace administrator."
              />
            </div>
          </div>

          <form className="flex flex-col gap-[18px]" onSubmit={handleSubmit}>
            {error && (
              <AuthBanner variant="danger" icon={AlertCircle}>
                {error}
              </AuthBanner>
            )}

            <AuthField
              label="Full name"
              icon={User}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Priya Sharma"
            />

            <AuthField
              label="Work email"
              icon={Mail}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@checkout.dev"
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
            />

            <AuthPrimaryButton loading={loading} loadingText="Creating..." trailingIcon={ArrowRight}>
              Create account
            </AuthPrimaryButton>

            <div className="text-center text-[13px] text-text-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                Sign in
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}

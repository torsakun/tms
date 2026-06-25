"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";

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
      <div className="min-h-screen bg-surface-hover flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-surface py-8 px-4 shadow-premium sm:rounded-3xl border border-border/80 sm:px-10 text-center animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-text-main mb-2">
              Invalid Invitation
            </h2>
            <p className="text-text-muted mb-6">
              No invitation token was provided in the URL.
            </p>
            <Link
              href="/"
              className="text-primary hover:text-primary font-medium"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface-hover flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-surface py-8 px-4 shadow-premium sm:rounded-3xl border border-border/80 sm:px-10 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-xl font-bold text-text-main mb-2">
              Invitation Accepted!
            </h2>
            <p className="text-text-muted mb-6">
              You have successfully joined the project.
            </p>
            <Link
              href={`/login?redirect=/projects/${projectCode}/repository`}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-primary-foreground bg-primary hover:bg-primary-hover transition-colors"
            >
              Sign In to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-hover flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text-main">
          Accept Project Invitation
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          Complete your profile to join the project team.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow-premium sm:rounded-3xl border border-border/80 sm:px-10 animate-in zoom-in-95 duration-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 rounded-xl bg-danger-soft text-danger-foreground text-[13px] font-bold shadow-inner border border-danger/25">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-main">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-[13px] font-semibold bg-surface-hover/50 border border-border/80 rounded-xl shadow-inner placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40 text-text-main"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-[13px] font-semibold bg-surface-hover/50 border border-border/80 rounded-xl shadow-inner placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40 text-text-main"
                />
              </div>
              <p className="mt-1 text-xs text-text-muted">
                (If you already have an account with this email, your password
                will not be changed)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 text-[13px] font-semibold bg-surface-hover/50 border border-border/80 rounded-xl shadow-inner placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40 text-text-main"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-premium text-sm font-bold text-primary-foreground bg-primary hover:bg-primary-hover hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Accept Invitation"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-hover flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}

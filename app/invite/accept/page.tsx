"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";

import { Suspense } from "react";

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
        body: JSON.stringify({
          token,
          password,
        }),
      });

      if (res.ok) {
        // Redirect to login page with a success message
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

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-hover px-4">
        <div className="max-w-md w-full bg-surface py-8 px-4 shadow-premium sm:rounded-3xl border border-border/80 sm:px-10 text-center animate-in zoom-in-95 duration-200">
          <h2 className="text-xl font-bold text-text-main mb-2">
            Invalid Link
          </h2>
          <p className="text-text-muted mb-6">
            {error || "No invitation token was provided."}
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-premium text-[13px] font-bold text-primary-foreground bg-primary hover:bg-primary-hover hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-hover px-4">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-hover px-4">
        <div className="max-w-md w-full bg-surface py-8 px-4 shadow-premium sm:rounded-3xl border border-border/80 sm:px-10 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-danger-soft text-danger-foreground rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2">
            Invitation Unavailable
          </h2>
          <p className="text-text-muted mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-premium text-[13px] font-bold text-primary-foreground bg-primary hover:bg-primary-hover hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-hover px-4">
      <div className="max-w-md w-full bg-surface py-8 px-4 shadow-premium sm:rounded-3xl border border-border/80 sm:px-10 animate-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-6">
          <div className="w-10 h-10 bg-sidebar-bg rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">Q</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-text-main mb-2 text-center">
          Accept Invitation
        </h2>
        <p className="text-text-muted text-center text-sm mb-8">
          Please provide your details and set a password to join the workspace.
        </p>

        {/* Removed inline error block since errors block the whole page now */}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-[13px] font-semibold bg-surface-hover/50 border border-border/80 rounded-xl shadow-inner placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40 text-text-main"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-[13px] font-semibold bg-surface-hover/50 border border-border/80 rounded-xl shadow-inner placeholder-text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40 text-text-main"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 flex justify-center py-2.5 px-4 rounded-xl shadow-premium text-[13px] font-bold text-primary-foreground bg-primary hover:bg-primary-hover hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : null}
            {isSubmitting ? "Processing..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}

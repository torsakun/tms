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
          password
        })
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Invalid Link</h2>
          <p className="text-slate-600 mb-6">{error || "No invitation token was provided."}</p>
          <button onClick={() => router.push("/login")} className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Invitation Unavailable</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button onClick={() => router.push("/login")} className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        
        <div className="flex justify-center mb-6">
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
             <span className="text-white font-bold text-xl">Q</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Accept Invitation</h2>
        <p className="text-slate-500 text-center text-sm mb-8">
          Please provide your details and set a password to join the workspace.
        </p>

        {/* Removed inline error block since errors block the whole page now */}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 bg-[#2563eb] hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-md transition-colors flex items-center justify-center"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
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

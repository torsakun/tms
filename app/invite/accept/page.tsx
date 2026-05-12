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

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing invitation token.");
    }
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

        {error && (
          <div className="p-3 mb-6 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
            {error}
          </div>
        )}

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

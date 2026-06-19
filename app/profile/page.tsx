"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Profile updated successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Tell next-auth to refresh the session so the new name shows in the top nav
        await update({ name });
        
        // Redirect back after a short delay
        setTimeout(() => {
          router.back();
        }, 1000);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to update profile.",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1000px] mx-auto px-6 py-12 md:px-10">
      {/* ── Impeccable Hero Header ── */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br from-indigo-500 to-purple-600 shadow-premium shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div>
          <h1 className="text-[32px] md:text-[40px] font-black tracking-tight bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 dark:from-indigo-400 dark:via-violet-400 dark:to-purple-400 bg-clip-text text-transparent leading-none">
            Profile Settings
          </h1>
          <p className="text-[14px] font-medium text-text-muted mt-2">
            Manage your personal identity and security preferences.
          </p>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 mb-8 rounded-2xl flex items-start gap-3 text-[14px] font-bold border shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            message.type === "error"
              ? "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
              : "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
          }`}
        >
          {message.type === "error" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          )}
          <div className="leading-tight mt-[1px]">{message.text}</div>
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="space-y-8">
        {/* ── Section: Personal Information ── */}
        <section className="bg-surface border border-border/80 rounded-3xl p-8 shadow-premium transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8 border-b border-border/50 pb-5">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-text-main tracking-tight">
                Personal Information
              </h2>
              <p className="text-sm font-medium text-text-muted mt-0.5">
                Update your identity details and how others see you.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-text-main uppercase tracking-wider opacity-80">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-60">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <input
                  type="email"
                  value={session.user?.email || ""}
                  disabled
                  className="w-full pl-11 pr-4 py-3.5 border border-border/80 rounded-xl bg-surface-hover/50 text-text-muted font-medium cursor-not-allowed shadow-inner transition-colors"
                />
              </div>
              <p className="text-xs font-semibold text-text-muted/70 mt-1.5 ml-1">
                Your email is used for login and cannot be changed here.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-text-main uppercase tracking-wider opacity-80">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3.5 border border-border/80 rounded-xl bg-surface text-text-main font-semibold shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40"
              />
            </div>
          </div>
        </section>

        {/* ── Section: Security ── */}
        <section className="bg-surface border border-border/80 rounded-3xl p-8 shadow-premium transition-shadow duration-300">
          <div className="flex items-center gap-4 mb-8 border-b border-border/50 pb-5">
            <div className="p-3 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-text-main tracking-tight">
                Security & Password
              </h2>
              <p className="text-sm font-medium text-text-muted mt-0.5">
                Keep your account secure. Leave blank if you don't want to change.
              </p>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              <label className="block text-sm font-extrabold text-text-main uppercase tracking-wider opacity-80">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-4 py-3.5 border border-border/80 rounded-xl bg-surface text-text-main font-semibold shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-extrabold text-text-main uppercase tracking-wider opacity-80">
                  New Password
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3.5 border border-border/80 rounded-xl bg-surface text-text-main font-semibold shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-extrabold text-text-main uppercase tracking-wider opacity-80">
                  Confirm Password
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Type new password again"
                  className="w-full px-4 py-3.5 border border-border/80 rounded-xl bg-surface text-text-main font-semibold shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all hover:border-text-muted/40"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Actions ── */}
        <div className="pt-2 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-8 py-4 rounded-xl text-[15px] font-black tracking-wide text-text-main bg-surface border border-border/80 hover:bg-surface-hover hover:border-text-muted/40 transition-all duration-300 disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={loading}
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-[15px] font-black tracking-wide text-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            style={{ background: "linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)" }}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            )}
            SAVE CHANGES
          </button>
        </div>
      </form>
    </div>
  );
}

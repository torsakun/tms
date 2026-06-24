"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string | null; email: string } | null;
}

const AVATAR_COLORS = [
  "#4f46e5",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#e11d48",
];

function initials(name?: string | null, email?: string) {
  const display = name || email?.split("@")[0] || "?";
  const p = display.split(/[\s.]+/).filter(Boolean);
  return p.length >= 2
    ? `${p[0][0]}${p[1][0]}`.toUpperCase()
    : display.slice(0, 2).toUpperCase();
}

function colorFor(key: string) {
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Render @mentions in bold-indigo, leave the rest as plain text.
function renderBody(body: string) {
  return body.split(/(@[A-Za-z0-9._-]+)/g).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-semibold text-indigo-600">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

export function CommentThread({ endpoint }: { endpoint: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(endpoint)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setComments(Array.isArray(d) ? d : []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    const body = draft.trim();
    if (!body) return;
    setSubmitting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const created = await res.json();
      setComments((c) => [...c, created]);
      setDraft("");
    } catch (e: any) {
      toast.error("Failed to post comment: " + (e.message || e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <div className="flex items-center justify-center py-8 text-sm text-text-muted">
          <Loader2 size={16} className="animate-spin mr-2" /> Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare size={26} className="text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-text-muted">No comments yet</p>
          <p className="text-xs text-text-muted mt-1">
            Start the discussion — use @ to mention a teammate.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const key = c.author?.email || c.author?.id || "?";
            return (
              <li key={c.id} className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-black"
                  style={{ background: colorFor(key) }}
                >
                  {initials(c.author?.name, c.author?.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-text-main">
                      {c.author?.name || c.author?.email?.split("@")[0] || "Unknown"}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-text-main whitespace-pre-wrap break-words mt-0.5">
                    {renderBody(c.body)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Composer */}
      <div className="flex items-end gap-2 border-t border-border pt-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
          rows={2}
          placeholder="Write a comment… (@mention, ⌘+Enter to send)"
          className="flex-1 resize-none px-3 py-2 text-[13px] bg-surface-hover border border-border text-text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition-all"
        />
        <button
          onClick={submit}
          disabled={submitting || !draft.trim()}
          className="shrink-0 h-9 px-3 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Send
        </button>
      </div>
    </div>
  );
}

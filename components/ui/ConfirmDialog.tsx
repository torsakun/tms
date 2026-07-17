"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  /** When set, the user must type this exact string before confirm is enabled. */
  confirmationText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  confirmationText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");

  const matched = !confirmationText || typed === confirmationText;

  // Esc to cancel, Enter to confirm (only when the typed text matches).
  // Focus the input when text confirmation is required, else the confirm button.
  useEffect(() => {
    if (confirmationText) inputRef.current?.focus();
    else confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      else if (e.key === "Enter" && matched) onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onConfirm, onCancel, matched, confirmationText]);

  const colors =
    variant === "danger"
      ? {
          bg: "bg-danger-soft",
          icon: "text-danger",
          btn: "bg-danger hover:bg-danger/90",
        }
      : {
          bg: "bg-warning-soft",
          icon: "text-warning",
          btn: "bg-warning hover:bg-warning/90 text-[var(--neutral-950)]",
        };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <div
            className={`w-9 h-9 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}
          >
            <AlertTriangle size={18} className={colors.icon} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-main mb-1">
              {title}
            </h3>
            <p className="text-sm text-text-muted">{message}</p>
          </div>
        </div>
        {confirmationText && (
          <div className="mb-5">
            <p className="text-xs text-text-muted mb-1.5">
              Type <span className="font-semibold text-text-main">{confirmationText}</span> to confirm
            </p>
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="w-full h-[38px] px-3 rounded-lg bg-surface shadow-[inset_0_0_0_1px_var(--border-color)] text-sm text-text-main focus:outline-none focus:shadow-[inset_0_0_0_2px_var(--primary-color)] transition-shadow"
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-text-muted bg-surface-hover hover:bg-skip-soft rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={!matched}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed ${colors.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

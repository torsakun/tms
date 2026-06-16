"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const colors =
    variant === "danger"
      ? { bg: "bg-rose-50", icon: "text-rose-500", btn: "bg-rose-500 hover:bg-rose-600" }
      : { bg: "bg-amber-50", icon: "text-amber-500", btn: "bg-amber-500 hover:bg-amber-600" };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <div className={`w-9 h-9 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
            <AlertTriangle size={18} className={colors.icon} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
            <p className="text-sm text-slate-500">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${colors.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

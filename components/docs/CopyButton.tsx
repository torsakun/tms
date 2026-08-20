"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copy-to-clipboard affordance for a code block — appears on hover. */
export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard can be blocked (insecure origin, denied permission) —
          // silently leave the button alone rather than showing a false success.
        }
      }}
      title={copied ? "Copied" : "Copy"}
      aria-label={copied ? "Copied" : "Copy code"}
      className="absolute right-[9px] top-[9px] rounded-[7px] border border-border bg-surface p-[6px] text-text-faint opacity-0 transition-all hover:text-text-main focus:opacity-100 group-hover:opacity-100"
    >
      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
    </button>
  );
}

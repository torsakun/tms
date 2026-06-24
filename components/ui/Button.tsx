"use client";

import React, { forwardRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Standard action button for QMaster.
 *
 * One consistent vocabulary across every page — same heights, same radius,
 * same state treatment. Use for real actions (toolbar, form submit, modal
 * footers). NOT for dropdown menu rows or sidebar nav, which have their own
 * full-width text-left patterns.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm focus-visible:ring-primary/40",
  secondary:
    "bg-surface border border-border text-text-main hover:bg-surface-hover focus-visible:ring-primary/30",
  ghost:
    "text-text-muted hover:bg-surface-hover hover:text-text-main focus-visible:ring-primary/30",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus-visible:ring-rose-400/40",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm focus-visible:ring-emerald-400/40",
};

// Heights in explicit px (the app's root font-size is 14px, so rem-based
// Tailwind sizes like h-9 render ~12.5% smaller — px keeps these exact).
// sm 32px, md 36px (default), lg 44px (touch target).
const SIZES: Record<ButtonSize, string> = {
  sm: "h-[32px] px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-[36px] px-4 text-[14px] gap-2 rounded-lg",
  lg: "h-[44px] px-5 text-[15px] gap-2 rounded-xl",
};

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: "h-[32px] w-[32px] rounded-lg",
  md: "h-[36px] w-[36px] rounded-lg",
  lg: "h-[44px] w-[44px] rounded-xl",
};

const SPINNER: Record<ButtonSize, number> = { sm: 14, md: 15, lg: 16 };

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconOnly?: boolean;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function base(props: BaseProps) {
  const {
    variant = "primary",
    size = "md",
    iconOnly = false,
    fullWidth = false,
    className,
  } = props;
  return cn(
    "inline-flex items-center justify-center font-semibold whitespace-nowrap select-none transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    iconOnly ? ICON_SIZES[size] : SIZES[size],
    fullWidth && "w-full",
    className,
  );
}

export type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant,
      size = "md",
      loading = false,
      iconOnly,
      fullWidth,
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={base({ variant, size, iconOnly, fullWidth, className })}
        {...rest}
      >
        {loading && <Loader2 size={SPINNER[size]} className="animate-spin" />}
        {children}
      </button>
    );
  },
);

// Link styled exactly like a Button — for navigation actions.
export type ButtonLinkProps = BaseProps &
  Omit<React.ComponentProps<typeof Link>, "className">;

export function ButtonLink({
  variant,
  size = "md",
  iconOnly,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={base({ variant, size, iconOnly, fullWidth, className })}
      {...rest}
    >
      {children}
    </Link>
  );
}

"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-navy text-paper-alt hover:bg-navy-dark border border-navy",
  secondary: "bg-brass-soft text-ink hover:bg-[#e9dbb2] border border-brass/40",
  ghost: "bg-transparent text-ink hover:bg-black/5 border border-transparent",
  outline: "bg-transparent text-navy border border-navy/40 hover:bg-navy-soft/40",
  danger: "bg-clay text-paper-alt hover:bg-[#7c3020] border border-clay",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-2.5 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-base px-5 py-2.5 gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

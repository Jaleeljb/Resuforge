import React from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("bg-paper-alt border border-line rounded-lg", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2 border-b border-line/70">
      <div>
        <h3 className="font-serif text-[15px] leading-tight text-ink">{title}</h3>
        {subtitle ? <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

type BadgeTone = "matched" | "partial" | "missing" | "weak" | "neutral" | "brass";

const toneClasses: Record<BadgeTone, string> = {
  matched: "bg-forest-soft text-forest border-forest/30",
  partial: "bg-brass-soft text-brass border-brass/30",
  weak: "bg-brass-soft text-brass border-brass/30",
  missing: "bg-clay-soft text-clay border-clay/30",
  neutral: "bg-black/5 text-ink-soft border-black/10",
  brass: "bg-brass-soft text-brass border-brass/30",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border", toneClasses[tone], className)}>
      {children}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="text-xs text-ink-soft mt-1 max-w-xs">{description}</p>
    </div>
  );
}

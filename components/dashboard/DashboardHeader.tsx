"use client";

import React from "react";
import Link from "next/link";
import { ATSScoreResult } from "@/types/ats";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { Download } from "lucide-react";

export type DashboardTab = "overview" | "editor" | "compare" | "versions";

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "overview", label: "Job Analysis" },
  { id: "editor", label: "Resume Editor" },
  { id: "compare", label: "Compare" },
  { id: "versions", label: "Versions" },
];

export function DashboardHeader({
  tab,
  onTabChange,
  score,
  onExport,
}: {
  tab: DashboardTab;
  onTabChange: (t: DashboardTab) => void;
  score: ATSScoreResult | null;
  onExport: () => void;
}) {
  return (
    <header className="border-b border-line bg-paper-alt sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-serif text-base shrink-0">
            ResumeForge AI
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-md transition-colors",
                  tab === t.id ? "bg-navy text-paper-alt" : "text-ink-soft hover:bg-black/5"
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {score && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  score.band === "very-strong" && "bg-forest",
                  score.band === "strong" && "bg-forest",
                  score.band === "moderate" && "bg-brass",
                  score.band === "needs-optimization" && "bg-clay"
                )}
              />
              {score.overall}/100
            </span>
          )}
          <Button size="sm" onClick={onExport}>
            <Download size={13} /> Export
          </Button>
        </div>
      </div>
      <nav className="md:hidden flex overflow-x-auto border-t border-line/70">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={cn(
              "text-xs px-3 py-2 whitespace-nowrap border-b-2",
              tab === t.id ? "border-navy text-navy font-medium" : "border-transparent text-ink-soft"
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

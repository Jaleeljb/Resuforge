"use client";

import React, { useState } from "react";
import { ATSScoreResult } from "@/types/ats";
import { Card, CardHeader, EmptyState } from "@/components/ui/Primitives";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { ArrowRight, CheckCircle2, XCircle, Lightbulb, Info, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const EXPLANATION_PREVIEW_COUNT = 3;

export function ScorePanel({ score, delta }: { score: ATSScoreResult | null; delta: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  if (!score) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader title="ATS Alignment" />
        <EmptyState
          title="Analyze a job description to calculate your alignment."
          description="Once you've loaded a resume and analyzed a job description, your score appears here and updates live as you edit."
        />
      </Card>
    );
  }

  const visibleExplanation = expanded ? score.explanation : score.explanation.slice(0, EXPLANATION_PREVIEW_COUNT);
  const hiddenCount = score.explanation.length - visibleExplanation.length;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader title="ATS Alignment" subtitle={score.bandLabel} />
      <div className="p-4 flex flex-col flex-1 min-h-0">
        {/* Gauge + score components: a compact two-column, horizontally
            arranged layout instead of one long vertical list. */}
        <div className="flex items-center gap-4">
          <ScoreGauge score={score.overall} band={score.band} size={92} />
          <div className="flex-1 min-w-0">
            {delta && (
              <p className="text-[11px] text-navy bg-navy-soft/40 border border-navy/10 rounded px-2 py-1 mb-2 inline-flex items-center gap-1">
                Score updated <ArrowRight size={10} /> {delta}
              </p>
            )}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {score.components.map((c) => (
                <div key={c.key} className="flex items-center gap-1.5 min-w-0" title={`${c.label}: ${c.rawPercent}%`}>
                  <span className="text-[10px] w-[70px] shrink-0 text-ink-soft truncate">{c.label}</span>
                  <div className="flex-1 h-1.5 bg-line/70 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-navy/80" style={{ width: `${c.rawPercent}%` }} />
                  </div>
                  <span className="text-[10px] w-7 shrink-0 text-right text-ink-soft">{c.rawPercent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Explanation: capped height with an internal scroll + "show more"
            toggle, so a long explanation never stretches the card. */}
        <div className="mt-3 pt-3 border-t border-line">
          <div className={cn("space-y-1.5 overflow-y-auto pr-1", expanded ? "max-h-[260px]" : "max-h-[104px]")}>
            {visibleExplanation.map((line, i) => (
              <p key={i} className="text-[12.5px] flex items-start gap-1.5 leading-snug">
                {line.type === "positive" && <CheckCircle2 size={13} className="text-forest mt-0.5 shrink-0" />}
                {line.type === "negative" && <XCircle size={13} className="text-clay mt-0.5 shrink-0" />}
                {line.type === "suggestion" && <Lightbulb size={13} className="text-brass mt-0.5 shrink-0" />}
                <span className="text-ink">{line.text}</span>
              </p>
            ))}
          </div>
          {hiddenCount > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-[11px] text-navy underline underline-offset-2 mt-1.5 inline-flex items-center gap-0.5"
            >
              Show {hiddenCount} more <ChevronDown size={11} />
            </button>
          )}
          {expanded && score.explanation.length > EXPLANATION_PREVIEW_COUNT && (
            <button
              onClick={() => setExpanded(false)}
              className="text-[11px] text-ink-soft underline underline-offset-2 mt-1.5 inline-flex items-center gap-0.5"
            >
              Show less <ChevronUp size={11} />
            </button>
          )}
        </div>

        {/* Disclaimer: collapsed by default to a single line, expandable. */}
        <div className="mt-auto pt-3 border-t border-line">
          <button
            onClick={() => setShowDisclaimer((s) => !s)}
            className="text-[11px] text-ink-soft inline-flex items-center gap-1 hover:text-ink"
          >
            <Info size={11} /> Scores are estimates, not guarantees
            {showDisclaimer ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {showDisclaimer && (
            <p className="text-[11px] text-ink-soft mt-1.5 leading-relaxed">
              Different applicant tracking systems use different parsing and ranking methods. This
              score measures alignment against the supplied job description and resume content; it
              does not guarantee an interview or application outcome.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

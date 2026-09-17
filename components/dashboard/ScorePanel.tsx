import React from "react";
import { ATSScoreResult } from "@/types/ats";
import { Card, CardHeader, EmptyState } from "@/components/ui/Primitives";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { ArrowRight, CheckCircle2, XCircle, Lightbulb } from "lucide-react";

export function ScorePanel({ score, delta }: { score: ATSScoreResult | null; delta: string | null }) {
  if (!score) {
    return (
      <Card>
        <CardHeader title="ATS Alignment" />
        <EmptyState title="Analyze a job description to calculate your alignment." description="Once you've loaded a resume and analyzed a job description, your score appears here and updates live as you edit." />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="ATS Alignment" subtitle={score.bandLabel} />
      <div className="p-4">
        <div className="flex items-center gap-4">
          <ScoreGauge score={score.overall} band={score.band} />
          <div className="flex-1">
            {delta && (
              <p className="text-xs text-navy bg-navy-soft/40 border border-navy/10 rounded px-2 py-1 mb-2 inline-flex items-center gap-1">
                Score updated <ArrowRight size={11} /> {delta}
              </p>
            )}
            <div className="space-y-1.5">
              {score.components.map((c) => (
                <div key={c.key} className="flex items-center gap-2">
                  <span className="text-[11px] w-32 text-ink-soft truncate">{c.label}</span>
                  <div className="flex-1 h-1.5 bg-line/70 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-navy/80"
                      style={{ width: `${c.rawPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] w-8 text-right text-ink-soft">{c.rawPercent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-line space-y-1.5">
          {score.explanation.map((line, i) => (
            <p key={i} className="text-[13px] flex items-start gap-1.5">
              {line.type === "positive" && <CheckCircle2 size={14} className="text-forest mt-0.5 shrink-0" />}
              {line.type === "negative" && <XCircle size={14} className="text-clay mt-0.5 shrink-0" />}
              {line.type === "suggestion" && <Lightbulb size={14} className="text-brass mt-0.5 shrink-0" />}
              <span className="text-ink">{line.text}</span>
            </p>
          ))}
        </div>

        <p className="text-[11px] text-ink-soft mt-4 pt-3 border-t border-line leading-relaxed">
          ATS scores are estimates. Different applicant tracking systems use different parsing and
          ranking methods. This score measures alignment against the supplied job description and
          resume content; it does not guarantee an interview or application outcome.
        </p>
      </div>
    </Card>
  );
}

"use client";

import React, { useState } from "react";
import { EducationRequirementMatch, KeywordMatch } from "@/types/ats";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, HelpCircle } from "lucide-react";

const STATUS_LABEL: Record<KeywordMatch["status"], string> = {
  matched: "Matched",
  partial: "Partial",
  "weak-evidence": "Weak Evidence",
  missing: "Missing",
  unsupported: "Unsupported",
};

const STATUS_TONE: Record<KeywordMatch["status"], "matched" | "partial" | "missing" | "weak" | "neutral"> = {
  matched: "matched",
  partial: "partial",
  "weak-evidence": "weak",
  missing: "missing",
  unsupported: "missing",
};

export function KeywordPanel({
  matches,
  educationMatches = [],
  dismissed,
  onConfirmSkill,
  onDismiss,
}: {
  matches: KeywordMatch[];
  educationMatches?: EducationRequirementMatch[];
  dismissed: Set<string>;
  onConfirmSkill: (term: string, evidence: string, mode: "have-it" | "related") => void;
  onDismiss: (term: string) => void;
}) {
  if (matches.length === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader title="Keyword Matching" />
        <EmptyState title="Your matched and missing keywords will appear here." description="Analyze a job description against your resume to see keyword-by-keyword evidence." />
      </Card>
    );
  }

  const visible = matches.filter((m) => !dismissed.has(m.keyword) || m.status !== "missing");
  const counts = {
    matched: matches.filter((m) => m.status === "matched").length,
    partial: matches.filter((m) => m.status === "partial" || m.status === "weak-evidence").length,
    missing: matches.filter((m) => m.status === "missing").length,
  };

  return (
    <Card className="flex flex-col">
      <CardHeader title="Keyword Matching" subtitle="Required and preferred terms with resume evidence." />

      {/* At-a-glance stat chips, so the summary is visible before scanning
          the detailed table below. */}
      <div className="px-4 pt-3 flex items-center gap-1.5 flex-wrap">
        <Badge tone="matched">{counts.matched} matched</Badge>
        <Badge tone="partial">{counts.partial} partial</Badge>
        <Badge tone="missing">{counts.missing} missing</Badge>
      </div>

      {/* Full-width table: every column, including Evidence, stays visible
          and unabridged now that the card spans the whole row. Only very
          long keyword lists scroll, and only after a generous height. */}
      <div className="p-4 pt-2 max-h-[520px] overflow-y-auto">
        <table className="w-full text-[12.5px] border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-ink-soft text-[11px]">
              <th className="sticky top-0 bg-paper-alt pb-1.5 pr-3 pt-1 font-medium border-b border-line">Keyword</th>
              <th className="sticky top-0 bg-paper-alt pb-1.5 pr-3 pt-1 font-medium border-b border-line">Req.</th>
              <th className="sticky top-0 bg-paper-alt pb-1.5 pr-3 pt-1 font-medium border-b border-line">Evidence</th>
              <th className="sticky top-0 bg-paper-alt pb-1.5 pr-3 pt-1 font-medium border-b border-line">Status</th>
              <th className="sticky top-0 bg-paper-alt pb-1.5 pt-1 font-medium border-b border-line"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => (
              <KeywordRow key={m.keyword} match={m} onConfirmSkill={onConfirmSkill} onDismiss={onDismiss} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Education requirements are collected from the JD but were
          previously never checked against anything — closing that gap
          without ever inventing a degree the person doesn't have: this is
          purely informational, so review it yourself and, if it genuinely
          applies, fix the wording in your own Education entry. */}
      {educationMatches.length > 0 && (
        <div className="px-4 pb-4 pt-1 border-t border-line mt-1">
          <p className="text-xs font-medium text-ink-soft mb-2 mt-3">Education requirements from the job description</p>
          <ul className="space-y-1.5">
            {educationMatches.map((e, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12.5px]">
                {e.met ? (
                  <CheckCircle2 size={14} className="text-forest mt-0.5 shrink-0" />
                ) : (
                  <HelpCircle size={14} className="text-brass mt-0.5 shrink-0" />
                )}
                <span>
                  <span className="text-ink">{e.requirement}</span>{" "}
                  <span className="text-ink-soft">
                    {e.met ? "— evidenced in your Education section." : "— not clearly stated in your resume; review if this applies to you."}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function KeywordRow({
  match,
  onConfirmSkill,
  onDismiss,
}: {
  match: KeywordMatch;
  onConfirmSkill: (term: string, evidence: string, mode: "have-it" | "related") => void;
  onDismiss: (term: string) => void;
}) {
  const [prompting, setPrompting] = useState<"have-it" | "related" | null>(null);
  const [evidence, setEvidence] = useState("");

  return (
    <>
      <tr className="border-b border-line/60 align-top">
        <td className="py-1.5 pr-3 font-medium">{match.keyword}</td>
        <td className="py-1.5 pr-3 capitalize text-ink-soft whitespace-nowrap">{match.requirementLevel.replace("-", " ")}</td>
        <td className="py-1.5 pr-3 text-ink-soft">
          <span className="block max-w-[420px]">{match.evidence || "—"}</span>
        </td>
        <td className="py-1.5 pr-3">
          <Badge tone={STATUS_TONE[match.status]}>{STATUS_LABEL[match.status]}</Badge>
        </td>
        <td className="py-1.5">
          {match.status === "missing" && !prompting && (
            <div className="flex gap-1 whitespace-nowrap">
              <button className="text-[11px] underline text-navy" onClick={() => setPrompting("have-it")}>
                Yes
              </button>
              <span className="text-line">·</span>
              <button className="text-[11px] underline text-ink-soft" onClick={() => onDismiss(match.keyword)}>
                No
              </button>
              <span className="text-line">·</span>
              <button className="text-[11px] underline text-brass" onClick={() => setPrompting("related")}>
                Related
              </button>
            </div>
          )}
        </td>
      </tr>
      {prompting && (
        <tr className="bg-brass-soft/30">
          <td colSpan={5} className="p-3">
            <p className="text-xs text-ink mb-2">
              {prompting === "have-it"
                ? `Job requires "${match.keyword}" but it isn't in your resume. Describe your real experience with it in your own words:`
                : `Describe the related experience you have, in your own words:`}
            </p>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full text-sm border border-line rounded-md p-2 bg-white outline-none focus:border-navy resize-none"
              rows={2}
              placeholder="e.g. Used it briefly during a class project to..."
            />
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                disabled={evidence.trim().length < 5}
                onClick={() => {
                  onConfirmSkill(match.keyword, evidence.trim(), prompting);
                  setPrompting(null);
                  setEvidence("");
                }}
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPrompting(null)}>
                Cancel
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

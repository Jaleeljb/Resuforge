"use client";

import React, { useState } from "react";
import { KeywordMatch } from "@/types/ats";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";

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
  dismissed,
  onConfirmSkill,
  onDismiss,
}: {
  matches: KeywordMatch[];
  dismissed: Set<string>;
  onConfirmSkill: (term: string, evidence: string, mode: "have-it" | "related") => void;
  onDismiss: (term: string) => void;
}) {
  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader title="Keyword Matching" />
        <EmptyState title="Your matched and missing keywords will appear here." description="Analyze a job description against your resume to see keyword-by-keyword evidence." />
      </Card>
    );
  }

  const visible = matches.filter((m) => !dismissed.has(m.keyword) || m.status !== "missing");

  return (
    <Card>
      <CardHeader title="Keyword Matching" subtitle="Required and preferred terms with resume evidence." />
      <div className="p-4 overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-ink-soft text-[11px] border-b border-line">
              <th className="pb-2 pr-3 font-medium">Keyword</th>
              <th className="pb-2 pr-3 font-medium">Requirement</th>
              <th className="pb-2 pr-3 font-medium">Evidence</th>
              <th className="pb-2 pr-3 font-medium">Status</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m) => (
              <KeywordRow key={m.keyword} match={m} onConfirmSkill={onConfirmSkill} onDismiss={onDismiss} />
            ))}
          </tbody>
        </table>
      </div>
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
        <td className="py-2 pr-3 font-medium">{match.keyword}</td>
        <td className="py-2 pr-3 capitalize text-ink-soft">{match.requirementLevel.replace("-", " ")}</td>
        <td className="py-2 pr-3 text-ink-soft">{match.evidence || "—"}</td>
        <td className="py-2 pr-3">
          <Badge tone={STATUS_TONE[match.status]}>{STATUS_LABEL[match.status]}</Badge>
        </td>
        <td className="py-2">
          {match.status === "missing" && !prompting && (
            <div className="flex gap-1">
              <button className="text-[11px] underline text-navy" onClick={() => setPrompting("have-it")}>
                Yes, add it
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

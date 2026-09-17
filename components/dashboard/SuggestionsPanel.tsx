"use client";

import React, { useState } from "react";
import { ATSScoreResult } from "@/types/ats";
import { JobAnalysis } from "@/types/job";
import { Resume } from "@/types/resume";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { Loader2, Sparkles } from "lucide-react";

export function SuggestionsPanel({ score, job, resume }: { score: ATSScoreResult | null; job: JobAnalysis | null; resume: Resume | null }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchSuggestions() {
    if (!score || !job || !resume) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume, job, score }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get suggestions.");
      setSuggestions(data.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get suggestions.");
    } finally {
      setLoading(false);
    }
  }

  if (!score) {
    return (
      <Card>
        <CardHeader title="Suggestions" />
        <EmptyState title="Improvement suggestions will appear here." description="Analyze your resume against a job description to get specific, evidence-based suggestions." />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Suggestions"
        action={
          <Button size="sm" variant="outline" onClick={fetchSuggestions} disabled={loading}>
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Refresh
          </Button>
        }
      />
      <div className="p-4 space-y-4">
        <Group label="Strong Matches" tone="matched" items={score.strongMatches} />
        <Group label="Partial Matches" tone="partial" items={score.partialKeywords} />
        <Group label="Missing Keywords" tone="missing" items={score.missingKeywords} />

        <div className="pt-2 border-t border-line">
          <p className="text-xs font-medium text-ink-soft mb-2">Resume Improvement Suggestions</p>
          {suggestions.length === 0 && !loading && (
            <p className="text-xs text-ink-soft">Click &ldquo;Refresh&rdquo; for specific, evidence-based suggestions.</p>
          )}
          {loading && <p className="text-xs text-ink-soft">Thinking...</p>}
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="text-[13px] flex gap-1.5">
                <span className="text-brass">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
          {error && <p className="text-xs text-clay mt-1">{error}</p>}
        </div>
      </div>
    </Card>
  );
}

function Group({ label, tone, items }: { label: string; tone: "matched" | "partial" | "missing"; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-ink-soft mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((k) => (
          <Badge key={k} tone={tone}>
            {k}
          </Badge>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Primitives";
import { SAMPLE_JOB_DESCRIPTION } from "@/lib/resume/sampleResume";
import { Loader2, ScanSearch } from "lucide-react";

export function JobDescriptionPanel({
  value,
  onChange,
  onAnalyze,
  analyzing,
}: {
  value: string;
  onChange: (text: string) => void;
  onAnalyze: () => void;
  analyzing: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader title="Job Description" subtitle="Paste the target job posting to analyze requirements." />
      <div className="p-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste the target job description here..."
          className="w-full h-52 border border-line rounded-md p-3 text-sm bg-paper focus:bg-white outline-none focus:border-navy resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <button
            className="text-xs text-navy underline underline-offset-2"
            onClick={() => onChange(SAMPLE_JOB_DESCRIPTION)}
          >
            Use a sample job description
          </button>
          <Button
            size="sm"
            disabled={analyzing}
            onClick={() => {
              if (value.trim().length < 20) {
                setError("Paste a job description (at least a couple of sentences) to analyze.");
                return;
              }
              setError(null);
              onAnalyze();
            }}
          >
            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <ScanSearch size={14} />}
            Analyze
          </Button>
        </div>
        {error && <p className="text-xs text-clay mt-2">{error}</p>}
      </div>
    </Card>
  );
}

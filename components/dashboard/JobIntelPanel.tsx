import React from "react";
import { JobAnalysis } from "@/types/job";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui/Primitives";

export function JobIntelPanel({ job, missingKeywords }: { job: JobAnalysis | null; missingKeywords: string[] }) {
  if (!job) {
    return (
      <Card>
        <CardHeader title="Job Description Intelligence" />
        <EmptyState title="No job analyzed yet" description="Paste the target job description and click Analyze to see the extracted role, seniority, and requirements." />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Job Description Intelligence" subtitle={job.company ? `${job.jobTitle} at ${job.company}` : job.jobTitle} />
      <div className="p-4 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target Role" value={job.jobTitle} />
          <Field label="Seniority" value={job.seniority || "Not specified"} />
          <Field label="Years of Experience" value={job.yearsOfExperience || "Not specified"} />
          <Field label="Requirements Found" value={String(job.requirements.length)} />
        </div>

        <TagList label="Required Skills" items={job.requiredSkills} tone="missing-aware" missingSet={new Set(missingKeywords)} />
        <TagList label="Preferred Skills" items={job.preferredSkills} tone="missing-aware" missingSet={new Set(missingKeywords)} />

        {job.responsibilities.length > 0 && (
          <div>
            <p className="text-xs font-medium text-ink-soft mb-1.5">Key Responsibilities</p>
            <ul className="text-[13px] space-y-1 list-disc list-inside text-ink">
              {job.responsibilities.slice(0, 6).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {job.hiddenSignals.length > 0 && (
          <div>
            <p className="text-xs font-medium text-ink-soft mb-1.5">Hidden Signals</p>
            <div className="flex flex-wrap gap-1.5">
              {job.hiddenSignals.map((s) => (
                <Badge key={s} tone="brass">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-ink-soft">{label}</p>
      <p className="font-medium text-ink">{value}</p>
    </div>
  );
}

function TagList({
  label,
  items,
  missingSet,
}: {
  label: string;
  items: string[];
  tone: string;
  missingSet: Set<string>;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-ink-soft mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s) => (
          <Badge key={s} tone={missingSet.has(s) ? "missing" : "matched"}>
            {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}

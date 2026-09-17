import React from "react";
import { Resume } from "@/types/resume";
import { Card, CardHeader, EmptyState } from "@/components/ui/Primitives";
import { wordDiff } from "@/lib/utils/diff";
import { cn } from "@/lib/utils/cn";

function DiffLine({ before, after }: { before: string; after: string }) {
  if (before === after) return <p className="text-[13px] text-ink-soft">{after}</p>;
  const tokens = wordDiff(before, after);
  return (
    <p className="text-[13px] leading-relaxed">
      {tokens.map((t, i) => (
        <span
          key={i}
          className={cn(
            t.type === "added" && "bg-forest-soft text-forest",
            t.type === "removed" && "bg-clay-soft text-clay line-through"
          )}
        >
          {t.text}
        </span>
      ))}
    </p>
  );
}

export function CompareView({
  original,
  tailored,
  changeNotes,
}: {
  original: Resume | null;
  tailored: Resume | null;
  changeNotes: { field: string; note: string }[];
}) {
  if (!original || !tailored) {
    return (
      <Card>
        <CardHeader title="Before / After Comparison" />
        <EmptyState title="Nothing to compare yet" description="Load a resume and run Tailor to see a before/after comparison." />
      </Card>
    );
  }

  const pairs: { label: string; before: string; after: string }[] = [];
  if (original.summary || tailored.summary) {
    pairs.push({ label: "Summary", before: original.summary || "", after: tailored.summary || "" });
  }
  tailored.experience.forEach((exp, i) => {
    const origExp = original.experience[i];
    exp.bullets.forEach((b, j) => {
      const origBullet = origExp?.bullets[j] ?? "";
      if (origBullet !== b) {
        pairs.push({ label: `Experience: ${exp.company || exp.title}, bullet ${j + 1}`, before: origBullet, after: b });
      }
    });
  });

  return (
    <Card>
      <CardHeader title="Before / After Comparison" subtitle="Green = added, strikethrough red = removed." />
      <div className="p-4 space-y-5">
        {pairs.length === 0 ? (
          <p className="text-sm text-ink-soft">No wording changes yet — tailor your resume to see a comparison.</p>
        ) : (
          pairs.map((p, i) => (
            <div key={i} className="border-b border-line/60 pb-4 last:border-0">
              <p className="text-xs font-medium text-ink-soft mb-1.5">{p.label}</p>
              <DiffLine before={p.before} after={p.after} />
            </div>
          ))
        )}

        {changeNotes.length > 0 && (
          <div className="pt-2 border-t border-line">
            <p className="text-xs font-medium text-ink-soft mb-2">Why these changes were made</p>
            <ul className="space-y-1.5">
              {changeNotes.map((n, i) => (
                <li key={i} className="text-[13px]">
                  <span className="font-medium">{n.field}:</span> {n.note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

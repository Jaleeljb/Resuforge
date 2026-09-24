import React from "react";
import { Resume } from "@/types/resume";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui/Primitives";
import { cn } from "@/lib/utils/cn";
import { DiffToken, matchByKey, matchExactStrings, matchTextLists, wordDiff } from "@/lib/utils/diff";

type Side = "before" | "after";
type IdMatch = { beforeToAfter: (number | null)[]; afterToBefore: (number | null)[] };

/** Resolves a single before/after text pair into just the tokens relevant to
 * one side — e.g. the Original column shows unchanged + removed words, the
 * Tailored column shows unchanged + added words. */
function diffTextTokens(before: string, after: string, side: Side): DiffToken[] {
  if (before === after) return [{ text: after, type: "same" }];
  return wordDiff(before, after).filter((t) => (side === "before" ? t.type !== "added" : t.type !== "removed"));
}

function DiffSpan({ tokens }: { tokens: DiffToken[] }) {
  return (
    <>
      {tokens.map((t, i) => (
        <span
          key={i}
          className={cn(
            t.type === "removed" && "bg-clay-soft text-clay line-through",
            t.type === "added" && "bg-forest-soft text-forest rounded-sm"
          )}
        >
          {t.text}
        </span>
      ))}
    </>
  );
}

type BulletRow = { key: string; text: string; tokens: DiffToken[] | null; wholeStatus: "added" | "removed" | null };

/** Diffs one column's own bullet list against the matched counterpart's
 * bullet list (an empty array when the whole item has no counterpart),
 * always rendering `sideBullets` in that column's own order. */
function bulletsForSide(sideBullets: string[], otherBullets: string[], side: Side): BulletRow[] {
  const before = side === "before" ? sideBullets : otherBullets;
  const after = side === "before" ? otherBullets : sideBullets;
  const { beforeToAfter, afterToBefore } = matchTextLists(before, after);

  if (side === "before") {
    return before.map((text, i) => {
      const ai = beforeToAfter[i];
      if (ai === null) return { key: `b${i}`, text, tokens: null, wholeStatus: "removed" as const };
      if (after[ai] === text) return { key: `b${i}`, text, tokens: null, wholeStatus: null };
      return { key: `b${i}`, text, tokens: diffTextTokens(text, after[ai], "before"), wholeStatus: null };
    });
  }
  return after.map((text, j) => {
    const bi = afterToBefore[j];
    if (bi === null) return { key: `a${j}`, text, tokens: null, wholeStatus: "added" as const };
    if (before[bi] === text) return { key: `a${j}`, text, tokens: null, wholeStatus: null };
    return { key: `a${j}`, text, tokens: diffTextTokens(before[bi], text, "after"), wholeStatus: null };
  });
}

function BulletList({ rows }: { rows: BulletRow[] }) {
  if (rows.length === 0) return null;
  return (
    <ul className="mt-0.5 space-y-1">
      {rows.map((row) => (
        <li
          key={row.key}
          className={cn(
            "flex gap-1.5 text-[13px] leading-snug rounded px-1.5 py-0.5 -mx-1.5",
            row.wholeStatus === "removed" && "bg-clay-soft/50",
            row.wholeStatus === "added" && "bg-forest-soft/50"
          )}
        >
          <span className="shrink-0 text-ink-soft">•</span>
          <span>
            {row.wholeStatus === "removed" ? (
              <span className="text-clay line-through">{row.text}</span>
            ) : row.wholeStatus === "added" ? (
              <span className="text-forest">{row.text}</span>
            ) : row.tokens ? (
              <DiffSpan tokens={row.tokens} />
            ) : (
              row.text
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

type BadgeRow = { key: string; text: string; status: "same" | "added" | "removed" };

/** Same idea as bulletsForSide, but for skill items: matched by exact text
 * (tailoring reorders/adds items, it never rewords them). */
function badgesForSide(sideItems: string[], otherItems: string[], side: Side): BadgeRow[] {
  const before = side === "before" ? sideItems : otherItems;
  const after = side === "before" ? otherItems : sideItems;
  const { beforeToAfter, afterToBefore } = matchExactStrings(before, after);

  if (side === "before") {
    return before.map((text, i) => ({ key: `b${i}`, text, status: beforeToAfter[i] === null ? "removed" : "same" }));
  }
  return after.map((text, j) => ({ key: `a${j}`, text, status: afterToBefore[j] === null ? "added" : "same" }));
}

function SkillBadges({ rows }: { rows: BadgeRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {rows.map((r) => (
        <Badge
          key={r.key}
          tone={r.status === "added" ? "matched" : r.status === "removed" ? "missing" : "neutral"}
          className={r.status === "removed" ? "line-through" : undefined}
        >
          {r.text}
        </Badge>
      ))}
    </div>
  );
}

function wholeStatusFor(matchedIdx: number | null, side: Side): "added" | "removed" | null {
  if (matchedIdx !== null) return null;
  return side === "before" ? "removed" : "added";
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="font-bold text-[13px] border-b border-line pb-1 mb-2 text-navy">{title}</div>
      {children}
    </div>
  );
}

type ColumnModel = {
  label: string;
  name: string;
  contactLine: string;
  titleTokens: DiffToken[];
  summaryTokens: DiffToken[];
  experience: { key: string; title: string; company: string; dates: string; bullets: BulletRow[] }[];
  skills: { key: string; category: string; wholeStatus: "added" | "removed" | null; items: BadgeRow[] }[];
  projects: { key: string; name: string; technologies: string[]; wholeStatus: "added" | "removed" | null; bullets: BulletRow[] }[];
  education: Resume["education"];
  certifications: Resume["certifications"];
};

function buildColumnModel(
  resume: Resume,
  other: Resume,
  side: Side,
  expMatch: IdMatch,
  skillMatch: IdMatch,
  projectMatch: IdMatch,
  label: string
): ColumnModel {
  const beforeTitle = side === "before" ? resume.personalInfo.title || "" : other.personalInfo.title || "";
  const afterTitle = side === "before" ? other.personalInfo.title || "" : resume.personalInfo.title || "";
  const beforeSummary = side === "before" ? resume.summary || "" : other.summary || "";
  const afterSummary = side === "before" ? other.summary || "" : resume.summary || "";

  const experience = resume.experience.map((exp, i) => {
    const matchedIdx = side === "before" ? expMatch.beforeToAfter[i] : expMatch.afterToBefore[i];
    const otherBullets = matchedIdx !== null ? other.experience[matchedIdx].bullets : [];
    return {
      key: exp.id,
      title: exp.title,
      company: exp.company,
      dates: [exp.startDate, exp.endDate].filter(Boolean).join(" – "),
      bullets: bulletsForSide(exp.bullets, otherBullets, side),
    };
  });

  const skills = resume.skills.map((cat, i) => {
    const matchedIdx = side === "before" ? skillMatch.beforeToAfter[i] : skillMatch.afterToBefore[i];
    const otherItems = matchedIdx !== null ? other.skills[matchedIdx].items : [];
    return {
      key: cat.id,
      category: cat.category,
      wholeStatus: wholeStatusFor(matchedIdx, side),
      items: badgesForSide(cat.items, otherItems, side),
    };
  });

  const projects = resume.projects.map((p, i) => {
    const matchedIdx = side === "before" ? projectMatch.beforeToAfter[i] : projectMatch.afterToBefore[i];
    const otherBullets = matchedIdx !== null ? other.projects[matchedIdx].bullets : [];
    return {
      key: p.id,
      name: p.name,
      technologies: p.technologies,
      wholeStatus: wholeStatusFor(matchedIdx, side),
      bullets: bulletsForSide(p.bullets, otherBullets, side),
    };
  });

  const contactParts = [
    resume.personalInfo.location,
    resume.personalInfo.phone,
    resume.personalInfo.email,
    resume.personalInfo.linkedin,
    resume.personalInfo.portfolio,
  ].filter(Boolean);

  return {
    label,
    name: resume.personalInfo.name || "Your Name",
    contactLine: contactParts.join("   |   "),
    titleTokens: diffTextTokens(beforeTitle, afterTitle, side),
    summaryTokens: diffTextTokens(beforeSummary, afterSummary, side),
    experience,
    skills,
    projects,
    education: resume.education,
    certifications: resume.certifications,
  };
}

function hasText(tokens: DiffToken[]): boolean {
  return tokens.some((t) => t.text.trim().length > 0);
}

function ResumeColumn({ model }: { model: ColumnModel }) {
  return (
    <Card className="flex flex-col">
      <CardHeader title={model.label} />
      <div className="p-5">
        <div className="font-bold text-[18px]">{model.name}</div>
        {hasText(model.titleTokens) && (
          <div className="text-[13px] text-navy mt-0.5">
            <DiffSpan tokens={model.titleTokens} />
          </div>
        )}
        <div className="text-[11px] text-ink-soft mt-1">{model.contactLine}</div>
        <div className="border-b border-line mt-2 mb-3" />

        {hasText(model.summaryTokens) && (
          <Section title="Summary">
            <p className="text-[13px] leading-relaxed">
              <DiffSpan tokens={model.summaryTokens} />
            </p>
          </Section>
        )}

        {model.experience.length > 0 && (
          <Section title="Experience">
            {model.experience.map((exp) => (
              <div key={exp.key} className="mb-3 last:mb-0">
                <div className="flex justify-between font-semibold text-[13px]">
                  <span>
                    {exp.title}
                    {exp.company ? `, ${exp.company}` : ""}
                  </span>
                  <span className="font-normal text-ink-soft whitespace-nowrap ml-2 text-[11px]">{exp.dates}</span>
                </div>
                <BulletList rows={exp.bullets} />
              </div>
            ))}
          </Section>
        )}

        {model.skills.length > 0 && (
          <Section title="Skills">
            <div className="space-y-2">
              {model.skills.map((cat) => (
                <div
                  key={cat.key}
                  className={cn(
                    "rounded px-1.5 py-1 -mx-1.5",
                    cat.wholeStatus === "removed" && "bg-clay-soft/40",
                    cat.wholeStatus === "added" && "bg-forest-soft/40"
                  )}
                >
                  <p
                    className={cn(
                      "text-[12px] font-semibold mb-1",
                      cat.wholeStatus === "removed" && "text-clay line-through",
                      cat.wholeStatus === "added" && "text-forest"
                    )}
                  >
                    {cat.category}
                  </p>
                  <SkillBadges rows={cat.items} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {model.projects.length > 0 && (
          <Section title="Projects">
            {model.projects.map((p) => (
              <div
                key={p.key}
                className={cn(
                  "mb-3 last:mb-0 rounded px-1.5 py-1 -mx-1.5",
                  p.wholeStatus === "removed" && "bg-clay-soft/40",
                  p.wholeStatus === "added" && "bg-forest-soft/40"
                )}
              >
                <div
                  className={cn(
                    "font-semibold text-[13px]",
                    p.wholeStatus === "removed" && "text-clay line-through",
                    p.wholeStatus === "added" && "text-forest"
                  )}
                >
                  {p.name}
                  {p.technologies.length > 0 ? ` (${p.technologies.join(", ")})` : ""}
                </div>
                <BulletList rows={p.bullets} />
              </div>
            ))}
          </Section>
        )}

        {model.education.length > 0 && (
          <Section title="Education">
            {model.education.map((edu) => (
              <div key={edu.id} className="flex justify-between text-[13px]">
                <span className="font-semibold">
                  {edu.degree}
                  {edu.institution ? `, ${edu.institution}` : ""}
                </span>
                <span className="text-ink-soft">{edu.graduationDate}</span>
              </div>
            ))}
          </Section>
        )}

        {model.certifications.length > 0 && (
          <Section title="Certifications">
            <p className="text-[13px]">
              {model.certifications.map((c) => [c.name, c.issuer, c.date].filter(Boolean).join(" — ")).join("   |   ")}
            </p>
          </Section>
        )}
      </div>
    </Card>
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
        <EmptyState
          title="Nothing to compare yet"
          description="Load a resume and run Tailor to see the original and tailored resume side by side."
        />
      </Card>
    );
  }

  const expMatch = matchByKey(original.experience, tailored.experience, (e) => e.id);
  const skillMatch = matchByKey(original.skills, tailored.skills, (s) => s.id);
  const projectMatch = matchByKey(original.projects, tailored.projects, (p) => p.id);

  const beforeModel = buildColumnModel(original, tailored, "before", expMatch, skillMatch, projectMatch, "Original Resume");
  const afterModel = buildColumnModel(tailored, original, "after", expMatch, skillMatch, projectMatch, "Tailored Resume");

  const hasAnyChange = JSON.stringify(original) !== JSON.stringify(tailored);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-serif text-lg">Before / After Comparison</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Every section is shown side by side, with the exact wording that changed highlighted in place.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-soft shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-forest-soft border border-forest/40" /> Added / improved
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-clay-soft border border-clay/40" /> Removed
          </span>
        </div>
      </div>

      {!hasAnyChange ? (
        <Card>
          <EmptyState
            title="No changes yet"
            description="Tailor your resume against a job description to see a side-by-side comparison."
          />
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <ResumeColumn model={beforeModel} />
          <ResumeColumn model={afterModel} />
        </div>
      )}

      {changeNotes.length > 0 && (
        <Card>
          <CardHeader title="Why these changes were made" />
          <div className="p-4">
            <ul className="space-y-1.5">
              {changeNotes.map((n, i) => (
                <li key={i} className="text-[13px]">
                  <span className="font-medium">{n.field}:</span> {n.note}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}

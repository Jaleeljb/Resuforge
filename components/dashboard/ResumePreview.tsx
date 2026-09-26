"use client";

import React, { useEffect, useRef, useState } from "react";
import { Resume, TemplateId } from "@/types/resume";
import { checkPageFit } from "@/lib/resume/onePage";
import { cn } from "@/lib/utils/cn";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { TEMPLATE_SPECS, SECTION_RULE_COLOR, CSS_FONT_CLASS } from "@/lib/resume/templateSpecs";

export function ResumePreview({
  resume,
  template = "classic",
  compact = false,
  verifiedPages,
  verifying = false,
  wasTrimmed = false,
}: {
  resume: Resume;
  template?: TemplateId;
  compact?: boolean;
  /** Real page count from actually rendering the PDF server-side, when available. */
  verifiedPages?: number;
  verifying?: boolean;
  wasTrimmed?: boolean;
}) {
  const spec = TEMPLATE_SPECS[template];
  const fontClass = CSS_FONT_CLASS[spec.fontFamily];
  // Quick, free, client-side estimate — used as an instant fallback badge
  // while the accurate server-verified page count (see verifiedPages) is
  // still loading, and this component (e.g. the version-history modal)
  // doesn't always have one. Uses the same per-template body size as the
  // real export so the estimate reflects this template, not a generic one.
  const heuristicFit = checkPageFit(resume, spec.bodyPt);
  const { personalInfo } = resume;
  const contactParts = [personalInfo.location, personalInfo.phone, personalInfo.email, personalInfo.linkedin, personalInfo.portfolio].filter(Boolean);

  const hasVerified = typeof verifiedPages === "number";
  const fits = hasVerified ? verifiedPages === 1 : heuristicFit.fits;

  const maxWidthPx = compact ? 340 : 640;
  const pageRatio = 11 / 8.5;
  const containerRef = useRef<HTMLDivElement>(null);
  const [widthPx, setWidthPx] = useState<number>(maxWidthPx);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidthPx(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Converts the template's real point/inch sizes (the same values the PDF
  // and DOCX exports use — see lib/resume/templateSpecs.ts) into on-screen
  // pixels using the page's *actual* rendered width. That makes this a true
  // scaled-down mirror of the printed page for this exact template, rather
  // than a fixed set of sizes that merely look "about right" — and it's why
  // downloading no longer looks different from what was just previewed.
  const pxPerInch = widthPx / 8.5;
  const pxPerPt = pxPerInch / 72;
  const pageHeight = widthPx * pageRatio;
  const sizes = {
    name: spec.namePt * pxPerPt,
    title: (spec.bodyPt + 0.5) * pxPerPt,
    body: spec.bodyPt * pxPerPt,
    contact: (spec.bodyPt - 0.8) * pxPerPt,
    dates: (spec.bodyPt - 0.5) * pxPerPt,
    sub: (spec.bodyPt - 0.3) * pxPerPt,
    heading: spec.headingPt * pxPerPt,
  };
  const padding = spec.marginIn * pxPerInch;
  const accent = `#${spec.accentColor}`;
  const rule = `#${spec.ruleColor}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", fits ? "text-forest" : "text-clay")}>
          {verifying ? (
            <Loader2 size={13} className="animate-spin text-ink-soft" />
          ) : fits ? (
            <CheckCircle2 size={13} />
          ) : (
            <AlertTriangle size={13} />
          )}
          {verifying
            ? "Checking page fit..."
            : fits
              ? wasTrimmed
                ? "Fits one page (auto-trimmed)"
                : "Fits one page"
              : hasVerified
                ? `Spilling onto page ${verifiedPages}`
                : `Overflowing by ~${heuristicFit.overflowBy} line(s)`}
        </span>
        {!hasVerified && <span className="text-[11px] text-ink-soft">~{heuristicFit.estimatedLines} / {heuristicFit.maxLines} lines</span>}
      </div>

      <div
        ref={containerRef}
        className={cn("relative bg-white border border-line shadow-sm mx-auto text-[#161616] leading-snug", fontClass)}
        style={{ width: "100%", maxWidth: maxWidthPx, minHeight: pageHeight, padding, fontSize: sizes.body }}
      >
        <div className="font-bold" style={{ fontSize: sizes.name, marginBottom: 4 * pxPerPt }}>{personalInfo.name || "Your Name"}</div>
        {personalInfo.title ? (
          <div style={{ color: accent, fontSize: sizes.title, marginBottom: 3 * pxPerPt }}>{personalInfo.title}</div>
        ) : null}
        <div className="text-ink-soft" style={{ fontSize: sizes.contact }}>{contactParts.join("   |   ")}</div>
        <div className="mt-2 mb-2" style={{ borderBottom: `1.4px solid ${rule}` }} />

        {resume.summary ? (
          <Section title="Summary" accent={accent} headingSize={sizes.heading}>
            <p>{resume.summary}</p>
          </Section>
        ) : null}

        {resume.experience.length > 0 ? (
          <Section title="Experience" accent={accent} headingSize={sizes.heading}>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-2">
                <div className="flex justify-between font-semibold">
                  <span>
                    {exp.title}
                    {exp.company ? `, ${exp.company}` : ""}
                  </span>
                  <span className="font-normal text-ink-soft whitespace-nowrap ml-2" style={{ fontSize: sizes.dates }}>
                    {[exp.startDate, exp.endDate].filter(Boolean).join(" – ")}
                  </span>
                </div>
                {exp.location ? (
                  <div className="italic text-ink-soft" style={{ fontSize: sizes.sub }}>{exp.location}</div>
                ) : null}
                <ul className="mt-0.5 space-y-0.5">
                  {exp.bullets.map((b, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span>•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        ) : null}

        {resume.skills.length > 0 ? (
          <Section title="Skills" accent={accent} headingSize={sizes.heading}>
            {resume.skills.map((cat) => (
              <p key={cat.id} className="mb-0.5">
                <span className="font-semibold">{cat.category}: </span>
                {cat.items.join(", ")}
              </p>
            ))}
          </Section>
        ) : null}

        {resume.projects.length > 0 ? (
          <Section title="Projects" accent={accent} headingSize={sizes.heading}>
            {resume.projects.map((p) => (
              <div key={p.id} className="mb-1.5">
                <div className="font-semibold">
                  {p.name}
                  {p.technologies.length > 0 ? ` (${p.technologies.join(", ")})` : ""}
                </div>
                <ul className="mt-0.5 space-y-0.5">
                  {p.bullets.map((b, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span>•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        ) : null}

        {resume.education.length > 0 ? (
          <Section title="Education" accent={accent} headingSize={sizes.heading}>
            {resume.education.map((edu) => (
              <div key={edu.id} className="flex justify-between">
                <span className="font-semibold">
                  {edu.degree}
                  {edu.institution ? `, ${edu.institution}` : ""}
                </span>
                <span className="text-ink-soft" style={{ fontSize: sizes.dates }}>{edu.graduationDate}</span>
              </div>
            ))}
          </Section>
        ) : null}

        {resume.certifications.length > 0 ? (
          <Section title="Certifications" accent={accent} headingSize={sizes.heading}>
            <ul className="space-y-0.5">
              {resume.certifications.map((c) => (
                <li key={c.id} className="flex gap-1.5">
                  <span>•</span>
                  <span>{[c.name, c.issuer, c.date].filter(Boolean).join(" — ")}</span>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {/* Page-break marker: when content runs past one page, this shows
            exactly where page 1 ends instead of silently hiding the rest. */}
        {!fits && !verifying && (
          <div
            className="absolute left-0 right-0 flex items-center gap-2 px-2"
            style={{ top: pageHeight }}
          >
            <div className="flex-1 border-t-2 border-dashed border-clay/60" />
            <span className="text-[9px] uppercase tracking-wide font-medium text-clay bg-clay-soft px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
              Page 1 ends here
            </span>
            <div className="flex-1 border-t-2 border-dashed border-clay/60" />
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  accent,
  headingSize,
}: {
  title: string;
  children: React.ReactNode;
  accent: string;
  headingSize: number;
}) {
  return (
    <div className="mb-2.5">
      <div
        className="font-bold pb-0.5 mb-1"
        style={{ color: accent, fontSize: headingSize, borderBottom: `1px solid #${SECTION_RULE_COLOR}` }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

import React from "react";
import { Resume, TemplateId } from "@/types/resume";
import { checkPageFit } from "@/lib/resume/onePage";
import { cn } from "@/lib/utils/cn";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const TEMPLATE_CLASSES: Record<TemplateId, { font: string; accent: string; heading: string }> = {
  classic: { font: "resume-font-serif", accent: "text-[#1b3a5c]", heading: "text-[13px]" },
  "modern-ats": { font: "resume-font-sans", accent: "text-[#1b3a5c]", heading: "text-[12.5px]" },
  "compact-technical": { font: "resume-font-sans", accent: "text-[#2f5233]", heading: "text-[12px]" },
};

export function ResumePreview({ resume, template = "classic", compact = false }: { resume: Resume; template?: TemplateId; compact?: boolean }) {
  const t = TEMPLATE_CLASSES[template];
  const fit = checkPageFit(resume, template === "compact-technical" ? 9.5 : template === "modern-ats" ? 10 : 10.5);
  const { personalInfo } = resume;
  const contactParts = [personalInfo.location, personalInfo.phone, personalInfo.email, personalInfo.linkedin, personalInfo.portfolio].filter(Boolean);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", fit.fits ? "text-forest" : "text-clay")}>
          {fit.fits ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          {fit.fits ? "Fits one page" : `Overflowing by ~${fit.overflowBy} line(s)`}
        </span>
        <span className="text-[11px] text-ink-soft">~{fit.estimatedLines} / {fit.maxLines} lines</span>
      </div>

      <div
        className={cn(
          "bg-white border border-line shadow-sm mx-auto text-[#161616]",
          t.font,
          compact ? "p-5 text-[9px] leading-snug" : "p-8 text-[12px] leading-snug"
        )}
        style={{ aspectRatio: "8.5 / 11", width: "100%", maxWidth: compact ? 340 : 640, overflow: "hidden" }}
      >
        <div className={cn("font-bold", compact ? "text-[15px]" : "text-[22px]")}>{personalInfo.name || "Your Name"}</div>
        {personalInfo.title ? <div className={cn(t.accent, compact ? "text-[10px]" : "text-[13px]")}>{personalInfo.title}</div> : null}
        <div className={cn("text-ink-soft mt-1", compact ? "text-[8px]" : "text-[10px]")}>{contactParts.join("   |   ")}</div>
        <div className="border-b border-[#333] mt-2 mb-2" />

        {resume.summary ? (
          <Section title="Summary" accentClass={t.accent} headingClass={t.heading} compact={compact}>
            <p>{resume.summary}</p>
          </Section>
        ) : null}

        {resume.experience.length > 0 ? (
          <Section title="Experience" accentClass={t.accent} headingClass={t.heading} compact={compact}>
            {resume.experience.map((exp) => (
              <div key={exp.id} className="mb-2">
                <div className="flex justify-between font-semibold">
                  <span>
                    {exp.title}
                    {exp.company ? `, ${exp.company}` : ""}
                  </span>
                  <span className="font-normal text-ink-soft whitespace-nowrap ml-2">
                    {[exp.startDate, exp.endDate].filter(Boolean).join(" – ")}
                  </span>
                </div>
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
          <Section title="Skills" accentClass={t.accent} headingClass={t.heading} compact={compact}>
            {resume.skills.map((cat) => (
              <p key={cat.id} className="mb-0.5">
                <span className="font-semibold">{cat.category}: </span>
                {cat.items.join(", ")}
              </p>
            ))}
          </Section>
        ) : null}

        {resume.projects.length > 0 ? (
          <Section title="Projects" accentClass={t.accent} headingClass={t.heading} compact={compact}>
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
          <Section title="Education" accentClass={t.accent} headingClass={t.heading} compact={compact}>
            {resume.education.map((edu) => (
              <div key={edu.id} className="flex justify-between">
                <span className="font-semibold">
                  {edu.degree}
                  {edu.institution ? `, ${edu.institution}` : ""}
                </span>
                <span className="text-ink-soft">{edu.graduationDate}</span>
              </div>
            ))}
          </Section>
        ) : null}

        {resume.certifications.length > 0 ? (
          <Section title="Certifications" accentClass={t.accent} headingClass={t.heading} compact={compact}>
            <p>{resume.certifications.map((c) => [c.name, c.issuer, c.date].filter(Boolean).join(" — ")).join("   |   ")}</p>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  accentClass,
  headingClass,
  compact,
}: {
  title: string;
  children: React.ReactNode;
  accentClass: string;
  headingClass: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mb-1.5" : "mb-2.5"}>
      <div className={cn("font-bold border-b border-[#cfcabb] pb-0.5 mb-1", accentClass, headingClass)}>{title}</div>
      {children}
    </div>
  );
}

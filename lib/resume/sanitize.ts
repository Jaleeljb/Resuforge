import { Resume } from "@/types/resume";

// XML 1.0 (used inside .docx) only allows tab, newline, carriage return
// among control characters — anything else in that range is invalid and
// can produce a corrupted, unopenable .docx even if the `docx` library
// doesn't throw while building it. Paste artifacts from PDFs/websites
// occasionally include these, so we strip them defensively everywhere,
// not just before DOCX export.
// eslint-disable-next-line no-control-regex
const INVALID_XML_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

const HARD_MAX_LONG_TEXT = 8000; // absolute safety net, above the Zod limit
const HARD_MAX_SHORT_TEXT = 500;

function cleanText(value: string | undefined, maxLength = HARD_MAX_SHORT_TEXT): string | undefined {
  if (value === undefined) return undefined;
  const stripped = value.replace(INVALID_XML_CHARS, " ").replace(/[ \t]+/g, " ").trim();
  return stripped.length > maxLength ? stripped.slice(0, maxLength) : stripped;
}

function cleanLongText(value: string | undefined, maxLength = HARD_MAX_LONG_TEXT): string | undefined {
  if (value === undefined) return undefined;
  // Bullets/summaries are allowed internal newlines (paragraph-ish text
  // pasted in), just not raw control characters.
  const stripped = value.replace(INVALID_XML_CHARS, " ").trim();
  return stripped.length > maxLength ? stripped.slice(0, maxLength) : stripped;
}

/**
 * Defense-in-depth cleanup applied right after a resume is parsed or
 * received by any API route that renders it (export, tailoring, fitting).
 * This exists independently of the (generous) Zod length limits in
 * lib/validation/schemas.ts: even if a future change loosens those limits
 * further, or a client sends data that technically validates but contains
 * characters that are invalid in DOCX XML, this keeps rendering safe.
 */
export function sanitizeResume(resume: Resume): Resume {
  return {
    personalInfo: {
      name: cleanText(resume.personalInfo.name, 200) || "Your Name",
      title: cleanText(resume.personalInfo.title, 200),
      email: cleanText(resume.personalInfo.email, 200),
      phone: cleanText(resume.personalInfo.phone, 60),
      location: cleanText(resume.personalInfo.location, 200),
      linkedin: cleanText(resume.personalInfo.linkedin, 300),
      portfolio: cleanText(resume.personalInfo.portfolio, 300),
    },
    summary: cleanLongText(resume.summary, 6000),
    experience: resume.experience.map((exp) => ({
      ...exp,
      company: cleanText(exp.company, 200) || "",
      title: cleanText(exp.title, 200) || "",
      location: cleanText(exp.location, 200),
      startDate: cleanText(exp.startDate, 60),
      endDate: cleanText(exp.endDate, 60),
      bullets: exp.bullets.map((b) => cleanLongText(b, 4000) || "").filter(Boolean),
    })),
    skills: resume.skills.map((cat) => ({
      ...cat,
      category: cleanText(cat.category, 150) || "Skills",
      items: cat.items.map((i) => cleanText(i, 150) || "").filter(Boolean),
    })),
    projects: resume.projects.map((p) => ({
      ...p,
      name: cleanText(p.name, 300) || "",
      url: cleanText(p.url, 500),
      technologies: p.technologies.map((t) => cleanText(t, 150) || "").filter(Boolean),
      bullets: p.bullets.map((b) => cleanLongText(b, 4000) || "").filter(Boolean),
    })),
    education: resume.education.map((edu) => ({
      ...edu,
      degree: cleanText(edu.degree, 300) || "",
      institution: cleanText(edu.institution, 300) || "",
      location: cleanText(edu.location, 200),
      graduationDate: cleanText(edu.graduationDate, 60),
      details: edu.details?.map((d) => cleanText(d, 500) || "").filter(Boolean),
    })),
    certifications: resume.certifications.map((c) => ({
      ...c,
      name: cleanText(c.name, 300) || "",
      issuer: cleanText(c.issuer, 300),
      date: cleanText(c.date, 60),
    })),
  };
}

import { Resume, Experience, Education, Project, SkillCategory, Certification, emptyResume } from "@/types/resume";
import { toLines, isBulletLine, stripBullet } from "@/lib/text/normalize";

type SectionKind = "summary" | "experience" | "skills" | "projects" | "education" | "certifications" | null;

const HEADER_PATTERNS: { kind: SectionKind; pattern: RegExp }[] = [
  { kind: "summary", pattern: /^(summary|profile|objective|professional summary|about me)\s*:?$/i },
  { kind: "experience", pattern: /^(experience|work experience|professional experience|employment( history)?)\s*:?$/i },
  { kind: "skills", pattern: /^(skills|technical skills|core competencies|key skills)\s*:?$/i },
  { kind: "projects", pattern: /^(projects|personal projects|academic projects)\s*:?$/i },
  { kind: "education", pattern: /^(education|academic background)\s*:?$/i },
  { kind: "certifications", pattern: /^(certifications?|licenses?( and certifications)?)\s*:?$/i },
];

const DATE_PATTERN = /((19|20)\d{2}|present|current)/i;
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[a-z.]{2,}/i;
const PHONE_PATTERN = /(\+?\d{1,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const LINKEDIN_PATTERN = /linkedin\.com\/\S+/i;
const URL_PATTERN = /(https?:\/\/)?[\w-]+\.(?:github|dev|com|io|net|org)\/?\S*/i;
const TITLE_HINTS = ["analyst", "engineer", "manager", "specialist", "administrator", "architect", "developer", "consultant", "director", "lead", "coordinator", "associate", "intern", "officer", "scientist", "designer", "technician"];

function detectHeader(line: string): SectionKind {
  const cleaned = line.replace(/[:：]\s*$/, "").trim();
  for (const { kind, pattern } of HEADER_PATTERNS) {
    if (pattern.test(cleaned)) return kind;
  }
  return null;
}

function parsePersonalInfo(headerLines: string[]): Resume["personalInfo"] {
  const name = headerLines[0]?.trim() || "Your Name";
  const rest = headerLines.slice(1).join(" | ");

  const email = rest.match(EMAIL_PATTERN)?.[0];
  const phone = rest.match(PHONE_PATTERN)?.[0];
  const linkedin = rest.match(LINKEDIN_PATTERN)?.[0];
  // Strip the email before hunting for other URLs so the domain portion of
  // an email address (e.g. "example.com" in "alex@example.com") is never
  // mistaken for a separate portfolio link.
  const restWithoutEmail = email ? rest.replace(email, " ") : rest;
  const urls = restWithoutEmail.match(new RegExp(URL_PATTERN, "gi")) || [];
  const portfolio = urls.find((u) => !/linkedin/i.test(u));

  // Location: a segment that isn't email/phone/url and looks like "City, ST".
  let location: string | undefined;
  for (const part of rest.split(/[|•]/)) {
    const p = part.trim();
    if (!p || EMAIL_PATTERN.test(p) || PHONE_PATTERN.test(p) || LINKEDIN_PATTERN.test(p) || URL_PATTERN.test(p)) continue;
    if (/^[A-Za-z .]+,\s*[A-Za-z]{2,}$/.test(p)) {
      location = p;
      break;
    }
  }

  // A possible target title line right under the name (short, has a title hint, no @ or digits).
  let title: string | undefined;
  if (headerLines[1] && headerLines[1].length < 60 && !EMAIL_PATTERN.test(headerLines[1]) && !PHONE_PATTERN.test(headerLines[1])) {
    const lower = headerLines[1].toLowerCase();
    if (TITLE_HINTS.some((h) => lower.includes(h))) title = headerLines[1].trim();
  }

  return { name, title, email, phone, location, linkedin, portfolio };
}

function splitEntryLine(line: string): { left: string; dates?: string } {
  const dateMatch = line.match(/([A-Za-z]{3,9}\.?\s*\d{4}|\d{4})\s*(-|–|—|to)\s*([A-Za-z]{3,9}\.?\s*\d{4}|\d{4}|present|current)/i) || line.match(DATE_PATTERN);
  if (!dateMatch) return { left: line };
  const dates = dateMatch[0];
  const left = line.replace(dates, "").replace(/[|,\-–—]+\s*$/, "").trim();
  return { left, dates };
}

function parseExperienceBlock(lines: string[]): Experience[] {
  const entries: Experience[] = [];
  let current: Experience | null = null;
  let idx = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (isBulletLine(line)) {
      if (!current) {
        current = { id: `exp-${++idx}`, company: "", title: "", bullets: [] };
        entries.push(current);
      }
      current.bullets.push(stripBullet(line));
      continue;
    }

    // Non-bullet line: starts a new entry.
    const { left, dates } = splitEntryLine(line);
    const parts = left.split(/\s*[|•]\s*|\s+[-–—]\s+/).map((p) => p.trim()).filter(Boolean);

    let company = "";
    let title = "";
    if (parts.length >= 2) {
      const titleIdx = parts.findIndex((p) => TITLE_HINTS.some((h) => p.toLowerCase().includes(h)));
      if (titleIdx === 0) {
        title = parts[0];
        company = parts[1];
      } else {
        company = parts[0];
        title = parts[1] ?? "";
      }
    } else {
      // Single unsplit segment — best-effort guess.
      const lower = left.toLowerCase();
      if (TITLE_HINTS.some((h) => lower.includes(h))) title = left;
      else company = left;
    }

    current = { id: `exp-${++idx}`, company, title, startDate: dates?.split(/-|–|—|to/i)[0]?.trim(), endDate: dates?.split(/-|–|—|to/i)[1]?.trim(), bullets: [] };
    entries.push(current);
  }

  return entries.filter((e) => e.company || e.title || e.bullets.length > 0);
}

function parseSkillsBlock(lines: string[]): SkillCategory[] {
  const categories: SkillCategory[] = [];
  let idx = 0;
  for (const raw of lines) {
    const line = isBulletLine(raw) ? stripBullet(raw) : raw.trim();
    if (!line) continue;
    const colonIdx = line.indexOf(":");
    if (colonIdx > -1 && colonIdx < 40) {
      const category = line.slice(0, colonIdx).trim();
      const items = line
        .slice(colonIdx + 1)
        .split(/,|;/)
        .map((s) => s.trim())
        .filter(Boolean);
      categories.push({ id: `sk-${++idx}`, category, items });
    } else {
      const items = line.split(/,|;/).map((s) => s.trim()).filter(Boolean);
      if (items.length > 0) categories.push({ id: `sk-${++idx}`, category: "Skills", items });
    }
  }
  return categories;
}

function parseProjectsBlock(lines: string[]): Project[] {
  const projects: Project[] = [];
  let current: Project | null = null;
  let idx = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (isBulletLine(line)) {
      if (!current) {
        current = { id: `proj-${++idx}`, name: "Project", technologies: [], bullets: [] };
        projects.push(current);
      }
      current.bullets.push(stripBullet(line));
      continue;
    }

    const techMatch = line.match(/\(([^)]+)\)\s*$/);
    const name = techMatch ? line.slice(0, techMatch.index).trim() : line;
    const technologies = techMatch ? techMatch[1].split(/,|\|/).map((t) => t.trim()) : [];
    current = { id: `proj-${++idx}`, name: name.replace(/[-–—:]\s*$/, "").trim(), technologies, bullets: [] };
    projects.push(current);
  }

  return projects.filter((p) => p.name || p.bullets.length > 0);
}

function parseEducationBlock(lines: string[]): Education[] {
  const educations: Education[] = [];
  let idx = 0;
  let pending: Partial<Education> = {};

  for (const raw of lines) {
    const line = isBulletLine(raw) ? stripBullet(raw) : raw.trim();
    if (!line) continue;

    const { left, dates } = splitEntryLine(line);
    const parts = left.split(/\s*[|,]\s*/).map((p) => p.trim()).filter(Boolean);

    if (!pending.degree) {
      pending = { degree: parts[0] || left, institution: parts[1], graduationDate: dates };
    } else {
      pending.institution = pending.institution || parts[0];
      pending.graduationDate = pending.graduationDate || dates;
      educations.push({
        id: `edu-${++idx}`,
        degree: pending.degree || "",
        institution: pending.institution || "",
        graduationDate: pending.graduationDate,
        details: [],
      });
      pending = {};
      continue;
    }

    // If this single line already had both degree and institution, flush immediately.
    if (parts.length >= 2) {
      educations.push({
        id: `edu-${++idx}`,
        degree: pending.degree || "",
        institution: pending.institution || "",
        graduationDate: pending.graduationDate,
        details: [],
      });
      pending = {};
    }
  }

  if (pending.degree) {
    educations.push({ id: `edu-${++idx}`, degree: pending.degree, institution: pending.institution || "", graduationDate: pending.graduationDate, details: [] });
  }

  return educations;
}

function parseCertificationsBlock(lines: string[]): Certification[] {
  const certs: Certification[] = [];
  let idx = 0;
  for (const raw of lines) {
    const line = isBulletLine(raw) ? stripBullet(raw) : raw.trim();
    if (!line) continue;
    const dateMatch = line.match(DATE_PATTERN);
    const withoutDate = dateMatch ? line.replace(dateMatch[0], "").replace(/[(),-]\s*$/, "").trim() : line;
    const [name, issuer] = withoutDate.split(/\s*[-–—|]\s*/, 2);
    certs.push({ id: `cert-${++idx}`, name: (name || withoutDate).trim(), issuer: issuer?.trim(), date: dateMatch?.[0] });
  }
  return certs;
}

/**
 * Parses raw resume text (from paste, .txt upload, or extracted from
 * DOCX/PDF) into structured Resume data. Best-effort and heuristic by
 * design — the resume editor lets the user correct anything it gets wrong.
 */
export function parseResumeText(rawText: string): Resume {
  const lines = toLines(rawText);
  if (lines.length === 0) return emptyResume();

  const sections: Record<Exclude<SectionKind, null>, string[]> = {
    summary: [],
    experience: [],
    skills: [],
    projects: [],
    education: [],
    certifications: [],
  };

  // Header block = everything before the first recognized section header.
  let firstHeaderIdx = lines.findIndex((l) => detectHeader(l) !== null);
  if (firstHeaderIdx === -1) firstHeaderIdx = Math.min(lines.length, 4);
  const headerLines = lines.slice(0, firstHeaderIdx);

  let current: SectionKind = null;
  for (const line of lines.slice(firstHeaderIdx)) {
    const kind = detectHeader(line);
    if (kind) {
      current = kind;
      continue;
    }
    if (current) sections[current].push(line);
  }

  const personalInfo = parsePersonalInfo(headerLines);
  const summary = sections.summary.join(" ").trim();
  const experience = parseExperienceBlock(sections.experience);
  const skills = parseSkillsBlock(sections.skills);
  const projects = parseProjectsBlock(sections.projects);
  const education = parseEducationBlock(sections.education);
  const certifications = parseCertificationsBlock(sections.certifications);

  return { personalInfo, summary, experience, skills, projects, education, certifications };
}

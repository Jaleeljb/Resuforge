import { Resume } from "@/types/resume";
import { JobAnalysis } from "@/types/job";
import { stemmedTokenSet } from "@/lib/text/normalize";

function relevanceOf(text: string, job?: JobAnalysis): number {
  if (!job) return 0;
  const jobTokens = new Set<string>();
  for (const term of job.keywords) for (const t of stemmedTokenSet(term)) jobTokens.add(t);
  const textTokens = stemmedTokenSet(text);
  let score = 0;
  for (const t of textTokens) if (jobTokens.has(t)) score++;
  return score;
}

function sortByRelevance<T>(items: T[], textOf: (item: T) => string, job?: JobAnalysis): T[] {
  return [...items].sort((a, b) => relevanceOf(textOf(b), job) - relevanceOf(textOf(a), job));
}

function firstSentences(text: string, count: number): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, count).join(" ");
}

/**
 * Applies one additional, increasingly aggressive round of trimming beyond
 * the heuristic `autoFitOnePage` pass. Used in a measure-and-retry loop
 * (render -> count actual pages -> trim harder -> re-render) so the exported
 * PDF/DOCX and the live preview are truthfully one page, not just
 * estimated to be. Contact info is never touched at any level.
 */
export function applyDeeperTrim(resume: Resume, level: number, job?: JobAnalysis): Resume {
  const r: Resume = JSON.parse(JSON.stringify(resume));

  if (level === 0) {
    if (r.summary) r.summary = firstSentences(r.summary, 2);
    r.experience = r.experience.map((exp) => ({
      ...exp,
      bullets: sortByRelevance(exp.bullets, (b) => b, job).slice(0, 3),
    }));
    r.projects = r.projects.map((p) => ({ ...p, bullets: p.bullets.slice(0, 2) }));
    if (r.skills.length > 5) {
      r.skills = sortByRelevance(r.skills, (s) => s.items.join(" "), job).slice(0, 5);
    }
    return r;
  }

  if (level === 1) {
    if (r.summary) r.summary = firstSentences(r.summary, 1);
    r.experience = r.experience.slice(0, 4).map((exp, i) => ({
      ...exp,
      bullets: sortByRelevance(exp.bullets, (b) => b, job).slice(0, i === 0 ? 3 : 2),
    }));
    if (r.projects.length > 1) {
      r.projects = sortByRelevance(r.projects, (p) => p.bullets.join(" "), job).slice(0, 1);
    }
    r.projects = r.projects.map((p) => ({ ...p, bullets: p.bullets.slice(0, 2) }));
    if (r.skills.length > 4) {
      r.skills = sortByRelevance(r.skills, (s) => s.items.join(" "), job).slice(0, 4);
    }
    return r;
  }

  if (level === 2) {
    r.summary = "";
    r.experience = r.experience.slice(0, 3).map((exp, i) => ({
      ...exp,
      bullets: sortByRelevance(exp.bullets, (b) => b, job).slice(0, i === 0 ? 3 : 2),
    }));
    r.projects = [];
    r.skills = sortByRelevance(r.skills, (s) => s.items.join(" "), job)
      .slice(0, 3)
      .map((s) => ({ ...s, items: s.items.slice(0, 8) }));
    if (r.certifications.length > 3) r.certifications = r.certifications.slice(0, 3);
    return r;
  }

  if (level === 3) {
    r.summary = "";
    r.experience = r.experience.slice(0, 2).map((exp) => ({
      ...exp,
      bullets: sortByRelevance(exp.bullets, (b) => b, job).slice(0, 2),
    }));
    r.projects = [];
    r.skills = sortByRelevance(r.skills, (s) => s.items.join(" "), job)
      .slice(0, 2)
      .map((s) => ({ ...s, items: s.items.slice(0, 6) }));
    if (r.certifications.length > 2) r.certifications = r.certifications.slice(0, 2);
    if (r.education.length > 1) r.education = r.education.slice(0, 1);
    return r;
  }

  // Last resort: hard character caps on remaining bullet text.
  r.summary = "";
  r.experience = r.experience.slice(0, 2).map((exp) => ({
    ...exp,
    bullets: exp.bullets.slice(0, 2).map((b) => (b.length > 130 ? b.slice(0, 127) + "..." : b)),
  }));
  r.projects = [];
  r.skills = r.skills.slice(0, 2).map((s) => ({ ...s, items: s.items.slice(0, 5) }));
  r.certifications = r.certifications.slice(0, 1);
  r.education = r.education.slice(0, 1);
  return r;
}

export const MAX_TRIM_LEVEL = 4;

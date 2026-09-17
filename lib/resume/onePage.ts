import { Resume } from "@/types/resume";
import { PageFitResult } from "@/types/ats";
import { JobAnalysis } from "@/types/job";
import { stemmedTokenSet } from "@/lib/text/normalize";

/**
 * Estimates how many wrapped text lines the resume will occupy on a US
 * Letter page, given a body font size. This mirrors the character-per-line
 * math of a real one-page layout closely enough to drive trimming decisions
 * without needing a full headless-browser render on every keystroke.
 */
export function charsPerLine(fontSizePt: number): number {
  // Roughly calibrated for ~6.5in of usable width (0.5in margins) in a
  // standard sans/serif ATS-safe font.
  const usableWidthIn = 6.5;
  const avgCharWidthIn = fontSizePt * 0.0092; // empirical average for Arial/Georgia
  return Math.floor(usableWidthIn / avgCharWidthIn);
}

export function maxLinesForOnePage(fontSizePt: number, marginIn = 0.5): number {
  const usableHeightIn = 11 - marginIn * 2;
  const lineHeightIn = (fontSizePt * 1.28) / 72;
  return Math.floor(usableHeightIn / lineHeightIn);
}

function linesFor(text: string, cpl: number): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / cpl));
}

export function estimateResumeLines(resume: Resume, fontSizePt = 10): number {
  const cpl = charsPerLine(fontSizePt);
  let lines = 0;

  // Header block: name, title, contact line.
  lines += 1; // name
  if (resume.personalInfo.title) lines += 1;
  lines += 1; // contact line
  lines += 1; // spacing/rule

  if (resume.summary) {
    lines += linesFor(resume.summary, cpl) + 1; // + heading
  }

  if (resume.experience.length > 0) {
    lines += 1; // "Experience" heading
    for (const exp of resume.experience) {
      lines += 1; // company/title/dates line
      for (const bullet of exp.bullets) lines += linesFor("• " + bullet, cpl);
    }
  }

  if (resume.skills.length > 0) {
    lines += 1; // heading
    for (const cat of resume.skills) {
      lines += linesFor(`${cat.category}: ${cat.items.join(", ")}`, cpl);
    }
  }

  if (resume.projects.length > 0) {
    lines += 1;
    for (const p of resume.projects) {
      lines += 1;
      for (const bullet of p.bullets) lines += linesFor("• " + bullet, cpl);
    }
  }

  if (resume.education.length > 0) {
    lines += 1;
    lines += resume.education.length; // one line each, typically
  }

  if (resume.certifications.length > 0) {
    lines += 1;
    lines += Math.ceil(resume.certifications.length / 2);
  }

  return lines;
}

export function checkPageFit(resume: Resume, fontSizePt = 10): PageFitResult {
  const estimatedLines = estimateResumeLines(resume, fontSizePt);
  const maxLines = maxLinesForOnePage(fontSizePt);
  return {
    fits: estimatedLines <= maxLines,
    estimatedLines,
    maxLines,
    overflowBy: Math.max(0, estimatedLines - maxLines),
  };
}

function relevanceScore(text: string, job?: JobAnalysis): number {
  if (!job) return 0;
  const jobTokens = new Set<string>();
  for (const term of job.keywords) for (const t of stemmedTokenSet(term)) jobTokens.add(t);
  const textTokens = stemmedTokenSet(text);
  let overlap = 0;
  for (const t of textTokens) if (jobTokens.has(t)) overlap++;
  return overlap;
}

export type TrimStep = { action: string };

/**
 * Iteratively trims the resume toward a one-page fit, following the
 * priority order described in the product spec: keep required-skill
 * evidence, quantified achievements, and contact info; cut generic or
 * low-relevance content first. Never removes contact info or all of
 * education/certifications.
 */
export function autoFitOnePage(
  resume: Resume,
  job: JobAnalysis | undefined,
  fontSizePt = 10
): { resume: Resume; steps: TrimStep[]; fit: PageFitResult } {
  let working: Resume = JSON.parse(JSON.stringify(resume));
  const steps: TrimStep[] = [];

  let fit = checkPageFit(working, fontSizePt);
  if (fit.fits) return { resume: working, steps, fit };

  // Step 1: cap summary to ~2 sentences.
  if (working.summary && working.summary.split(/(?<=[.!?])\s+/).length > 2) {
    const sentences = working.summary.split(/(?<=[.!?])\s+/);
    working.summary = sentences.slice(0, 2).join(" ");
    steps.push({ action: "Shortened summary to 2 sentences" });
    fit = checkPageFit(working, fontSizePt);
    if (fit.fits) return { resume: working, steps, fit };
  }

  // Step 2: rank experience bullets by job relevance, cap older/less
  // relevant roles to fewer bullets first.
  const rolesByRecency = [...working.experience].reverse(); // oldest first
  for (const role of rolesByRecency) {
    if (fit.fits) break;
    if (role.bullets.length > 3) {
      const ranked = [...role.bullets].sort((a, b) => relevanceScore(b, job) - relevanceScore(a, job));
      role.bullets = ranked.slice(0, 3);
      steps.push({ action: `Reduced bullets for ${role.company || role.title} to the 3 most relevant` });
      fit = checkPageFit(working, fontSizePt);
    }
  }

  // Step 3: drop least-relevant project bullets, then least-relevant projects (keep at least 1 if any existed).
  if (!fit.fits && working.projects.length > 0) {
    for (const p of working.projects) {
      if (p.bullets.length > 2) {
        const ranked = [...p.bullets].sort((a, b) => relevanceScore(b, job) - relevanceScore(a, job));
        p.bullets = ranked.slice(0, 2);
      }
    }
    steps.push({ action: "Trimmed project bullets to the 2 most relevant per project" });
    fit = checkPageFit(working, fontSizePt);

    if (!fit.fits && working.projects.length > 1) {
      const ranked = [...working.projects].sort(
        (a, b) => relevanceScore(b.bullets.join(" "), job) - relevanceScore(a.bullets.join(" "), job)
      );
      working.projects = ranked.slice(0, 1);
      steps.push({ action: "Kept only the most relevant project" });
      fit = checkPageFit(working, fontSizePt);
    }
  }

  // Step 4: cap all experience bullets to 2 (except most recent role) as a last resort.
  if (!fit.fits) {
    working.experience.forEach((role, idx) => {
      const isMostRecent = idx === 0;
      const cap = isMostRecent ? 3 : 2;
      if (role.bullets.length > cap) {
        const ranked = [...role.bullets].sort((a, b) => relevanceScore(b, job) - relevanceScore(a, job));
        role.bullets = ranked.slice(0, cap);
      }
    });
    steps.push({ action: "Reduced remaining roles to their strongest bullets" });
    fit = checkPageFit(working, fontSizePt);
  }

  // Step 5: trim lowest-relevance skill categories if still overflowing.
  if (!fit.fits && working.skills.length > 3) {
    const ranked = [...working.skills].sort(
      (a, b) => relevanceScore(b.items.join(" "), job) - relevanceScore(a.items.join(" "), job)
    );
    working.skills = ranked.slice(0, Math.max(3, ranked.length - 1));
    steps.push({ action: "Removed the lowest-priority skills category" });
    fit = checkPageFit(working, fontSizePt);
  }

  return { resume: working, steps, fit };
}

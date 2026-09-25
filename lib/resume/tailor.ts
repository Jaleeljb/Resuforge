import { Resume, SkillCategory, Experience, Project } from "@/types/resume";
import { JobAnalysis } from "@/types/job";
import { DICTIONARY } from "@/lib/domain/dictionary";
import { normalize, stemmedTokenSet, indexOfPhrase } from "@/lib/text/normalize";
import { autoFitOnePage } from "@/lib/resume/onePage";

export type TailorChangeNote = { field: string; note: string };

export type TailorResult = {
  resume: Resume;
  changeNotes: TailorChangeNote[];
  pageFitSteps: string[];
};

/**
 * Aligns terminology in `text` toward the phrasing the target job uses,
 * WITHOUT introducing any new claim: it only swaps between synonyms of the
 * same dictionary concept that the text already expresses.
 *
 * Example: resume says "risk analysis"; job requires "Security Risk
 * Assessment" (whose synonym list includes "security risk analysis").
 * Because "risk analysis" and "security risk analysis" describe the same
 * concept and the resume already demonstrates it, we may naturally expand
 * the phrase — but we never insert a concept absent from the source text.
 */
function isAcronymLike(phrase: string): boolean {
  const trimmed = phrase.trim();
  return trimmed.length <= 6 && !trimmed.includes(" ") && trimmed === trimmed.toUpperCase() && /^[A-Z0-9&/+.-]+$/.test(trimmed);
}

export function alignTerminology(text: string, requiredTerms: string[]): { text: string; swapped: string[] } {
  let result = text;
  const swapped: string[] = [];
  const requiredSet = new Set(requiredTerms.map((t) => t.toLowerCase()));

  for (const entry of DICTIONARY) {
    if (!requiredSet.has(entry.canonical.toLowerCase())) continue;
    const phrases = [entry.canonical, ...entry.synonyms];

    for (const shortPhrase of phrases) {
      // Skip short acronyms (SIEM, AWS, MFA...) as the *source* phrase —
      // expanding a well-known acronym into a longer synonym reads oddly
      // and isn't a meaningful terminology alignment.
      if (isAcronymLike(shortPhrase)) continue;

      const shortWords = shortPhrase.trim().split(/\s+/);
      const idx = indexOfPhrase(result, shortPhrase);
      if (idx === -1) continue;

      // Find a longer synonym of the SAME entry that is a natural
      // superset (adds at most 2 extra words) of this shorter phrase.
      const longer = phrases
        .filter((p) => p !== shortPhrase)
        .map((p) => ({ phrase: p, words: p.trim().split(/\s+/) }))
        .filter((p) => {
          const extra = p.words.length - shortWords.length;
          if (extra <= 0 || extra > 2) return false;
          const shortTokens = new Set(shortWords.map((w) => w.toLowerCase()));
          const longTokens = p.words.map((w) => w.toLowerCase());
          return shortWords.every((w) => longTokens.includes(w.toLowerCase())) && shortTokens.size > 0;
        })
        .sort((a, b) => a.words.length - b.words.length)[0];

      if (longer) {
        const found = result.slice(idx, idx + shortPhrase.length);
        const capitalized = /^[A-Z]/.test(found);
        const replacement = capitalized
          ? longer.phrase.charAt(0).toUpperCase() + longer.phrase.slice(1)
          : longer.phrase;
        result = result.slice(0, idx) + replacement + result.slice(idx + shortPhrase.length);
        swapped.push(`${found} → ${replacement}`);
        break; // one alignment per dictionary entry per text is enough
      }
    }
  }

  return { text: result, swapped };
}

function relevanceOf(text: string, jobTokenSet: Set<string>): number {
  const tokens = stemmedTokenSet(text);
  let score = 0;
  for (const t of tokens) if (jobTokenSet.has(t)) score++;
  return score;
}

function buildJobTokenSet(job: JobAnalysis): Set<string> {
  const set = new Set<string>();
  for (const term of job.keywords) for (const t of stemmedTokenSet(term)) set.add(t);
  for (const term of job.responsibilities) for (const t of stemmedTokenSet(term)) set.add(t);
  return set;
}

function tailorSummary(resume: Resume, job: JobAnalysis, requiredTerms: string[]): { summary: string; note?: TailorChangeNote } {
  const base = resume.summary?.trim();
  if (!base) return { summary: "" };

  const { text, swapped } = alignTerminology(base, requiredTerms);
  const note: TailorChangeNote | undefined =
    swapped.length > 0
      ? { field: "Summary", note: `Aligned terminology with the job description: ${swapped.join("; ")}` }
      : undefined;
  return { summary: text, note };
}

function tailorExperience(resume: Resume, job: JobAnalysis, requiredTerms: string[]): { experience: Experience[]; notes: TailorChangeNote[] } {
  const jobTokens = buildJobTokenSet(job);
  const notes: TailorChangeNote[] = [];

  const experience = resume.experience.map((exp) => {
    const rewrittenBullets = exp.bullets.map((b) => {
      const { text, swapped } = alignTerminology(b, requiredTerms);
      if (swapped.length > 0) {
        notes.push({ field: `Experience: ${exp.company || exp.title}`, note: `Aligned terminology: ${swapped.join("; ")}` });
      }
      return text;
    });

    // Reorder bullets within the role by relevance to the target job,
    // preserving the role's dates/company/title (facts are never touched).
    const ordered = [...rewrittenBullets].sort((a, b) => relevanceOf(b, jobTokens) - relevanceOf(a, jobTokens));
    if (JSON.stringify(ordered) !== JSON.stringify(rewrittenBullets)) {
      notes.push({ field: `Experience: ${exp.company || exp.title}`, note: "Reordered bullets to lead with the most job-relevant points" });
    }

    return { ...exp, bullets: ordered };
  });

  return { experience, notes };
}

/**
 * Projects previously went untouched by tailoring — only Experience got
 * terminology alignment and relevance-based bullet ordering. A candidate's
 * project work is just as valid evidence for a job requirement as their
 * work experience, so it deserves the exact same (non-fabricating) pass:
 * only re-phrase toward synonyms the bullet already expresses, and lead
 * with whichever bullets are most relevant to this job.
 */
function tailorProjects(resume: Resume, job: JobAnalysis, requiredTerms: string[]): { projects: Project[]; notes: TailorChangeNote[] } {
  const jobTokens = buildJobTokenSet(job);
  const notes: TailorChangeNote[] = [];

  const projects = resume.projects.map((proj) => {
    const rewrittenBullets = proj.bullets.map((b) => {
      const { text, swapped } = alignTerminology(b, requiredTerms);
      if (swapped.length > 0) {
        notes.push({ field: `Projects: ${proj.name}`, note: `Aligned terminology: ${swapped.join("; ")}` });
      }
      return text;
    });

    const ordered = [...rewrittenBullets].sort((a, b) => relevanceOf(b, jobTokens) - relevanceOf(a, jobTokens));
    if (JSON.stringify(ordered) !== JSON.stringify(rewrittenBullets)) {
      notes.push({ field: `Projects: ${proj.name}`, note: "Reordered bullets to lead with the most job-relevant points" });
    }

    return { ...proj, bullets: ordered };
  });

  return { projects, notes };
}

function tailorSkills(resume: Resume, job: JobAnalysis): { skills: SkillCategory[]; note?: TailorChangeNote } {
  const targetSkills = new Set([...job.requiredSkills, ...job.preferredSkills, ...job.technicalSkills].map((s) => s.toLowerCase()));

  const scored = resume.skills.map((cat) => {
    const matchCount = cat.items.filter((i) => targetSkills.has(i.toLowerCase())).length;
    const items = [...cat.items].sort((a, b) => {
      const aMatch = targetSkills.has(a.toLowerCase()) ? 1 : 0;
      const bMatch = targetSkills.has(b.toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    });
    return { cat: { ...cat, items }, matchCount };
  });

  scored.sort((a, b) => b.matchCount - a.matchCount);
  const skills = scored.map((s) => s.cat);

  const reordered = JSON.stringify(skills.map((s) => s.category)) !== JSON.stringify(resume.skills.map((s) => s.category));
  return {
    skills,
    note: reordered ? { field: "Skills", note: "Reordered skill categories and items to surface job-relevant skills first" } : undefined,
  };
}

export function tailorResume(resume: Resume, job: JobAnalysis): TailorResult {
  const requiredTerms = [...job.requiredSkills, ...job.preferredSkills];
  const changeNotes: TailorChangeNote[] = [];

  const { summary, note: summaryNote } = tailorSummary(resume, job, requiredTerms);
  if (summaryNote) changeNotes.push(summaryNote);

  const { experience, notes: expNotes } = tailorExperience(resume, job, requiredTerms);
  changeNotes.push(...expNotes);

  const { projects, notes: projectNotes } = tailorProjects(resume, job, requiredTerms);
  changeNotes.push(...projectNotes);

  const { skills, note: skillsNote } = tailorSkills(resume, job);
  if (skillsNote) changeNotes.push(skillsNote);

  let tailored: Resume = {
    ...resume,
    personalInfo: { ...resume.personalInfo, title: job.jobTitle || resume.personalInfo.title },
    summary,
    experience,
    projects,
    skills,
  };

  const { resume: fitted, steps } = autoFitOnePage(tailored, job);
  tailored = fitted;

  return {
    resume: tailored,
    changeNotes,
    pageFitSteps: steps.map((s) => s.action),
  };
}

// Re-exported so callers don't need to import the normalize helper directly.
export { normalize };

import { Resume } from "@/types/resume";
import { JobAnalysis } from "@/types/job";
import {
  ATSScoreResult,
  KeywordMatch,
  ScoreComponent,
  ScoreExplanationLine,
  ScoreWeights,
  DEFAULT_WEIGHTS,
} from "@/types/ats";
import { matchKeywords, matchEducationRequirements } from "@/lib/ats/keywordMatch";
import { ACTION_VERBS, GENERIC_FILLER_PHRASES } from "@/lib/domain/dictionary";
import { stemmedTokenSet, tokenize } from "@/lib/text/normalize";

const STANDARD_HEADINGS = ["summary", "experience", "skills", "education"];

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((n / d) * 100)));
}

function keywordCoverageComponent(matches: KeywordMatch[]): ScoreComponent {
  const relevant = matches.filter((m) => m.requirementLevel === "required" || m.requirementLevel === "preferred");
  const weightOf = (m: KeywordMatch) => (m.requirementLevel === "required" ? 2 : 1);
  const credit = (m: KeywordMatch) => (m.status === "matched" ? 1 : m.status === "partial" ? 0.5 : m.status === "weak-evidence" ? 0.25 : 0);

  const totalWeight = relevant.reduce((s, m) => s + weightOf(m), 0);
  const earned = relevant.reduce((s, m) => s + weightOf(m) * credit(m), 0);
  const rawPercent = totalWeight > 0 ? pct(earned, totalWeight) : 100;

  const matchedCount = relevant.filter((m) => m.status === "matched").length;
  const missingCount = relevant.filter((m) => m.status === "missing").length;

  const notes = [
    `${matchedCount} of ${relevant.length} required/preferred keywords matched`,
    ...(missingCount > 0 ? [`${missingCount} keyword${missingCount === 1 ? "" : "s"} missing entirely`] : []),
  ];

  return {
    key: "keywordCoverage",
    label: "Keyword Coverage",
    weight: 0,
    rawPercent,
    weightedPoints: 0,
    notes,
  };
}

function requiredSkillsComponent(matches: KeywordMatch[]): ScoreComponent {
  const required = matches.filter((m) => m.requirementLevel === "required");
  const matched = required.filter((m) => m.status === "matched" || m.status === "partial").length;
  const rawPercent = required.length > 0 ? pct(matched, required.length) : 100;
  return {
    key: "requiredSkillsMatch",
    label: "Required Skills Match",
    weight: 0,
    rawPercent,
    weightedPoints: 0,
    notes: [`${matched} of ${required.length} required skills supported by resume evidence`],
  };
}

function experienceRelevanceComponent(resume: Resume, matches: KeywordMatch[]): ScoreComponent {
  const expMatches = matches.filter((m) => m.evidence?.startsWith("Experience"));
  const relevant = matches.filter((m) => m.requirementLevel === "required" || m.requirementLevel === "preferred");
  const matchedInExperience = relevant.filter((m) => m.evidence?.startsWith("Experience") && (m.status === "matched" || m.status === "partial")).length;

  const hasExperience = resume.experience.length > 0;
  const rawPercent = !hasExperience ? 0 : relevant.length > 0 ? pct(matchedInExperience, relevant.length) : 60;

  const notes = !hasExperience
    ? ["No work experience entries found in resume"]
    : [`${matchedInExperience} of ${relevant.length} priority requirements are backed by work experience (not only a skills list)`];

  void expMatches;
  return {
    key: "experienceRelevance",
    label: "Experience Relevance",
    weight: 0,
    rawPercent,
    weightedPoints: 0,
    notes,
  };
}

function achievementEvidenceComponent(resume: Resume): ScoreComponent {
  const allBullets = [
    ...resume.experience.flatMap((e) => e.bullets),
    ...resume.projects.flatMap((p) => p.bullets),
  ];
  if (allBullets.length === 0) {
    return { key: "achievementEvidence", label: "Achievement Evidence", weight: 0, rawPercent: 0, weightedPoints: 0, notes: ["No experience or project bullets to evaluate"] };
  }
  const quantified = allBullets.filter((b) => /\d/.test(b)).length;
  const rawPercent = pct(quantified, allBullets.length);
  return {
    key: "achievementEvidence",
    label: "Achievement Evidence",
    weight: 0,
    rawPercent,
    weightedPoints: 0,
    notes: [`${quantified} of ${allBullets.length} bullets include a quantified metric or number`],
  };
}

function roleAlignmentComponent(resume: Resume, job: JobAnalysis): ScoreComponent {
  const targetTokens = stemmedTokenSet(job.jobTitle);
  const candidateTitles = [resume.personalInfo.title, ...resume.experience.map((e) => e.title)].filter(Boolean) as string[];

  if (targetTokens.size === 0 || candidateTitles.length === 0) {
    return { key: "roleAlignment", label: "Job Title / Role Alignment", weight: 0, rawPercent: 50, weightedPoints: 0, notes: ["Not enough title information to compare"] };
  }

  let bestRatio = 0;
  let bestTitle = "";
  for (const title of candidateTitles) {
    const tTokens = stemmedTokenSet(title);
    let overlap = 0;
    for (const t of targetTokens) if (tTokens.has(t)) overlap++;
    const ratio = overlap / targetTokens.size;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestTitle = title;
    }
  }

  const rawPercent = pct(bestRatio * 100, 100);
  return {
    key: "roleAlignment",
    label: "Job Title / Role Alignment",
    weight: 0,
    rawPercent,
    weightedPoints: 0,
    notes: bestTitle ? [`Closest resume title: "${bestTitle}" vs target "${job.jobTitle}"`] : [`No resume title closely matches "${job.jobTitle}"`],
  };
}

function skillsAlignmentComponent(resume: Resume, job: JobAnalysis): ScoreComponent {
  const skillItems = resume.skills.flatMap((s) => s.items.map((i) => i.toLowerCase()));
  const targetSkills = [...job.requiredSkills, ...job.preferredSkills];
  if (targetSkills.length === 0) {
    return { key: "skillsAlignment", label: "Skills Section Alignment", weight: 0, rawPercent: 70, weightedPoints: 0, notes: ["No specific skills extracted from job description"] };
  }
  const matched = targetSkills.filter((s) => skillItems.some((item) => item.includes(s.toLowerCase()) || s.toLowerCase().includes(item))).length;
  const rawPercent = pct(matched, targetSkills.length);
  return {
    key: "skillsAlignment",
    label: "Skills Section Alignment",
    weight: 0,
    rawPercent,
    weightedPoints: 0,
    notes: [`${matched} of ${targetSkills.length} target skills appear explicitly in your Skills section`],
  };
}

function atsParseabilityComponent(resume: Resume): ScoreComponent {
  const checks: { pass: boolean; note: string }[] = [
    { pass: !!resume.personalInfo.name, note: "Name present" },
    { pass: !!(resume.personalInfo.email || resume.personalInfo.phone), note: "Contact info present" },
    { pass: resume.experience.length > 0, note: "Experience section present" },
    { pass: resume.skills.length > 0, note: "Skills section present" },
    { pass: resume.education.length > 0, note: "Education section present" },
    { pass: resume.experience.every((e) => e.bullets.length <= 6), note: "Bullet counts per role are reasonable" },
    { pass: resume.experience.every((e) => e.bullets.every((b) => b.length <= 220)), note: "Bullets are not excessively long" },
  ];
  const passed = checks.filter((c) => c.pass).length;
  const rawPercent = pct(passed, checks.length);
  const failing = checks.filter((c) => !c.pass).map((c) => `Missing/weak: ${c.note}`);
  return {
    key: "atsParseability",
    label: "ATS Parseability",
    weight: 0,
    rawPercent,
    weightedPoints: 0,
    notes: failing.length > 0 ? failing : ["Standard sections, simple structure, and reasonable bullet lengths detected"],
  };
}

function contentQualityComponent(resume: Resume): ScoreComponent {
  const allBullets = [...resume.experience.flatMap((e) => e.bullets), ...resume.projects.flatMap((p) => p.bullets)];
  if (allBullets.length === 0) {
    return { key: "contentQuality", label: "Content Quality", weight: 0, rawPercent: 50, weightedPoints: 0, notes: ["No bullets to evaluate yet"] };
  }

  const startsWithVerb = allBullets.filter((b) => {
    const first = tokenize(b)[0];
    return first && ACTION_VERBS.includes(first);
  }).length;

  const seen = new Set<string>();
  let duplicates = 0;
  for (const b of allBullets) {
    const key = b.trim().toLowerCase();
    if (seen.has(key)) duplicates++;
    seen.add(key);
  }

  const fullText = [resume.summary || "", ...allBullets].join(" ").toLowerCase();
  const hasFiller = GENERIC_FILLER_PHRASES.some((f) => fullText.includes(f));

  let rawPercent = pct(startsWithVerb, allBullets.length);
  const notes = [`${startsWithVerb} of ${allBullets.length} bullets open with a strong action verb`];
  if (duplicates > 0) {
    rawPercent = Math.max(0, rawPercent - duplicates * 5);
    notes.push(`${duplicates} duplicate or near-duplicate bullet${duplicates === 1 ? "" : "s"} found`);
  }
  if (hasFiller) {
    rawPercent = Math.max(0, rawPercent - 10);
    notes.push("Generic filler language detected (e.g. \"team player\") — consider replacing with specific evidence");
  }

  return { key: "contentQuality", label: "Content Quality", weight: 0, rawPercent, weightedPoints: 0, notes };
}

function bandFor(overall: number): { band: ATSScoreResult["band"]; bandLabel: string } {
  if (overall >= 90) return { band: "very-strong", bandLabel: "Very strong alignment" };
  if (overall >= 75) return { band: "strong", bandLabel: "Strong alignment" };
  if (overall >= 60) return { band: "moderate", bandLabel: "Moderate alignment" };
  return { band: "needs-optimization", bandLabel: "Needs optimization" };
}

export function calculateATSScore(
  resume: Resume,
  job: JobAnalysis,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): ATSScoreResult {
  const keywordMatches = matchKeywords(resume, job);

  const components: ScoreComponent[] = [
    keywordCoverageComponent(keywordMatches),
    requiredSkillsComponent(keywordMatches),
    experienceRelevanceComponent(resume, keywordMatches),
    achievementEvidenceComponent(resume),
    roleAlignmentComponent(resume, job),
    skillsAlignmentComponent(resume, job),
    atsParseabilityComponent(resume),
    contentQualityComponent(resume),
  ].map((c) => {
    const weight = weights[c.key];
    return { ...c, weight, weightedPoints: Math.round(((c.rawPercent * weight) / 100) * 100) / 100 };
  });

  const overall = Math.round(components.reduce((s, c) => s + c.weightedPoints, 0));
  const { band, bandLabel } = bandFor(overall);

  const strongMatches = dedupe(
    keywordMatches.filter((m) => m.status === "matched").map((m) => m.keyword)
  );
  const partialKeywords = dedupe(
    keywordMatches.filter((m) => m.status === "partial" || m.status === "weak-evidence").map((m) => m.keyword)
  );
  const missingKeywords = dedupe(
    keywordMatches.filter((m) => m.status === "missing").map((m) => m.keyword)
  );

  const explanation = buildExplanation(components, strongMatches, missingKeywords, partialKeywords, job);
  const educationMatches = matchEducationRequirements(resume, job);

  return {
    overall,
    band,
    bandLabel,
    components,
    explanation,
    keywordMatches,
    missingKeywords,
    partialKeywords,
    strongMatches,
    educationMatches,
    calculatedAt: new Date().toISOString(),
  };
}

function buildExplanation(
  components: ScoreComponent[],
  strongMatches: string[],
  missingKeywords: string[],
  partialKeywords: string[],
  job: JobAnalysis
): ScoreExplanationLine[] {
  const lines: ScoreExplanationLine[] = [];

  for (const term of strongMatches.slice(0, 6)) {
    lines.push({ type: "positive", text: `Strong match on ${term}` });
  }
  for (const term of missingKeywords.slice(0, 6)) {
    lines.push({ type: "negative", text: `Missing ${term}` });
  }
  for (const term of partialKeywords.slice(0, 4)) {
    lines.push({ type: "negative", text: `Weak or partial evidence for ${term}` });
  }

  const weakestComponent = [...components].sort((a, b) => a.rawPercent - b.rawPercent)[0];
  if (weakestComponent && weakestComponent.rawPercent < 70) {
    lines.push({
      type: "suggestion",
      text: `${weakestComponent.label} is your biggest opportunity (${weakestComponent.rawPercent}%). ${weakestComponent.notes[0] ?? ""}`.trim(),
    });
  }

  if (job.actionVerbs.length > 0) {
    lines.push({
      type: "suggestion",
      text: `The job description emphasizes verbs like "${job.actionVerbs.slice(0, 3).join('", "')}" — mirror this language only where genuinely true of your experience.`,
    });
  }

  return lines;
}

function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

export { DEFAULT_WEIGHTS, STANDARD_HEADINGS };

/** Produces a short human-readable delta note between two score results,
 * used to power the "Score updated: 82 → 87" real-time UI feedback. */
export function explainScoreDelta(prev: ATSScoreResult | null, next: ATSScoreResult): string | null {
  if (!prev) return null;
  if (prev.overall === next.overall) return null;

  const newlyMatched = next.strongMatches.filter((k) => !prev.strongMatches.includes(k));
  const newlyMissing = next.missingKeywords.filter((k) => !prev.missingKeywords.includes(k));

  if (newlyMatched.length > 0) {
    return `Added evidence for ${newlyMatched.slice(0, 2).join(" and ")}.`;
  }
  if (newlyMissing.length > 0) {
    return `Lost evidence for ${newlyMissing.slice(0, 2).join(" and ")}.`;
  }
  const improved = next.overall > prev.overall;
  return improved ? "Content quality or structure improved." : "Content quality or structure regressed.";
}

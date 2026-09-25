export type MatchStatus = "matched" | "partial" | "missing" | "weak-evidence" | "unsupported";

export type KeywordMatch = {
  keyword: string;
  requirementLevel: "required" | "preferred" | "nice-to-have" | "contextual";
  status: MatchStatus;
  evidence?: string;
  matchType?: "exact" | "semantic" | "none";
};

export type ScoreWeights = {
  keywordCoverage: number;
  requiredSkillsMatch: number;
  experienceRelevance: number;
  achievementEvidence: number;
  roleAlignment: number;
  skillsAlignment: number;
  atsParseability: number;
  contentQuality: number;
};

export const DEFAULT_WEIGHTS: ScoreWeights = {
  keywordCoverage: 30,
  requiredSkillsMatch: 20,
  experienceRelevance: 20,
  achievementEvidence: 10,
  roleAlignment: 5,
  skillsAlignment: 5,
  atsParseability: 5,
  contentQuality: 5,
};

export type ScoreComponent = {
  key: keyof ScoreWeights;
  label: string;
  weight: number;
  rawPercent: number; // 0-100, before weighting
  weightedPoints: number; // rawPercent * weight/100
  notes: string[];
};

export type ScoreExplanationLine = {
  type: "positive" | "negative" | "suggestion";
  text: string;
};

/** A line from the job description's Education section (e.g. "Bachelor's
 * degree in Computer Science or related field") checked against the
 * resume's own Education entries. Unlike skill keywords, an unmet
 * education requirement is never something the app can "add" for the
 * candidate — it's surfaced so they can judge for themselves and, if it
 * genuinely applies, fix the wording of their own Education entry. */
export type EducationRequirementMatch = {
  requirement: string;
  met: boolean;
  evidence?: string;
};

export type ATSScoreResult = {
  overall: number; // 0-100
  band: "very-strong" | "strong" | "moderate" | "needs-optimization";
  bandLabel: string;
  components: ScoreComponent[];
  explanation: ScoreExplanationLine[];
  keywordMatches: KeywordMatch[];
  missingKeywords: string[];
  partialKeywords: string[];
  strongMatches: string[];
  educationMatches: EducationRequirementMatch[];
  calculatedAt: string;
};

export type ClaimValidation = {
  statement: string;
  supportedByResume: boolean;
  sourceEvidence?: string;
  confidence: number; // 0-1
  location: string; // e.g. "Experience: Acme Corp, bullet 2"
};

export type PageFitResult = {
  fits: boolean;
  estimatedLines: number;
  maxLines: number;
  overflowBy: number;
};

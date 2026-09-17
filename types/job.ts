export type RequirementLevel = "required" | "preferred" | "nice-to-have" | "contextual";

export type JobRequirement = {
  term: string;
  level: RequirementLevel;
};

export type JobAnalysis = {
  jobTitle: string;
  company?: string;
  seniority?: string;
  yearsOfExperience?: string;

  requiredSkills: string[];
  preferredSkills: string[];
  technicalSkills: string[];
  softSkills: string[];
  tools: string[];
  technologies: string[];
  frameworks: string[];
  certifications: string[];
  educationRequirements: string[];

  responsibilities: string[];
  keywords: string[];
  actionVerbs: string[];
  domainTerms: string[];
  hiddenSignals: string[];

  /** Every extracted term with its categorized importance level. */
  requirements: JobRequirement[];

  rawText: string;
};

import { z } from "zod";

// Optional string fields accept null as well as undefined and normalize
// both to undefined. Real-world data (a field a parser couldn't find, a
// value cleared in the UI, a round-trip through some client state) easily
// produces `null` rather than an absent key, and rejecting the whole
// request over that distinction is exactly the kind of technicality that
// turns into a confusing "something went wrong" for the user.
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((v) => v ?? undefined);

export const personalInfoSchema = z.object({
  name: z.string().max(200),
  title: optionalText(200),
  email: optionalText(200),
  phone: optionalText(60),
  location: optionalText(200),
  linkedin: optionalText(300),
  portfolio: optionalText(300),
});

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string().max(200),
  title: z.string().max(200),
  location: optionalText(200),
  startDate: optionalText(60),
  endDate: optionalText(60),
  // Generous on purpose: real-world pasted/parsed resume content sometimes
  // lands as one long unbulleted paragraph before a user has had a chance
  // to split it up in the editor. Rejecting it outright at the API layer
  // is worse than accepting it and letting the one-page fitting engine
  // (lib/export/fitOnePage.ts) trim/condense it later. See also
  // lib/resume/sanitize.ts, which applies a hard safety-net cap even above
  // this limit.
  bullets: z.array(z.string().max(4000).nullish().transform((v) => v ?? "")).max(40),
});

export const skillCategorySchema = z.object({
  id: z.string(),
  category: z.string().max(150),
  items: z.array(z.string().max(150).nullish().transform((v) => v ?? "")).max(100),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().max(300),
  url: optionalText(500),
  technologies: z.array(z.string().max(150).nullish().transform((v) => v ?? "")).max(50),
  bullets: z.array(z.string().max(4000).nullish().transform((v) => v ?? "")).max(40),
});

export const educationSchema = z.object({
  id: z.string(),
  degree: z.string().max(300),
  institution: z.string().max(300),
  location: optionalText(200),
  graduationDate: optionalText(60),
  details: z
    .array(z.string().max(500).nullish().transform((v) => v ?? ""))
    .max(20)
    .nullish()
    .transform((v) => v ?? undefined),
});

export const certificationSchema = z.object({
  id: z.string(),
  name: z.string().max(300),
  issuer: optionalText(300),
  date: optionalText(60),
});

export const resumeSchema = z.object({
  personalInfo: personalInfoSchema,
  summary: optionalText(6000),
  experience: z.array(experienceSchema).max(30),
  skills: z.array(skillCategorySchema).max(25),
  projects: z.array(projectSchema).max(20),
  education: z.array(educationSchema).max(15),
  certifications: z.array(certificationSchema).max(30),
});

export const analyzeJobRequestSchema = z.object({
  jobDescription: z.string().min(20, "Job description looks too short to analyze.").max(20000),
});

export const jobRequirementSchema = z.object({
  term: z.string(),
  level: z.enum(["required", "preferred", "nice-to-have", "contextual"]),
});

export const jobAnalysisSchema = z.object({
  jobTitle: z.string(),
  company: optionalText(300),
  seniority: optionalText(100),
  yearsOfExperience: optionalText(60),
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  technicalSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  tools: z.array(z.string()),
  technologies: z.array(z.string()),
  frameworks: z.array(z.string()),
  certifications: z.array(z.string()),
  educationRequirements: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keywords: z.array(z.string()),
  actionVerbs: z.array(z.string()),
  domainTerms: z.array(z.string()),
  hiddenSignals: z.array(z.string()),
  requirements: z.array(jobRequirementSchema),
  rawText: z.string(),
});

export const tailorRequestSchema = z.object({
  resume: resumeSchema,
  job: jobAnalysisSchema,
});

export const scoreRequestSchema = z.object({
  resume: resumeSchema,
  job: jobAnalysisSchema,
  weights: z
    .object({
      keywordCoverage: z.number(),
      requiredSkillsMatch: z.number(),
      experienceRelevance: z.number(),
      achievementEvidence: z.number(),
      roleAlignment: z.number(),
      skillsAlignment: z.number(),
      atsParseability: z.number(),
      contentQuality: z.number(),
    })
    .optional(),
});

export const validateClaimsRequestSchema = z.object({
  current: resumeSchema,
  original: resumeSchema,
  confirmedTerms: z.array(z.string()).optional(),
});

export const exportRequestSchema = z.object({
  resume: resumeSchema,
  template: z.enum(["classic", "modern-ats", "compact-technical"]).default("classic"),
  job: jobAnalysisSchema.optional(),
});

export const fitResumeRequestSchema = z.object({
  resume: resumeSchema,
  job: jobAnalysisSchema.optional(),
  template: z.enum(["classic", "modern-ats", "compact-technical"]).default("classic"),
});

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_UPLOAD_MIME = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

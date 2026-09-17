import { z } from "zod";

export const personalInfoSchema = z.object({
  name: z.string().max(200),
  title: z.string().max(200).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().max(60).optional(),
  location: z.string().max(200).optional(),
  linkedin: z.string().max(300).optional(),
  portfolio: z.string().max(300).optional(),
});

export const experienceSchema = z.object({
  id: z.string(),
  company: z.string().max(200),
  title: z.string().max(200),
  location: z.string().max(200).optional(),
  startDate: z.string().max(60).optional(),
  endDate: z.string().max(60).optional(),
  bullets: z.array(z.string().max(500)).max(20),
});

export const skillCategorySchema = z.object({
  id: z.string(),
  category: z.string().max(100),
  items: z.array(z.string().max(100)).max(60),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  url: z.string().max(300).optional(),
  technologies: z.array(z.string().max(100)).max(30),
  bullets: z.array(z.string().max(500)).max(20),
});

export const educationSchema = z.object({
  id: z.string(),
  degree: z.string().max(200),
  institution: z.string().max(200),
  location: z.string().max(200).optional(),
  graduationDate: z.string().max(60).optional(),
  details: z.array(z.string().max(300)).max(10).optional(),
});

export const certificationSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  issuer: z.string().max(200).optional(),
  date: z.string().max(60).optional(),
});

export const resumeSchema = z.object({
  personalInfo: personalInfoSchema,
  summary: z.string().max(2000).optional(),
  experience: z.array(experienceSchema).max(15),
  skills: z.array(skillCategorySchema).max(15),
  projects: z.array(projectSchema).max(10),
  education: z.array(educationSchema).max(10),
  certifications: z.array(certificationSchema).max(20),
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
  company: z.string().optional(),
  seniority: z.string().optional(),
  yearsOfExperience: z.string().optional(),
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

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_UPLOAD_MIME = [
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

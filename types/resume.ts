export type PersonalInfo = {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
};

export type Experience = {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
};

export type SkillCategory = {
  id: string;
  category: string;
  items: string[];
};

export type Project = {
  id: string;
  name: string;
  url?: string;
  technologies: string[];
  bullets: string[];
};

export type Education = {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  graduationDate?: string;
  details?: string[];
};

export type Certification = {
  id: string;
  name: string;
  issuer?: string;
  date?: string;
};

export type Resume = {
  personalInfo: PersonalInfo;
  summary?: string;
  experience: Experience[];
  skills: SkillCategory[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
};

export type TemplateId = "classic" | "modern-ats" | "compact-technical";

/** A saved point-in-time snapshot of a tailored resume. */
export type ResumeVersion = {
  id: string;
  label: string;
  createdAt: string;
  resume: Resume;
  score: number | null;
  jobTitle?: string;
};

export function emptyResume(): Resume {
  return {
    personalInfo: { name: "" },
    summary: "",
    experience: [],
    skills: [],
    projects: [],
    education: [],
    certifications: [],
  };
}

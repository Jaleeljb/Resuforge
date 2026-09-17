import { Resume } from "@/types/resume";
import { ClaimValidation } from "@/types/ats";
import { checkPageFit } from "@/lib/resume/onePage";

export type ExportIssue = { code: string; message: string; severity: "blocking" | "warning" };

export function validateRequiredSections(resume: Resume): ExportIssue[] {
  const issues: ExportIssue[] = [];
  if (!resume.personalInfo.name || resume.personalInfo.name.trim().length === 0) {
    issues.push({ code: "missing-name", message: "Your resume is missing a name.", severity: "blocking" });
  }
  if (!resume.personalInfo.email && !resume.personalInfo.phone) {
    issues.push({ code: "missing-contact", message: "Add an email or phone number so employers can reach you.", severity: "blocking" });
  }
  if (resume.experience.length === 0 && resume.projects.length === 0) {
    issues.push({ code: "missing-experience", message: "Add at least one experience or project entry.", severity: "warning" });
  }
  if (resume.education.length === 0) {
    issues.push({ code: "missing-education", message: "No education entries found.", severity: "warning" });
  }
  return issues;
}

export function validatePageFit(resume: Resume, fontSizePt = 10): ExportIssue[] {
  const fit = checkPageFit(resume, fontSizePt);
  if (fit.fits) return [];
  return [
    {
      code: "overflow",
      message: `Resume content is estimated to exceed one page by about ${fit.overflowBy} line(s) even after automatic trimming.`,
      severity: "warning",
    },
  ];
}

export function validateUnsupportedClaims(claims: ClaimValidation[]): ExportIssue[] {
  return claims.map((c) => ({
    code: "unsupported-claim",
    message: `Potential unsupported claim: ${c.location}`,
    severity: "warning" as const,
  }));
}

export function validateForExport(resume: Resume, claims: ClaimValidation[] = []): ExportIssue[] {
  return [
    ...validateRequiredSections(resume),
    ...validatePageFit(resume),
    ...validateUnsupportedClaims(claims),
  ];
}

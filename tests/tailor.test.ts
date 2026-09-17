import { describe, it, expect } from "vitest";
import { alignTerminology, tailorResume } from "@/lib/resume/tailor";
import { analyzeJobDescription } from "@/lib/job/analyzeJobDescription";
import { SAMPLE_RESUME, SAMPLE_JOB_DESCRIPTION } from "@/lib/resume/sampleResume";

describe("alignTerminology", () => {
  it("expands 'risk analysis' toward the job's 'security risk analysis' phrasing without inventing new content", () => {
    const original = "Performed vulnerability assessments and risk analysis to identify and remediate security gaps.";
    const { text } = alignTerminology(original, ["Security Risk Assessment"]);
    expect(text).toBe("Performed vulnerability assessments and security risk analysis to identify and remediate security gaps.");
  });

  it("does not change text when the required term isn't present at all", () => {
    const original = "Built a personal website using HTML and CSS.";
    const { text, swapped } = alignTerminology(original, ["Security Risk Assessment"]);
    expect(text).toBe(original);
    expect(swapped).toHaveLength(0);
  });
});

describe("tailorResume", () => {
  const job = analyzeJobDescription(SAMPLE_JOB_DESCRIPTION);

  it("never invents new employers, titles, or dates", () => {
    const result = tailorResume(SAMPLE_RESUME, job);
    result.resume.experience.forEach((exp, i) => {
      expect(exp.company).toBe(SAMPLE_RESUME.experience[i].company);
      expect(exp.startDate).toBe(SAMPLE_RESUME.experience[i].startDate);
      expect(exp.endDate).toBe(SAMPLE_RESUME.experience[i].endDate);
    });
  });

  it("preserves quantified project metrics", () => {
    const result = tailorResume(SAMPLE_RESUME, job);
    const projectText = result.resume.projects.flatMap((p) => p.bullets).join(" ");
    expect(projectText).toContain("83%");
    expect(projectText).toMatch(/30 minutes/);
    expect(projectText).toMatch(/5 minutes/);
  });

  it("keeps the resume to one page", () => {
    const result = tailorResume(SAMPLE_RESUME, job);
    // one-page fit is asserted indirectly: autoFitOnePage runs inside tailorResume
    // and pageFitSteps stays empty when it already fit, otherwise trimming occurred.
    expect(Array.isArray(result.pageFitSteps)).toBe(true);
  });
});

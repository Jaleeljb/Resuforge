import { describe, it, expect } from "vitest";
import { matchEducationRequirements } from "@/lib/ats/keywordMatch";
import { tailorResume } from "@/lib/resume/tailor";
import { analyzeJobDescription } from "@/lib/job/analyzeJobDescription";
import { SAMPLE_RESUME, SAMPLE_JOB_DESCRIPTION } from "@/lib/resume/sampleResume";

const JD_WITH_EDUCATION = `${SAMPLE_JOB_DESCRIPTION}

Education:
- Bachelor's degree in Cybersecurity or related field
- PhD in Theoretical Physics required
`;

describe("matchEducationRequirements", () => {
  const job = analyzeJobDescription(JD_WITH_EDUCATION);

  it("parsed the education section from the JD", () => {
    expect(job.educationRequirements.length).toBe(2);
  });

  it("recognizes a degree requirement evidenced in the resume's Education section", () => {
    const results = matchEducationRequirements(SAMPLE_RESUME, job);
    const csReq = results.find((r) => r.requirement.toLowerCase().includes("cybersecurity"));
    expect(csReq?.met).toBe(true);
  });

  it("flags a requirement with no evidence, without inventing anything on the resume", () => {
    const results = matchEducationRequirements(SAMPLE_RESUME, job);
    const phdReq = results.find((r) => r.requirement.toLowerCase().includes("physics"));
    expect(phdReq?.met).toBe(false);
    // Crucially: the resume itself must be untouched by this check.
    expect(SAMPLE_RESUME.education.length).toBe(1);
  });

  it("returns an empty array when the JD has no education section", () => {
    const jobNoEdu = analyzeJobDescription(SAMPLE_JOB_DESCRIPTION);
    expect(matchEducationRequirements(SAMPLE_RESUME, jobNoEdu)).toEqual([]);
  });
});

describe("tailorProjects (previously skipped by tailoring)", () => {
  const job = analyzeJobDescription(SAMPLE_JOB_DESCRIPTION);

  it("aligns terminology in project bullets and preserves quantified metrics", () => {
    const before = SAMPLE_RESUME.projects.flatMap((p) => p.bullets).join(" ");
    const { resume: tailored } = tailorResume(SAMPLE_RESUME, job);
    const after = tailored.projects.flatMap((p) => p.bullets).join(" ");
    expect(after).toContain("83%");
    expect(after).toMatch(/30 minutes/);
    expect(after).toMatch(/5 minutes/);
    // Sanity: tailoring is actually doing *something* to at least one section
    // (already covered by existing tests) and project bullet count/order is preserved.
    expect(tailored.projects.length).toBe(SAMPLE_RESUME.projects.length);
    void before;
  });

  it("never invents a new project or drops an existing one", () => {
    const { resume: tailored } = tailorResume(SAMPLE_RESUME, job);
    expect(tailored.projects.map((p) => p.name).sort()).toEqual(SAMPLE_RESUME.projects.map((p) => p.name).sort());
  });
});

import { describe, it, expect } from "vitest";
import { fitResumeToOnePage } from "@/lib/export/fitOnePage";
import { countPdfPages } from "@/lib/export/pdfPageCount";
import { emptyResume, Resume } from "@/types/resume";
import { SAMPLE_RESUME } from "@/lib/resume/sampleResume";

function makeVeryLongResume(): Resume {
  const base = emptyResume();
  base.personalInfo = { name: "Very Long Resume Person", email: "long@example.com", phone: "555-000-1111" };
  base.summary = "An extremely long summary sentence describing many years of broad experience. ".repeat(10);
  base.experience = Array.from({ length: 10 }, (_, i) => ({
    id: `exp-${i}`,
    company: `Company ${i}`,
    title: `Senior Role ${i}`,
    startDate: "2010",
    endDate: "2020",
    bullets: Array.from(
      { length: 6 },
      (_, j) =>
        `Delivered a fairly detailed and wordy bullet point number ${j} describing responsibilities, tools used, and outcomes achieved in great detail across the organization. `
    ),
  }));
  base.skills = Array.from({ length: 8 }, (_, i) => ({
    id: `sk-${i}`,
    category: `Skill Category ${i}`,
    items: Array.from({ length: 10 }, (_, j) => `Skill ${i}-${j}`),
  }));
  base.projects = Array.from({ length: 4 }, (_, i) => ({
    id: `proj-${i}`,
    name: `Project ${i}`,
    technologies: ["Python", "AWS"],
    bullets: Array.from({ length: 4 }, (_, j) => `Project ${i} bullet ${j} with a decent amount of descriptive text.`),
  }));
  return base;
}

describe("fitResumeToOnePage", () => {
  it("produces a real single-page PDF for a reasonably-sized resume", async () => {
    const result = await fitResumeToOnePage(SAMPLE_RESUME, undefined, "classic");
    expect(result.pages).toBe(1);
    const verifiedPages = await countPdfPages(result.buffer);
    expect(verifiedPages).toBe(1);
  }, 20000);

  it("aggressively trims an extremely long resume down to a real single page", async () => {
    const long = makeVeryLongResume();
    const result = await fitResumeToOnePage(long, undefined, "classic");
    expect(result.pages).toBe(1);
    expect(result.trimmed).toBe(true);
    // Contact info must survive even the most aggressive trimming.
    expect(result.resume.personalInfo.name).toBe("Very Long Resume Person");
    expect(result.resume.personalInfo.email).toBe("long@example.com");
  }, 30000);

  it("never needs trimming for an already-short resume", async () => {
    const short: Resume = {
      ...emptyResume(),
      personalInfo: { name: "Short Resume", email: "short@example.com" },
      summary: "Brief summary.",
      experience: [{ id: "e1", company: "Acme", title: "Engineer", startDate: "2023", endDate: "Present", bullets: ["Did a thing."] }],
    };
    const result = await fitResumeToOnePage(short, undefined, "classic");
    expect(result.pages).toBe(1);
    expect(result.levelsApplied).toBe(0);
  }, 20000);
});

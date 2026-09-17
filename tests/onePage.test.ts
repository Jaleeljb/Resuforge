import { describe, it, expect } from "vitest";
import { checkPageFit, autoFitOnePage } from "@/lib/resume/onePage";
import { emptyResume, Resume } from "@/types/resume";
import { SAMPLE_RESUME } from "@/lib/resume/sampleResume";

function makeLongResume(): Resume {
  const base = emptyResume();
  base.personalInfo = { name: "Long Resume Person", email: "a@b.com" };
  base.summary = "A very long summary. ".repeat(20);
  base.experience = Array.from({ length: 6 }, (_, i) => ({
    id: `exp-${i}`,
    company: `Company ${i}`,
    title: `Role ${i}`,
    startDate: "2018",
    endDate: "2020",
    bullets: Array.from({ length: 8 }, (_, j) => `This is a fairly long bullet point number ${j} describing responsibilities in great detail. `.repeat(2)),
  }));
  return base;
}

describe("checkPageFit", () => {
  it("reports the sample resume's fit status without throwing", () => {
    const fit = checkPageFit(SAMPLE_RESUME);
    expect(fit.estimatedLines).toBeGreaterThan(0);
    expect(fit.maxLines).toBeGreaterThan(0);
  });

  it("flags an intentionally long resume as overflowing", () => {
    const fit = checkPageFit(makeLongResume());
    expect(fit.fits).toBe(false);
    expect(fit.overflowBy).toBeGreaterThan(0);
  });
});

describe("autoFitOnePage", () => {
  it("trims a long resume toward one page and records the steps taken", () => {
    const long = makeLongResume();
    const before = checkPageFit(long);
    const { resume, steps, fit } = autoFitOnePage(long, undefined);
    expect(steps.length).toBeGreaterThan(0);
    expect(fit.estimatedLines).toBeLessThan(before.estimatedLines);
    // Contact info must never be removed by trimming.
    expect(resume.personalInfo.name).toBe("Long Resume Person");
    expect(resume.personalInfo.email).toBe("a@b.com");
  });

  it("leaves an already-fitting resume unchanged", () => {
    const { steps } = autoFitOnePage(SAMPLE_RESUME, undefined);
    const fit = checkPageFit(SAMPLE_RESUME);
    if (fit.fits) {
      expect(steps).toHaveLength(0);
    }
  });
});

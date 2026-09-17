import { describe, it, expect } from "vitest";
import { validateClaims } from "@/lib/resume/claimValidation";
import { SAMPLE_RESUME } from "@/lib/resume/sampleResume";
import { Resume } from "@/types/resume";

describe("validateClaims", () => {
  it("flags a fabricated skill claim not present in the original resume", () => {
    const tampered: Resume = JSON.parse(JSON.stringify(SAMPLE_RESUME));
    tampered.experience[0].bullets.push("Expert in Splunk enterprise deployments across 500+ hosts.");

    const claims = validateClaims(tampered, SAMPLE_RESUME);
    expect(claims.some((c) => c.location.includes("Splunk"))).toBe(true);
  });

  it("does not flag a term the user has explicitly confirmed", () => {
    const tampered: Resume = JSON.parse(JSON.stringify(SAMPLE_RESUME));
    tampered.experience[0].bullets.push("Expert in Splunk enterprise deployments across 500+ hosts.");

    const claims = validateClaims(tampered, SAMPLE_RESUME, new Set(["Splunk"]));
    expect(claims.some((c) => c.location.includes("Splunk"))).toBe(false);
  });

  it("does not flag content that already existed in the original resume", () => {
    const claims = validateClaims(SAMPLE_RESUME, SAMPLE_RESUME);
    expect(claims).toHaveLength(0);
  });

  it("flags a fabricated metric not present anywhere in the original", () => {
    const tampered: Resume = JSON.parse(JSON.stringify(SAMPLE_RESUME));
    tampered.projects[0].bullets.push("Reduced costs by 97% through automation.");
    const claims = validateClaims(tampered, SAMPLE_RESUME);
    expect(claims.some((c) => c.location.includes("97"))).toBe(true);
  });
});

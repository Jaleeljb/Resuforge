import { describe, it, expect } from "vitest";
import { matchKeywords } from "@/lib/ats/keywordMatch";
import { calculateATSScore } from "@/lib/ats/scoring";
import { analyzeJobDescription } from "@/lib/job/analyzeJobDescription";
import { SAMPLE_RESUME, SAMPLE_JOB_DESCRIPTION } from "@/lib/resume/sampleResume";

describe("keyword matching + ATS scoring (critical quality test)", () => {
  const job = analyzeJobDescription(SAMPLE_JOB_DESCRIPTION);

  it("matches strong evidence for SIEM, incident response, vulnerability management, Defender, MITRE ATT&CK", () => {
    const matches = matchKeywords(SAMPLE_RESUME, job);
    const byTerm = Object.fromEntries(matches.map((m) => [m.keyword, m]));

    expect(byTerm["SIEM"]?.status).toBe("matched");
    expect(byTerm["Incident Response"]?.status).toBe("matched");
    expect(byTerm["Vulnerability Management"]?.status === "matched" || byTerm["Vulnerability Management"]?.status === "partial").toBe(true);
    expect(byTerm["Microsoft Defender"]?.status).toBe("matched");
    expect(byTerm["MITRE ATT&CK"]?.status).toBe("matched");
  });

  it("correctly flags Splunk as missing since the resume never mentions it", () => {
    const matches = matchKeywords(SAMPLE_RESUME, job);
    const splunk = matches.find((m) => m.keyword === "Splunk");
    expect(splunk?.status).toBe("missing");
  });

  it("recognizes the semantic match between 'security event monitoring' language and resume's 'monitored security events'", () => {
    const matches = matchKeywords(SAMPLE_RESUME, job);
    const monitoring = matches.find((m) => m.keyword === "Security Monitoring");
    expect(monitoring?.status).toBe("matched");
  });

  it("produces a score between 0 and 100 with an explanation", () => {
    const score = calculateATSScore(SAMPLE_RESUME, job);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.explanation.length).toBeGreaterThan(0);
    expect(score.strongMatches.length).toBeGreaterThan(0);
  });

  it("gives a strong-alignment band for this well-matched resume/job pair", () => {
    const score = calculateATSScore(SAMPLE_RESUME, job);
    expect(["strong", "very-strong", "moderate"]).toContain(score.band);
  });
});

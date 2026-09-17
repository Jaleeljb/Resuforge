import { describe, it, expect } from "vitest";
import { analyzeJobDescription } from "@/lib/job/analyzeJobDescription";
import {
  CYBERSECURITY_ANALYST_JD,
  SOC_ANALYST_JD,
  CLOUD_SECURITY_JD,
  GENERIC_TECHNICAL_JD,
} from "./fixtures/jobDescriptions";

describe("analyzeJobDescription", () => {
  it("extracts required cybersecurity skills", () => {
    const analysis = analyzeJobDescription(CYBERSECURITY_ANALYST_JD);
    expect(analysis.requiredSkills).toContain("Security Monitoring");
    expect(analysis.requiredSkills).toContain("Incident Response");
    expect(analysis.requiredSkills).toContain("Vulnerability Management");
    expect(analysis.requiredSkills).toContain("SIEM");
    expect(analysis.requiredSkills).toContain("MITRE ATT&CK");
    expect(analysis.preferredSkills).toContain("AWS");
  });

  it("separates required vs nice-to-have for the SOC analyst JD", () => {
    const analysis = analyzeJobDescription(SOC_ANALYST_JD);
    expect(analysis.requiredSkills).toContain("CompTIA Security+");
    expect(analysis.requiredSkills).toContain("Microsoft Defender");
    expect(analysis.preferredSkills).toContain("Splunk");
    expect(analysis.seniority).toBe("Entry / Junior");
  });

  it("extracts cloud security requirements", () => {
    const analysis = analyzeJobDescription(CLOUD_SECURITY_JD);
    expect(analysis.requiredSkills).toContain("AWS");
    expect(analysis.requiredSkills).toContain("MFA");
    expect(analysis.yearsOfExperience).toBeDefined();
  });

  it("still extracts sensible keywords for a non-security JD", () => {
    const analysis = analyzeJobDescription(GENERIC_TECHNICAL_JD);
    expect(analysis.requiredSkills.length + analysis.technicalSkills.length).toBeGreaterThan(0);
    expect(analysis.hiddenSignals.some((s) => /fast-paced/i.test(s))).toBe(true);
    expect(analysis.hiddenSignals.some((s) => /cross-team/i.test(s))).toBe(true);
  });

  it("categorizes required vs preferred using the requirements array", () => {
    const analysis = analyzeJobDescription(CYBERSECURITY_ANALYST_JD);
    const siem = analysis.requirements.find((r) => r.term === "SIEM");
    expect(siem?.level).toBe("required");
    const aws = analysis.requirements.find((r) => r.term === "AWS");
    expect(aws?.level).toBe("preferred");
  });
});

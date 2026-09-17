import { describe, it, expect } from "vitest";
import { parseResumeText } from "@/lib/parsing/textResumeParser";

const SAMPLE_TEXT = `Jamie Rivera
jamie.rivera@example.com | (555) 123-9876 | Austin, TX | linkedin.com/in/jamierivera

Summary
Cybersecurity analyst with SOC experience in monitoring and incident response.

Experience
SOC Analyst | Acme Security | 2022 - Present
- Monitored SIEM alerts and triaged incidents daily
- Performed vulnerability assessments across cloud infrastructure

Skills
Security Tools: SIEM, Microsoft Defender, Wireshark
Cloud: AWS, Azure

Education
B.S. in Computer Science, University of Texas, 2022

Certifications
CompTIA Security+ - CompTIA - 2023
`;

describe("parseResumeText", () => {
  const resume = parseResumeText(SAMPLE_TEXT);

  it("extracts personal info", () => {
    expect(resume.personalInfo.name).toBe("Jamie Rivera");
    expect(resume.personalInfo.email).toBe("jamie.rivera@example.com");
    expect(resume.personalInfo.linkedin).toContain("linkedin.com/in/jamierivera");
  });

  it("does not mistake the email domain for a separate portfolio URL", () => {
    const r = parseResumeText("Alex Kim\nalex.kim@example.com | (555) 999-1234 | Denver, CO\n\nSummary\nTest.\n");
    expect(r.personalInfo.portfolio).toBeUndefined();
  });

  it("extracts the summary", () => {
    expect(resume.summary).toMatch(/Cybersecurity analyst/);
  });

  it("extracts at least one experience entry with bullets", () => {
    expect(resume.experience.length).toBeGreaterThan(0);
    expect(resume.experience[0].bullets.length).toBeGreaterThan(0);
  });

  it("extracts skill categories", () => {
    const categories = resume.skills.map((s) => s.category);
    expect(categories).toContain("Security Tools");
  });

  it("extracts education and certifications", () => {
    expect(resume.education.length).toBeGreaterThan(0);
    expect(resume.certifications.length).toBeGreaterThan(0);
  });
});

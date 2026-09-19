import { describe, it, expect } from "vitest";
import { sanitizeResume } from "@/lib/resume/sanitize";
import { emptyResume, Resume } from "@/types/resume";

function baseResume(): Resume {
  return {
    ...emptyResume(),
    personalInfo: { name: "Sam Smith", email: "sam@example.com" },
  };
}

describe("sanitizeResume", () => {
  it("strips invalid XML control characters from text fields", () => {
    const r = baseResume();
    r.summary = "Summary with a control char \x0b in it.";
    r.experience = [{ id: "e1", company: "Acme", title: "Eng", bullets: ["Bullet with \x01 control char."] }];
    const clean = sanitizeResume(r);
    expect(clean.summary).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F]/);
    expect(clean.experience[0].bullets[0]).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F]/);
  });

  it("preserves normal punctuation and unicode content", () => {
    const r = baseResume();
    r.summary = "Résumé with an em dash — and curly quotes \u2018like this\u2019.";
    const clean = sanitizeResume(r);
    expect(clean.summary).toContain("Résumé");
    expect(clean.summary).toContain("—");
  });

  it("applies a hard safety-net cap on extremely long single fields", () => {
    const r = baseResume();
    r.experience = [{ id: "e1", company: "Acme", title: "Eng", bullets: ["x".repeat(20000)] }];
    const clean = sanitizeResume(r);
    expect(clean.experience[0].bullets[0].length).toBeLessThanOrEqual(8000);
  });

  it("never produces an empty name even if input is blank", () => {
    const r = baseResume();
    r.personalInfo.name = "   ";
    const clean = sanitizeResume(r);
    expect(clean.personalInfo.name.length).toBeGreaterThan(0);
  });

  it("keeps a moderately long bullet (e.g. an unbulleted paragraph artifact) intact", () => {
    const r = baseResume();
    const longBullet = "This is a fairly long bullet point. ".repeat(20); // ~740 chars
    r.experience = [{ id: "e1", company: "Acme", title: "Eng", bullets: [longBullet] }];
    const clean = sanitizeResume(r);
    expect(clean.experience[0].bullets[0].length).toBeGreaterThan(500);
  });
});

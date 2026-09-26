import { describe, it, expect } from "vitest";
import { splitHighlightSegments } from "@/lib/text/normalize";

describe("splitHighlightSegments", () => {
  it("highlights a whole-word match, case-insensitively", () => {
    const segs = splitHighlightSegments("Skilled in Security monitoring and response.", ["security"]);
    const matched = segs.filter((s) => s.matched).map((s) => s.text);
    expect(matched).toEqual(["Security"]);
  });

  it("prefers the longest overlapping term (phrase over sub-word)", () => {
    const segs = splitHighlightSegments("Led incident response investigations.", ["incident response", "incident"]);
    const matched = segs.filter((s) => s.matched).map((s) => s.text);
    expect(matched).toEqual(["incident response"]);
  });

  it("does not match inside a larger word (word-boundary safe)", () => {
    const segs = splitHighlightSegments("Documented incidents for the team.", ["incident"]);
    expect(segs.some((s) => s.matched)).toBe(false);
  });

  it("highlights multiple distinct occurrences and terms", () => {
    const segs = splitHighlightSegments("Security monitoring and security audits across network events.", [
      "security",
      "network events",
    ]);
    const matched = segs.filter((s) => s.matched).map((s) => s.text.toLowerCase());
    expect(matched).toEqual(["security", "security", "network events"]);
  });

  it("returns the original text unmatched when there are no terms", () => {
    const segs = splitHighlightSegments("Plain text.", []);
    expect(segs).toEqual([{ text: "Plain text.", matched: false }]);
  });

  it("reconstructs the exact original text when segments are joined back", () => {
    const text = "Cloud security posture fundamentals on AWS, plus security audits.";
    const segs = splitHighlightSegments(text, ["security", "posture", "AWS"]);
    expect(segs.map((s) => s.text).join("")).toBe(text);
  });
});

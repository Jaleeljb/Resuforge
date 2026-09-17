import { Resume } from "@/types/resume";
import { ClaimValidation } from "@/types/ats";
import { DICTIONARY } from "@/lib/domain/dictionary";
import { normalize, includesPhrase } from "@/lib/text/normalize";
import { resumeToSections } from "@/lib/ats/keywordMatch";

/** Extracts numbers (metrics like "83%", "30 minutes", "11+") from text. */
function extractNumbers(text: string): string[] {
  return text.match(/\d+(\.\d+)?\s*(%|percent|\+|hours?|minutes?|days?|x\b)?/gi) || [];
}

function findDictionaryTermsIn(text: string): string[] {
  const norm = normalize(text);
  const found: string[] = [];
  for (const entry of DICTIONARY) {
    const phrases = [entry.canonical, ...entry.synonyms].map((p) => normalize(p));
    if (phrases.some((p) => p.length >= 2 && includesPhrase(norm, p))) found.push(entry.canonical);
  }
  return found;
}

/**
 * Compares the current (possibly AI-tailored or user-edited) resume against
 * the immutable original resume. Any dictionary skill/tool term or metric
 * that appears in the current version but has no trace in the original is
 * flagged as a potential unsupported claim requiring user confirmation,
 * unless it has been explicitly confirmed by the user.
 */
export function validateClaims(
  current: Resume,
  original: Resume,
  confirmedTerms: Set<string> = new Set()
): ClaimValidation[] {
  const originalSections = resumeToSections(original);
  const originalText = originalSections.map((s) => s.text).join(" \n ");
  const originalTermSet = new Set(findDictionaryTermsIn(originalText));
  const originalNumbers = new Set(extractNumbers(originalText).map((n) => n.replace(/\s+/g, "")));

  const results: ClaimValidation[] = [];

  const checkStatement = (statement: string, location: string) => {
    if (!statement || statement.trim().length === 0) return;

    const termsHere = findDictionaryTermsIn(statement);
    for (const term of termsHere) {
      if (originalTermSet.has(term) || confirmedTerms.has(term)) continue;
      results.push({
        statement,
        supportedByResume: false,
        confidence: 0.75,
        location: `${location} — introduces "${term}", not found in your original resume`,
      });
    }

    const numbersHere = extractNumbers(statement).map((n) => n.replace(/\s+/g, ""));
    for (const num of numbersHere) {
      if (num.length < 2) continue; // ignore stray single digits
      if (originalNumbers.has(num)) continue;
      results.push({
        statement,
        supportedByResume: false,
        confidence: 0.6,
        location: `${location} — introduces metric "${num}" not present in your original resume`,
      });
    }
  };

  if (current.summary) checkStatement(current.summary, "Summary");
  for (const exp of current.experience) {
    exp.bullets.forEach((b, i) => checkStatement(b, `Experience: ${exp.company || exp.title}, bullet ${i + 1}`));
  }
  for (const proj of current.projects) {
    proj.bullets.forEach((b, i) => checkStatement(b, `Project: ${proj.name}, bullet ${i + 1}`));
  }

  return results;
}

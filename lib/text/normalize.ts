export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9+#./&\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter(Boolean);
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "is",
  "are", "as", "at", "by", "be", "this", "that", "it", "will", "you", "your",
  "we", "our", "their", "they", "who", "what", "have", "has", "into", "up",
  "up-to-date", "etc", "including", "such", "using", "across", "within",
]);

export function significantTokens(text: string): string[] {
  return tokenize(text).filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Simple, dependency-free stemming: strips common suffixes so
 * "monitoring"/"monitored"/"monitors" collapse toward "monitor". */
export function lightStem(word: string): string {
  let w = word.toLowerCase();
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  if (w.endsWith("ing") && w.length > 5) return w.slice(0, -3);
  if (w.endsWith("ed") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("es") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
  return w;
}

export function stemmedTokenSet(text: string): Set<string> {
  return new Set(significantTokens(text).map(lightStem));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Finds a phrase inside text as a whole "word" (not as a substring of a
 * larger word), so short phrases like "ts" don't false-positive inside
 * unrelated words like "incidents". Both inputs should already be
 * normalized (see `normalize`). Returns the index of the match, or -1. */
export function indexOfPhrase(haystack: string, phrase: string): number {
  if (!phrase) return -1;
  const pattern = new RegExp(`(?<![a-z0-9])${escapeRegExp(phrase)}(?![a-z0-9])`, "i");
  const match = haystack.match(pattern);
  return match ? (match.index ?? -1) : -1;
}

export function includesPhrase(haystack: string, phrase: string): boolean {
  return indexOfPhrase(haystack, phrase) !== -1;
}

/** Splits raw pasted text into non-empty lines, trimmed. */
export function toLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/** True if a line looks like a bullet ("- ", "* ", "• ", "1. "). */
export function isBulletLine(line: string): boolean {
  return /^([-*•‣▪◦]|\d+[.)])\s+/.test(line.trim());
}

export function stripBullet(line: string): string {
  return line.trim().replace(/^([-*•‣▪◦]|\d+[.)])\s+/, "").trim();
}

/** Splits a longer text into sentences (heuristic, good enough for bullets/paragraphs). */
export function toSentences(text: string): string[] {
  return text
    .replace(/\n/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

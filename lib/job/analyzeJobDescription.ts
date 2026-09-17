import { JobAnalysis, JobRequirement, RequirementLevel } from "@/types/job";
import { DICTIONARY, ACTION_VERBS, HIDDEN_SIGNAL_PATTERNS } from "@/lib/domain/dictionary";
import { normalize, toLines, isBulletLine, stripBullet, toSentences, stemmedTokenSet, includesPhrase } from "@/lib/text/normalize";

const REQUIRED_HEADERS = /^(requirements?|required( qualifications)?|must[-\s]?haves?|minimum qualifications|basic qualifications|what you('ll)? need|qualifications)\s*:?\s*$/i;
const PREFERRED_HEADERS = /^(preferred( qualifications)?|nice[-\s]?to[-\s]?haves?|bonus points?|good to have|desired( skills| qualifications)?|pluses?)\s*:?\s*$/i;
const RESPONSIBILITY_HEADERS = /^(responsibilities|what you('ll)? do|the role|role overview|key responsibilities|duties|day[-\s]?to[-\s]?day)\s*:?\s*$/i;
const EDUCATION_HEADERS = /^(education|academic requirements)\s*:?\s*$/i;

const TITLE_HINT_WORDS = [
  "analyst", "engineer", "manager", "specialist", "administrator", "architect",
  "developer", "consultant", "director", "lead", "coordinator", "associate",
  "intern", "officer", "scientist", "designer",
];

function detectSection(line: string): "required" | "preferred" | "responsibilities" | "education" | null {
  if (REQUIRED_HEADERS.test(line)) return "required";
  if (PREFERRED_HEADERS.test(line)) return "preferred";
  if (RESPONSIBILITY_HEADERS.test(line)) return "responsibilities";
  if (EDUCATION_HEADERS.test(line)) return "education";
  return null;
}

function guessJobTitle(lines: string[]): string {
  // Prefer an explicit "Job Title: X" style line.
  for (const line of lines.slice(0, 8)) {
    const m = line.match(/^(job title|title|position|role)\s*[:\-]\s*(.+)$/i);
    if (m) return m[2].trim();
  }
  // Otherwise, the first short-ish line that contains a title hint word.
  for (const line of lines.slice(0, 6)) {
    const lower = line.toLowerCase();
    if (line.length < 80 && TITLE_HINT_WORDS.some((w) => lower.includes(w))) {
      return line.replace(/[-–|].*$/, "").trim();
    }
  }
  return lines[0]?.slice(0, 80) ?? "Target Role";
}

function guessCompany(lines: string[]): string | undefined {
  for (const line of lines.slice(0, 8)) {
    const m = line.match(/^(company|employer|organization)\s*[:\-]\s*(.+)$/i);
    if (m) return m[2].trim();
  }
  return undefined;
}

function guessSeniority(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/\b(senior|sr\.?)\b/.test(lower)) return "Senior";
  if (/\b(lead|principal|staff)\b/.test(lower)) return "Lead / Principal";
  if (/\b(mid[-\s]?level|intermediate)\b/.test(lower)) return "Mid-level";
  if (/\b(junior|jr\.?|entry[-\s]?level|associate|intern(ship)?)\b/.test(lower)) return "Entry / Junior";
  return undefined;
}

function guessYearsOfExperience(text: string): string | undefined {
  const m = text.match(/(\d+)\s*\+?\s*(?:to|-)?\s*(\d+)?\s*\+?\s*years?/i);
  if (!m) return undefined;
  if (m[2]) return `${m[1]}-${m[2]} years`;
  return `${m[1]}+ years`;
}

/** Very small proper-noun / acronym fallback extractor for terms not in our
 * curated dictionary (e.g. a niche tool name), so unfamiliar JDs still yield
 * useful keywords instead of only dictionary hits. */
function extractAdHocTerms(sentence: string): string[] {
  const found = new Set<string>();
  // Acronyms: 2-6 uppercase letters, not at the very start of a sentence
  // (to reduce false positives from capitalized first words).
  const acronymMatches = sentence.match(/\b[A-Z]{2,6}\b/g) || [];
  for (const a of acronymMatches) {
    if (a === "AND" || a === "THE" || a === "FOR") continue;
    found.add(a);
  }
  // Title Case bigrams/trigrams, e.g. "Google Cloud", "Power BI".
  const titleCaseMatches = sentence.match(/\b([A-Z][a-zA-Z0-9+.]*\s){1,2}[A-Z][a-zA-Z0-9+.]*\b/g) || [];
  for (const t of titleCaseMatches) {
    const trimmed = t.trim();
    if (trimmed.split(" ").length >= 2 && trimmed.length < 30) found.add(trimmed);
  }
  return Array.from(found);
}

/** Drops an ad-hoc extracted term if it's just a fragment of (or a
 * superset wrapping) a term already captured by the curated dictionary on
 * this same line — e.g. "MITRE", "ATT", "CK" once "MITRE ATT&CK" already
 * matched, so keyword lists don't fill up with acronym debris. */
function isRedundantAdHoc(term: string, existing: JobRequirement[]): boolean {
  const normTerm = normalize(term);
  return existing.some((r) => {
    const normExisting = normalize(r.term);
    return includesPhrase(normExisting, normTerm) || includesPhrase(normTerm, normExisting);
  });
}

export function analyzeJobDescription(rawText: string): JobAnalysis {
  const lines = toLines(rawText);
  const jobTitle = guessJobTitle(lines);
  const company = guessCompany(lines);
  const seniority = guessSeniority(rawText);
  const yearsOfExperience = guessYearsOfExperience(rawText);

  const requirements: JobRequirement[] = [];
  const responsibilities: string[] = [];
  const educationRequirements: string[] = [];
  const hiddenSignals = new Set<string>();

  let currentSection: "required" | "preferred" | "responsibilities" | "education" | null = null;

  const addRequirement = (term: string, level: RequirementLevel) => {
    const key = term.trim();
    if (!key || key.length < 2) return;
    const existing = requirements.find((r) => r.term.toLowerCase() === key.toLowerCase());
    if (existing) {
      // Escalate to the more important level if seen again in a stronger section.
      const order: RequirementLevel[] = ["contextual", "nice-to-have", "preferred", "required"];
      if (order.indexOf(level) > order.indexOf(existing.level)) existing.level = level;
    } else {
      requirements.push({ term: key, level });
    }
  };

  const scanTextForDictionaryHits = (text: string, level: RequirementLevel) => {
    const norm = normalize(text);
    const lineTokens = stemmedTokenSet(text);

    for (const entry of DICTIONARY) {
      const phrases = [entry.canonical, ...entry.synonyms].map((p) => normalize(p));

      // 1) Exact phrase match (word-boundary aware, so short synonyms like
      // "ts" don't false-positive inside unrelated words like "incidents").
      if (phrases.some((p) => includesPhrase(norm, p))) {
        addRequirement(entry.canonical, level);
        continue;
      }

      // 2) Semantic match: a multi-word phrase whose stemmed tokens are
      // mostly present in this line, even if worded differently (e.g. JD
      // says "monitor SIEM alerts...security incidents" which semantically
      // covers "security monitoring" without using that exact phrase).
      let bestRatio = 0;
      for (const phrase of phrases) {
        const phraseTokens = stemmedTokenSet(phrase);
        if (phraseTokens.size < 2) continue;
        let overlap = 0;
        for (const t of phraseTokens) if (lineTokens.has(t)) overlap++;
        bestRatio = Math.max(bestRatio, overlap / phraseTokens.size);
      }
      if (bestRatio >= 0.7) addRequirement(entry.canonical, level);
    }
  };

  for (const rawLine of lines) {
    const section = detectSection(rawLine);
    if (section) {
      currentSection = section;
      continue;
    }

    const line = isBulletLine(rawLine) ? stripBullet(rawLine) : rawLine;
    const lower = line.toLowerCase();

    // Hidden signals apply regardless of section.
    for (const { pattern, signal } of HIDDEN_SIGNAL_PATTERNS) {
      if (pattern.test(line)) hiddenSignals.add(signal);
    }

    if (currentSection === "education") {
      educationRequirements.push(line);
      continue;
    }

    if (currentSection === "responsibilities") {
      responsibilities.push(line);
      scanTextForDictionaryHits(line, "contextual");
      continue;
    }

    if (currentSection === "required") {
      scanTextForDictionaryHits(line, "required");
      for (const term of extractAdHocTerms(line)) {
        if (!isRedundantAdHoc(term, requirements)) addRequirement(term, "required");
      }
      continue;
    }

    if (currentSection === "preferred") {
      scanTextForDictionaryHits(line, "preferred");
      for (const term of extractAdHocTerms(line)) {
        if (!isRedundantAdHoc(term, requirements)) addRequirement(term, "preferred");
      }
      continue;
    }

    // No section context yet (e.g. intro paragraph or unlabeled JD): still
    // extract dictionary hits, but treat as strength-of-language dependent.
    const impliesRequired = /\bmust\b|\brequired\b|\bat least\b|\bminimum of\b/i.test(lower);
    const impliesPreferred = /\bpreferred\b|\bnice to have\b|\bplus\b|\bbonus\b|\bideally\b/i.test(lower);
    const level: RequirementLevel = impliesRequired ? "required" : impliesPreferred ? "preferred" : "contextual";
    scanTextForDictionaryHits(line, level);
    if (isBulletLine(rawLine)) {
      // Unlabeled bullet lists are usually responsibilities-ish; capture them too.
      responsibilities.push(line);
    }
  }

  // Categorize collected requirement terms by dictionary category.
  const dictByCanonical = new Map(DICTIONARY.map((d) => [d.canonical, d]));
  const requiredSkills: string[] = [];
  const preferredSkills: string[] = [];
  const technicalSkills: string[] = [];
  const softSkills: string[] = [];
  const tools: string[] = [];
  const technologies: string[] = [];
  const frameworks: string[] = [];
  const certifications: string[] = [];
  const domainTerms: string[] = [];

  for (const req of requirements) {
    if (req.level === "required") requiredSkills.push(req.term);
    if (req.level === "preferred" || req.level === "nice-to-have") preferredSkills.push(req.term);

    const dict = dictByCanonical.get(req.term);
    if (!dict) {
      technicalSkills.push(req.term); // ad-hoc term, best guess bucket
      continue;
    }
    switch (dict.category) {
      case "soft-skill":
        softSkills.push(req.term);
        break;
      case "certification":
        certifications.push(req.term);
        break;
      case "security-tool":
      case "general-tool":
        tools.push(req.term);
        technicalSkills.push(req.term);
        break;
      case "cloud":
      case "platform":
      case "networking":
        technologies.push(req.term);
        technicalSkills.push(req.term);
        break;
      case "framework":
      case "language":
        frameworks.push(req.term);
        technicalSkills.push(req.term);
        break;
      case "security-domain":
      case "process":
        domainTerms.push(req.term);
        technicalSkills.push(req.term);
        break;
      default:
        technicalSkills.push(req.term);
    }
  }

  const actionVerbs = Array.from(
    new Set(
      toSentences(rawText)
        .flatMap((s) => s.toLowerCase().split(/\W+/))
        .filter((w) => ACTION_VERBS.includes(w))
    )
  );

  const keywords = Array.from(new Set(requirements.map((r) => r.term)));

  return {
    jobTitle,
    company,
    seniority,
    yearsOfExperience,
    requiredSkills: dedupe(requiredSkills),
    preferredSkills: dedupe(preferredSkills),
    technicalSkills: dedupe(technicalSkills),
    softSkills: dedupe(softSkills),
    tools: dedupe(tools),
    technologies: dedupe(technologies),
    frameworks: dedupe(frameworks),
    certifications: dedupe(certifications),
    educationRequirements,
    responsibilities: dedupe(responsibilities),
    keywords,
    actionVerbs,
    domainTerms: dedupe(domainTerms),
    hiddenSignals: Array.from(hiddenSignals),
    requirements,
    rawText,
  };
}

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of arr) {
    const key = a.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(a);
    }
  }
  return out;
}

import { Resume } from "@/types/resume";
import { JobAnalysis } from "@/types/job";
import { KeywordMatch, MatchStatus } from "@/types/ats";
import { normalize, stemmedTokenSet, toSentences, includesPhrase } from "@/lib/text/normalize";
import { DICTIONARY } from "@/lib/domain/dictionary";

type Section = { name: string; text: string };

/** Flattens a resume into named text sections so we can report *where*
 * evidence for a keyword was found (e.g. "Experience: Acme Corp"). */
export function resumeToSections(resume: Resume): Section[] {
  const sections: Section[] = [];
  if (resume.summary) sections.push({ name: "Summary", text: resume.summary });

  for (const exp of resume.experience) {
    sections.push({
      name: `Experience: ${exp.company || exp.title || "Untitled role"}`,
      text: [exp.title, exp.company, ...exp.bullets].filter(Boolean).join(". "),
    });
  }

  for (const cat of resume.skills) {
    sections.push({ name: `Skills: ${cat.category}`, text: cat.items.join(", ") });
  }

  for (const proj of resume.projects) {
    sections.push({
      name: `Projects: ${proj.name}`,
      text: [proj.name, proj.technologies.join(", "), ...proj.bullets].filter(Boolean).join(". "),
    });
  }

  for (const cert of resume.certifications) {
    sections.push({ name: "Certifications", text: [cert.name, cert.issuer].filter(Boolean).join(" - ") });
  }

  for (const edu of resume.education) {
    sections.push({
      name: "Education",
      text: [edu.degree, edu.institution, ...(edu.details || [])].filter(Boolean).join(". "),
    });
  }

  return sections;
}

function getSynonymPhrases(term: string): string[] {
  const dict = DICTIONARY.find((d) => d.canonical.toLowerCase() === term.toLowerCase());
  if (!dict) return [term];
  return [dict.canonical, ...dict.synonyms];
}

type Candidate = { status: MatchStatus; matchType: "exact" | "semantic" | "none"; evidence?: string; score: number };

function evaluateTermAgainstSections(term: string, sections: Section[]): Candidate {
  const phrases = getSynonymPhrases(term).map((p) => normalize(p));
  let best: Candidate = { status: "missing", matchType: "none", score: 0 };

  for (const section of sections) {
    const normSection = normalize(section.text);

    // 1) Exact / near-exact match against canonical + synonyms, using
    // word-boundary matching so short phrases don't false-positive inside
    // unrelated words (e.g. "ts" inside "incidents").
    for (const phrase of phrases) {
      if (phrase.length >= 2 && includesPhrase(normSection, phrase)) {
        return { status: "matched", matchType: "exact", evidence: section.name, score: 1 };
      }
    }

    // 2) Semantic match: stemmed token overlap against each sentence.
    const sentences = toSentences(section.text).length ? toSentences(section.text) : [section.text];
    const phraseTokenSets = phrases.map((p) => stemmedTokenSet(p)).filter((s) => s.size > 0);

    for (const sentence of sentences) {
      const sentenceTokens = stemmedTokenSet(sentence);
      if (sentenceTokens.size === 0) continue;

      for (const tokenSet of phraseTokenSets) {
        if (tokenSet.size === 0) continue;
        let overlap = 0;
        for (const t of tokenSet) if (sentenceTokens.has(t)) overlap++;
        const ratio = overlap / tokenSet.size;

        if (ratio > best.score) {
          let status: MatchStatus = "missing";
          if (ratio >= 0.9) status = "matched";
          else if (ratio >= 0.5) status = "partial";
          else if (ratio > 0) status = "weak-evidence";
          best = { status, matchType: "semantic", evidence: ratio > 0 ? section.name : undefined, score: ratio };
        }
      }
    }
  }

  return best;
}

export function matchKeywords(resume: Resume, job: JobAnalysis): KeywordMatch[] {
  const sections = resumeToSections(resume);
  const results: KeywordMatch[] = [];

  for (const req of job.requirements) {
    const candidate = evaluateTermAgainstSections(req.term, sections);
    results.push({
      keyword: req.term,
      requirementLevel: req.level,
      status: candidate.status,
      evidence: candidate.evidence,
      matchType: candidate.matchType,
    });
  }

  // Sort: required first, then preferred, then by status severity so the
  // most actionable items surface at the top of any table.
  const levelOrder = { required: 0, preferred: 1, "nice-to-have": 2, contextual: 3 };
  const statusOrder: Record<MatchStatus, number> = {
    missing: 0,
    "weak-evidence": 1,
    partial: 2,
    unsupported: 3,
    matched: 4,
  };

  return results.sort((a, b) => {
    const l = levelOrder[a.requirementLevel] - levelOrder[b.requirementLevel];
    if (l !== 0) return l;
    return statusOrder[a.status] - statusOrder[b.status];
  });
}

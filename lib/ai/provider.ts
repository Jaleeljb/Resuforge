import "server-only";
import { Resume } from "@/types/resume";
import { JobAnalysis } from "@/types/job";
import { ATSScoreResult, ClaimValidation } from "@/types/ats";
import { analyzeJobDescription } from "@/lib/job/analyzeJobDescription";
import { tailorResume, TailorResult } from "@/lib/resume/tailor";
import { validateClaims } from "@/lib/resume/claimValidation";

export type TailorResumeInput = { resume: Resume; job: JobAnalysis };
export type ClaimValidationInput = { current: Resume; original: Resume; confirmedTerms?: string[] };
export type SuggestionsInput = { resume: Resume; job: JobAnalysis; score: ATSScoreResult };

export interface AIProvider {
  analyzeJobDescription(input: string): Promise<JobAnalysis>;
  tailorResume(input: TailorResumeInput): Promise<TailorResult>;
  validateClaims(input: ClaimValidationInput): Promise<ClaimValidation[]>;
  /** Optional: short natural-language improvement suggestions. Never
   * fabricates resume content — only points at what to strengthen. */
  generateSuggestions(input: SuggestionsInput): Promise<string[]>;
}

/**
 * Deterministic, dependency-free provider. Powers the entire product with
 * no external API key required, so the whole workflow is testable locally.
 * All scoring/tailoring logic lives in lib/ — this class only wires it up.
 */
export class MockAIProvider implements AIProvider {
  async analyzeJobDescription(input: string): Promise<JobAnalysis> {
    return analyzeJobDescription(input);
  }

  async tailorResume(input: TailorResumeInput): Promise<TailorResult> {
    return tailorResume(input.resume, input.job);
  }

  async validateClaims(input: ClaimValidationInput): Promise<ClaimValidation[]> {
    return validateClaims(input.current, input.original, new Set(input.confirmedTerms || []));
  }

  async generateSuggestions(input: SuggestionsInput): Promise<string[]> {
    const suggestions: string[] = [];
    const weak = [...input.score.components].sort((a, b) => a.rawPercent - b.rawPercent)[0];
    if (weak) {
      suggestions.push(`Focus next on "${weak.label}" (${weak.rawPercent}%) — ${weak.notes[0] ?? "review this section"}.`);
    }
    if (input.score.missingKeywords.length > 0) {
      suggestions.push(
        `If you genuinely have experience with ${input.score.missingKeywords.slice(0, 3).join(", ")}, add it with specific evidence rather than a bare mention.`
      );
    }
    return suggestions;
  }
}

/**
 * Real-AI-augmented provider. Extraction, matching, tailoring and claim
 * validation stay on the deterministic engine (fast, free, and impossible
 * to fabricate) — the model is used only to phrase optional suggestion
 * text more naturally. If the call fails for any reason, it falls back to
 * the deterministic suggestions so the product never breaks.
 */
export class AnthropicAugmentedProvider extends MockAIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateSuggestions(input: SuggestionsInput): Promise<string[]> {
    try {
      const prompt = `You are a truthful resume coach. Given this ATS analysis, write up to 3 short, specific, actionable suggestions (max 20 words each) for improving alignment with the target job. Never suggest inventing experience the candidate does not have — only suggest making existing true experience more visible.

Target role: ${input.job.jobTitle}
Missing keywords: ${input.score.missingKeywords.join(", ") || "none"}
Partial keywords: ${input.score.partialKeywords.join(", ") || "none"}
Weakest scoring area: ${[...input.score.components].sort((a, b) => a.rawPercent - b.rawPercent)[0]?.label}

Respond with ONLY a JSON array of strings, nothing else.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) throw new Error(`AI provider error: ${res.status}`);
      const data = await res.json();
      const text = (data.content || []).map((c: { text?: string }) => c.text || "").join("");
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.every((p) => typeof p === "string")) {
        return parsed.slice(0, 3);
      }
      throw new Error("Malformed AI response");
    } catch {
      return super.generateSuggestions(input);
    }
  }
}

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "claude-sonnet-4-5";
  cachedProvider = apiKey ? new AnthropicAugmentedProvider(apiKey, model) : new MockAIProvider();
  return cachedProvider;
}

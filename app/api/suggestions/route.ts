import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { z } from "zod";
import { resumeSchema, jobAnalysisSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

const scoreComponentSchema = z.object({
  key: z.string(),
  label: z.string(),
  weight: z.number(),
  rawPercent: z.number(),
  weightedPoints: z.number(),
  notes: z.array(z.string()),
});

const scoreSchema = z.object({
  overall: z.number(),
  band: z.string(),
  bandLabel: z.string(),
  components: z.array(scoreComponentSchema),
  explanation: z.array(z.object({ type: z.string(), text: z.string() })),
  keywordMatches: z.array(z.any()),
  missingKeywords: z.array(z.string()),
  partialKeywords: z.array(z.string()),
  strongMatches: z.array(z.string()),
  calculatedAt: z.string(),
});

const suggestionsRequestSchema = z.object({
  resume: resumeSchema,
  job: jobAnalysisSchema,
  score: scoreSchema,
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = suggestionsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
  }

  try {
    const provider = getAIProvider();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const suggestions = await provider.generateSuggestions(parsed.data as any);
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("suggestions failed", err);
    return NextResponse.json({ error: "Something went wrong generating suggestions." }, { status: 500 });
  }
}

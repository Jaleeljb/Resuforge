import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { analyzeJobRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = analyzeJobRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
  }

  try {
    const provider = getAIProvider();
    const analysis = await provider.analyzeJobDescription(parsed.data.jobDescription);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("analyze-job failed", err);
    return NextResponse.json({ error: "Something went wrong analyzing the job description." }, { status: 500 });
  }
}

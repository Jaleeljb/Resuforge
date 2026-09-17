import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { tailorRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = tailorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
  }

  try {
    const provider = getAIProvider();
    const result = await provider.tailorResume({ resume: parsed.data.resume, job: parsed.data.job });
    return NextResponse.json(result);
  } catch (err) {
    console.error("tailor-resume failed", err);
    return NextResponse.json({ error: "Something went wrong tailoring the resume." }, { status: 500 });
  }
}

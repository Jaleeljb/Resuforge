import { NextRequest, NextResponse } from "next/server";
import { fitResumeRequestSchema } from "@/lib/validation/schemas";
import { fitResumeToOnePage } from "@/lib/export/fitOnePage";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = fitResumeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
  }

  const { resume, job, template } = parsed.data;

  try {
    const { resume: fitted, pages, trimmed, levelsApplied } = await fitResumeToOnePage(resume, job, template);
    return NextResponse.json({ resume: fitted, pages, trimmed, levelsApplied });
  } catch (err) {
    console.error("fit-resume failed", err);
    // Non-fatal: the UI falls back to showing the untrimmed resume with the
    // heuristic badge if this call fails, rather than blocking editing.
    return NextResponse.json({ error: "Could not verify one-page fit." }, { status: 500 });
  }
}

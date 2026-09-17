import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { validateClaimsRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = validateClaimsRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
  }

  try {
    const provider = getAIProvider();
    const claims = await provider.validateClaims(parsed.data);
    return NextResponse.json({ claims });
  } catch (err) {
    console.error("validate-resume failed", err);
    return NextResponse.json({ error: "Something went wrong validating the resume." }, { status: 500 });
  }
}

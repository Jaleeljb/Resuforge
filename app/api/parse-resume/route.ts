import { NextRequest, NextResponse } from "next/server";
import { getResumeParser } from "@/lib/parsing/resumeParser";
import { ALLOWED_UPLOAD_MIME, MAX_UPLOAD_BYTES } from "@/lib/validation/schemas";
import { sanitizeResume } from "@/lib/resume/sanitize";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is too large. Please upload a file under 5MB." }, { status: 413 });
  }

  const mimeType = file.type || "";
  const looksAllowed =
    ALLOWED_UPLOAD_MIME.includes(mimeType) ||
    /\.(txt|pdf|docx)$/i.test(file.name);
  if (!looksAllowed) {
    return NextResponse.json({ error: "Please upload a valid PDF, DOCX, or TXT file." }, { status: 415 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = getResumeParser(mimeType, file.name);
    const resume = await parser.parse(buffer);
    return NextResponse.json({ resume: sanitizeResume(resume) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse the uploaded resume.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

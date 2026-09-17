import { NextRequest, NextResponse } from "next/server";
import { exportRequestSchema } from "@/lib/validation/schemas";
import { buildResumeDocx } from "@/lib/export/docxExport";
import { autoFitOnePage } from "@/lib/resume/onePage";
import { validateRequiredSections } from "@/lib/export/validate";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = exportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
  }

  const { resume, job } = parsed.data;

  const blockingIssues = validateRequiredSections(resume).filter((i) => i.severity === "blocking");
  if (blockingIssues.length > 0) {
    return NextResponse.json({ error: blockingIssues[0].message, issues: blockingIssues }, { status: 422 });
  }

  try {
    const { resume: fitted } = autoFitOnePage(resume, job, 10);
    const buffer = await buildResumeDocx(fitted);
    const safeName = (fitted.personalInfo.name || "resume").replace(/[^a-z0-9]+/gi, "-").toLowerCase();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}-resume.docx"`,
      },
    });
  } catch (err) {
    console.error("export-docx failed", err);
    return NextResponse.json({ error: "Something went wrong generating the DOCX file." }, { status: 500 });
  }
}

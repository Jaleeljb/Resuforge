import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import React, { ReactElement } from "react";
import { exportRequestSchema } from "@/lib/validation/schemas";
import { PdfResumeDocument } from "@/lib/export/pdfDocument";
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

  const { resume, template, job } = parsed.data;

  const blockingIssues = validateRequiredSections(resume).filter((i) => i.severity === "blocking");
  if (blockingIssues.length > 0) {
    return NextResponse.json({ error: blockingIssues[0].message, issues: blockingIssues }, { status: 422 });
  }

  try {
    const fontSize = template === "compact-technical" ? 9.5 : template === "modern-ats" ? 10 : 10.5;
    const { resume: fitted } = autoFitOnePage(resume, job, fontSize);

    const buffer = await renderToBuffer(
      React.createElement(PdfResumeDocument, { resume: fitted, template }) as ReactElement<DocumentProps>
    );

    const safeName = (fitted.personalInfo.name || "resume").replace(/[^a-z0-9]+/gi, "-").toLowerCase();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}-resume.pdf"`,
      },
    });
  } catch (err) {
    console.error("export-pdf failed", err);
    return NextResponse.json({ error: "Something went wrong generating the PDF." }, { status: 500 });
  }
}

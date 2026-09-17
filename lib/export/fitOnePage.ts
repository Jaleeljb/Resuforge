import "server-only";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { Resume, TemplateId } from "@/types/resume";
import { JobAnalysis } from "@/types/job";
import { PdfResumeDocument } from "@/lib/export/pdfDocument";
import { autoFitOnePage } from "@/lib/resume/onePage";
import { applyDeeperTrim, MAX_TRIM_LEVEL } from "@/lib/resume/deeperTrim";
import { countPdfPages } from "@/lib/export/pdfPageCount";

export type FitResult = {
  resume: Resume;
  buffer: Buffer;
  pages: number;
  trimmed: boolean;
  levelsApplied: number;
};

function fontSizeFor(template: TemplateId): number {
  return template === "compact-technical" ? 9.5 : template === "modern-ats" ? 10 : 10.5;
}

async function renderPdf(resume: Resume, template: TemplateId): Promise<Buffer> {
  return renderToBuffer(
    React.createElement(PdfResumeDocument, { resume, template }) as React.ReactElement<DocumentProps>
  );
}

/**
 * Guarantees a genuinely one-page result (not just a heuristic estimate) by
 * actually rendering the PDF and counting its real pages, trimming harder
 * and re-rendering until it fits or a sane trim ceiling is reached. This is
 * the single source of truth used by PDF export, DOCX export (which reuses
 * the resulting `resume`), and the live preview endpoint, so what the user
 * sees always matches what they download.
 */
export async function fitResumeToOnePage(
  resume: Resume,
  job: JobAnalysis | undefined,
  template: TemplateId
): Promise<FitResult> {
  const fontSize = fontSizeFor(template);

  const heuristicPass = autoFitOnePage(resume, job, fontSize);
  let working = heuristicPass.resume;
  let buffer = await renderPdf(working, template);
  let pages = await countPdfPages(buffer);
  let levelsApplied = 0;
  let anyTrimApplied = heuristicPass.steps.length > 0;

  while (pages > 1 && levelsApplied <= MAX_TRIM_LEVEL) {
    working = applyDeeperTrim(working, levelsApplied, job);
    buffer = await renderPdf(working, template);
    pages = await countPdfPages(buffer);
    levelsApplied += 1;
    anyTrimApplied = true;
  }

  return {
    resume: working,
    buffer,
    pages,
    trimmed: anyTrimApplied,
    levelsApplied,
  };
}

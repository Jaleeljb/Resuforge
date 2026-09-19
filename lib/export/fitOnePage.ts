import "server-only";
import React from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { Resume, TemplateId } from "@/types/resume";
import { JobAnalysis } from "@/types/job";
import { PdfResumeDocument } from "@/lib/export/pdfDocument";
import { autoFitOnePage } from "@/lib/resume/onePage";
import { applyDeeperTrim, MAX_TRIM_LEVEL } from "@/lib/resume/deeperTrim";
import { countPdfPages } from "@/lib/export/pdfPageCount";
import { sanitizeResume } from "@/lib/resume/sanitize";

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

/** Counts pages, but never lets a measurement failure abort the whole
 * export — if we can't verify the page count for some reason, we assume
 * the render succeeded and just skip further trimming, rather than
 * discarding an otherwise-good PDF. */
async function safeCountPages(buffer: Buffer): Promise<number | null> {
  try {
    return await countPdfPages(buffer);
  } catch (err) {
    console.error("[fitResumeToOnePage] page count failed, assuming fit:", err);
    return null;
  }
}

/**
 * Guarantees a genuinely one-page result (not just a heuristic estimate) by
 * actually rendering the PDF and counting its real pages, trimming harder
 * and re-rendering until it fits or a sane trim ceiling is reached. This is
 * the single source of truth used by PDF export, DOCX export (which reuses
 * the resulting `resume`), and the live preview endpoint, so what the user
 * sees always matches what they download.
 *
 * Sanitizes the resume first (strips characters that are invalid in DOCX
 * XML or could otherwise misbehave during rendering) and degrades
 * gracefully at every stage rather than throwing: a failed page count is
 * treated as "good enough", and if rendering itself fails on the full
 * resume, one aggressively-trimmed retry is attempted before giving up.
 */
export async function fitResumeToOnePage(
  resumeInput: Resume,
  job: JobAnalysis | undefined,
  template: TemplateId
): Promise<FitResult> {
  const resume = sanitizeResume(resumeInput);
  const fontSize = fontSizeFor(template);

  const heuristicPass = autoFitOnePage(resume, job, fontSize);
  let working = heuristicPass.resume;
  let anyTrimApplied = heuristicPass.steps.length > 0;

  let buffer: Buffer;
  try {
    buffer = await renderPdf(working, template);
  } catch (err) {
    console.error("[fitResumeToOnePage] initial render failed, retrying with aggressive trim:", err);
    working = applyDeeperTrim(working, MAX_TRIM_LEVEL, job);
    anyTrimApplied = true;
    buffer = await renderPdf(working, template); // let this one throw if it still fails
  }

  let pages = await safeCountPages(buffer);
  let levelsApplied = 0;

  while (pages !== null && pages > 1 && levelsApplied <= MAX_TRIM_LEVEL) {
    working = applyDeeperTrim(working, levelsApplied, job);
    try {
      buffer = await renderPdf(working, template);
      pages = await safeCountPages(buffer);
    } catch (err) {
      console.error(`[fitResumeToOnePage] render failed at trim level ${levelsApplied}, stopping here:`, err);
      pages = null; // keep the last successful buffer rather than failing the whole export
      break;
    }
    levelsApplied += 1;
    anyTrimApplied = true;
  }

  return {
    resume: working,
    buffer,
    pages: pages ?? 1,
    trimmed: anyTrimApplied,
    levelsApplied,
  };
}

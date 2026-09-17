"use client";

/**
 * Extracts text from a PDF file entirely in the browser using pdfjs-dist —
 * the same rendering engine Chrome/Firefox use for their built-in PDF
 * viewers. This is deliberately done client-side rather than in a
 * serverless function: pdf.js needs its worker script plus cmap/standard-
 * font data to correctly decode text from PDFs with embedded or custom-
 * encoded fonts (extremely common in resumes exported from Word, Google
 * Docs, or design tools), and that combination is far more reliable in a
 * real browser than in a constrained serverless Node runtime.
 *
 * Assets are self-hosted under /public (copied from node_modules/pdfjs-dist
 * via scripts/copy-pdfjs-assets.mjs, run automatically on `npm install`).
 */
export async function extractPdfTextInBrowser(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: "/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/standard_fonts/",
  });

  const pdf = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Text items include position info; grouping by approximate vertical
    // position keeps line breaks roughly intact, which matters a lot for
    // our downstream heuristic resume parser (section headers, bullets).
    type Item = { str: string; transform: number[] };
    const items = content.items as Item[];

    let currentY: number | null = null;
    let line: string[] = [];
    const lines: string[] = [];

    for (const item of items) {
      const y = Math.round(item.transform[5]);
      if (currentY === null) currentY = y;
      if (Math.abs(y - currentY) > 3) {
        if (line.length > 0) lines.push(line.join(" ").replace(/\s+/g, " ").trim());
        line = [];
        currentY = y;
      }
      if (item.str) line.push(item.str);
    }
    if (line.length > 0) lines.push(line.join(" ").replace(/\s+/g, " ").trim());

    pageTexts.push(lines.filter(Boolean).join("\n"));
    page.cleanup();
  }

  await loadingTask.destroy();
  return pageTexts.join("\n\n").trim();
}

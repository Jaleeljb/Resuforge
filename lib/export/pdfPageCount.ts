import "server-only";

/**
 * Counts pages in a PDF buffer we generated ourselves (via react-pdf, which
 * emits an uncompressed page tree — verified: no /ObjStm object streams).
 *
 * This deliberately avoids any PDF-parsing library (pdf-parse/pdf.js). That
 * class of dependency needs font/cmap/WASM resources that are unreliable in
 * serverless environments — exactly what caused the earlier PDF-upload bug,
 * and reusing it here to measure our OWN output would silently break every
 * export (PDF and DOCX alike, since DOCX export also calls this to verify
 * one-page fit) if it ever failed to load on a given deployment.
 *
 * Instead we count `/Type /Page` object markers directly in the raw PDF
 * bytes — a standard, dependency-free technique — while explicitly
 * excluding `/Type /Pages` (the page-tree root, not a page). Falls back to
 * assuming 1 page if no markers are found at all, so a parsing surprise
 * degrades gracefully instead of throwing and breaking the whole export.
 */
export async function countPdfPages(buffer: Buffer): Promise<number> {
  const text = buffer.toString("latin1");
  const matches = text.match(/\/Type\s*\/Page(?!s)\b/g);
  return matches && matches.length > 0 ? matches.length : 1;
}

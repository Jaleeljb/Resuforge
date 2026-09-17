import "server-only";

/**
 * Counts pages in a PDF buffer we generated ourselves (via react-pdf, using
 * only standard base-14 fonts). This is a much safer use of pdf-parse than
 * parsing arbitrary uploaded PDFs: our own output never has the custom-font
 * or cmap issues that make third-party PDF text extraction unreliable, so
 * this page count can be trusted as ground truth.
 */
export async function countPdfPages(buffer: Buffer): Promise<number> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const info = await parser.getText();
    return info.pages?.length ?? 1;
  } finally {
    await parser.destroy();
  }
}

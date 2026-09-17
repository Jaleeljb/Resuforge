import "server-only";
import { Resume } from "@/types/resume";
import { parseResumeText } from "@/lib/parsing/textResumeParser";

export interface ResumeParser {
  parse(buffer: Buffer): Promise<Resume>;
}

export class PlainTextResumeParser implements ResumeParser {
  async parse(buffer: Buffer): Promise<Resume> {
    return parseResumeText(buffer.toString("utf-8"));
  }
}

export class DocxResumeParser implements ResumeParser {
  async parse(buffer: Buffer): Promise<Resume> {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return parseResumeText(result.value);
  }
}

export class PdfResumeParser implements ResumeParser {
  async parse(buffer: Buffer): Promise<Resume> {
    // pdf-parse is loaded dynamically and defensively: PDF text extraction
    // is best-effort in a serverless environment, especially for resumes
    // exported from design tools that store text as vector paths. If it
    // fails, we surface a clear error so the user can paste text instead.
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      await parser.destroy();
      if (!result.text || result.text.trim().length < 20) {
        throw new Error("No extractable text found in PDF");
      }
      return parseResumeText(result.text);
    } catch {
      throw new Error(
        "We couldn't reliably extract text from this PDF. Please paste your resume text instead, or upload a .docx/.txt file."
      );
    }
  }
}

export function getResumeParser(mimeType: string, filename: string): ResumeParser {
  const lower = filename.toLowerCase();
  if (mimeType.includes("pdf") || lower.endsWith(".pdf")) return new PdfResumeParser();
  if (mimeType.includes("wordprocessingml") || lower.endsWith(".docx")) return new DocxResumeParser();
  return new PlainTextResumeParser();
}

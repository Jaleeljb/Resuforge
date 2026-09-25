import { TemplateId } from "@/types/resume";

/**
 * The one place that defines what each resume template actually looks
 * like. The PDF export (react-pdf), the DOCX export (the `docx` library),
 * and the on-screen live preview (plain HTML/CSS) are three independent
 * rendering engines with no shared component tree — without a shared spec
 * like this, each one drifts its own font sizes/margins/colors over time
 * and the download stops matching what the user previewed.
 *
 * Sizes are expressed in points (pt) and inches — real physical units every
 * renderer can agree on — rather than raw pixels, so the browser preview
 * can convert them to on-screen pixels using the page's *actual* rendered
 * width (see ResumePreview.tsx) and end up proportionally identical to the
 * printed PDF, not just "close enough".
 */
export type TemplateSpec = {
  /** Generic family; each renderer maps this to its own concrete font name
   * (see PDF_FONT_STACKS / DOCX_FONT_STACKS / the .resume-font-* CSS
   * classes), since react-pdf, docx, and CSS don't share a font namespace. */
  fontFamily: "serif" | "sans";
  bodyPt: number;
  namePt: number;
  headingPt: number;
  /** Page margin, in inches, applied on all four sides. */
  marginIn: number;
  /** Hex colors WITHOUT a leading '#' (docx wants it bare; PDF/CSS callers
   * add the '#' themselves) so one value works everywhere. */
  accentColor: string;
  ruleColor: string;
};

/** Shared across every template: the thin rule under each section heading
 * (Summary, Experience, ...). Deliberately not part of TemplateSpec since
 * it never varies by template, only the per-template header rule does. */
export const SECTION_RULE_COLOR = "cfcabb";

export const TEMPLATE_SPECS: Record<TemplateId, TemplateSpec> = {
  classic: {
    fontFamily: "serif",
    bodyPt: 10.5,
    namePt: 19,
    headingPt: 12,
    marginIn: 0.75,
    accentColor: "1b3a5c",
    ruleColor: "333333",
  },
  "modern-ats": {
    fontFamily: "sans",
    bodyPt: 10,
    namePt: 18,
    headingPt: 11.5,
    marginIn: 0.6,
    accentColor: "1b3a5c",
    ruleColor: "1b3a5c",
  },
  "compact-technical": {
    fontFamily: "sans",
    bodyPt: 9.5,
    namePt: 16,
    headingPt: 11,
    marginIn: 0.5,
    accentColor: "2f5233",
    ruleColor: "555555",
  },
};

export const PDF_FONT_STACKS: Record<TemplateSpec["fontFamily"], { normal: "Times-Roman" | "Helvetica"; bold: "Times-Bold" | "Helvetica-Bold" }> = {
  serif: { normal: "Times-Roman", bold: "Times-Bold" },
  sans: { normal: "Helvetica", bold: "Helvetica-Bold" },
};

/** "Times New Roman" / "Arial" are what Word actually ships and are the
 * closest real-font match to react-pdf's built-in "Times-Roman" /
 * "Helvetica", so a downloaded DOCX reads the same as the downloaded PDF. */
export const DOCX_FONT_STACKS: Record<TemplateSpec["fontFamily"], string> = {
  serif: "Times New Roman",
  sans: "Arial",
};

/** Matches DOCX_FONT_STACKS / PDF_FONT_STACKS as closely as the web font
 * stack allows — Times New Roman first (not Georgia, which is a visibly
 * different, wider serif) so the live preview's "classic" template isn't
 * quietly a different typeface from the PDF/DOCX it produces. */
export const CSS_FONT_CLASS: Record<TemplateSpec["fontFamily"], string> = {
  serif: "resume-font-serif",
  sans: "resume-font-sans",
};

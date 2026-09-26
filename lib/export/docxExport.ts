import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from "docx";
import { Resume, TemplateId } from "@/types/resume";
import { TEMPLATE_SPECS, DOCX_FONT_STACKS, SECTION_RULE_COLOR, TemplateSpec } from "@/lib/resume/templateSpecs";

/** docx `size` is in half-points; round to the nearest half-point so the
 * pt values from templateSpecs.ts translate exactly (e.g. 10.5pt -> 21). */
function halfPt(pt: number): number {
  return Math.round(pt * 2);
}

function heading(text: string, spec: TemplateSpec, font: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: SECTION_RULE_COLOR.toUpperCase() } },
    children: [new TextRun({ text, bold: true, color: spec.accentColor.toUpperCase(), font, size: halfPt(spec.headingPt) })],
  });
}

function bullet(text: string, spec: TemplateSpec, font: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, font, size: halfPt(spec.bodyPt) })],
  });
}

export async function buildResumeDocx(resume: Resume, template: TemplateId = "classic"): Promise<Buffer> {
  const spec = TEMPLATE_SPECS[template];
  const font = DOCX_FONT_STACKS[spec.fontFamily];
  const bodySize = halfPt(spec.bodyPt);
  const dateSize = halfPt(spec.bodyPt - 0.5);
  const subSize = halfPt(spec.bodyPt - 0.3);
  const contactSize = halfPt(spec.bodyPt - 0.8);
  const marginTwips = Math.round(spec.marginIn * 1440);

  const { personalInfo } = resume;
  const contactParts = [personalInfo.location, personalInfo.phone, personalInfo.email, personalInfo.linkedin, personalInfo.portfolio].filter(Boolean);

  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: personalInfo.name || "Your Name", bold: true, size: halfPt(spec.namePt), font })],
    }),
  ];

  if (personalInfo.title) {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: personalInfo.title, size: halfPt(spec.bodyPt + 0.5), color: spec.accentColor.toUpperCase(), font })],
      })
    );
  }

  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: contactParts.join("   |   "), size: contactSize, font })],
    })
  );

  if (resume.summary) {
    children.push(heading("Summary", spec, font));
    children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: resume.summary, size: bodySize, font })] }));
  }

  if (resume.experience.length > 0) {
    children.push(heading("Experience", spec, font));
    for (const exp of resume.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          tabStops: [{ type: "right", position: 9000 }],
          children: [
            new TextRun({ text: `${exp.title}${exp.company ? `, ${exp.company}` : ""}`, bold: true, size: bodySize, font }),
            new TextRun({ text: `\t${[exp.startDate, exp.endDate].filter(Boolean).join(" – ")}`, size: dateSize, font }),
          ],
        })
      );
      if (exp.location) {
        children.push(new Paragraph({ children: [new TextRun({ text: exp.location, italics: true, size: subSize, font })] }));
      }
      for (const b of exp.bullets) children.push(bullet(b, spec, font));
    }
  }

  if (resume.skills.length > 0) {
    children.push(heading("Skills", spec, font));
    for (const cat of resume.skills) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${cat.category}: `, bold: true, size: bodySize, font }),
            new TextRun({ text: cat.items.join(", "), size: bodySize, font }),
          ],
        })
      );
    }
  }

  if (resume.projects.length > 0) {
    children.push(heading("Projects", spec, font));
    for (const p of resume.projects) {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({
              text: `${p.name}${p.technologies.length ? ` (${p.technologies.join(", ")})` : ""}`,
              bold: true,
              size: bodySize,
              font,
            }),
          ],
        })
      );
      for (const b of p.bullets) children.push(bullet(b, spec, font));
    }
  }

  if (resume.education.length > 0) {
    children.push(heading("Education", spec, font));
    for (const edu of resume.education) {
      children.push(
        new Paragraph({
          tabStops: [{ type: "right", position: 9000 }],
          children: [
            new TextRun({ text: `${edu.degree}${edu.institution ? `, ${edu.institution}` : ""}`, bold: true, size: bodySize, font }),
            new TextRun({ text: `\t${edu.graduationDate || ""}`, size: dateSize, font }),
          ],
        })
      );
    }
  }

  if (resume.certifications.length > 0) {
    children.push(heading("Certifications", spec, font));
    for (const c of resume.certifications) {
      children.push(bullet([c.name, c.issuer, c.date].filter(Boolean).join(" — "), spec, font));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: marginTwips, bottom: marginTwips, left: marginTwips, right: marginTwips },
          },
        },
        children,
      },
    ],
    styles: {
      default: {
        document: { run: { font, size: bodySize } },
      },
    },
  });

  return Packer.toBuffer(doc);
}

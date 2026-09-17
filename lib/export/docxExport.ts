import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from "docx";
import { Resume } from "@/types/resume";

const FONT = "Arial";

function heading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CFCABB" } },
    children: [new TextRun({ text, bold: true, color: "1B3A5C", font: FONT, size: 24 })],
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, font: FONT, size: 20 })],
  });
}

export async function buildResumeDocx(resume: Resume): Promise<Buffer> {
  const { personalInfo } = resume;
  const contactParts = [personalInfo.location, personalInfo.phone, personalInfo.email, personalInfo.linkedin, personalInfo.portfolio].filter(Boolean);

  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: personalInfo.name || "Your Name", bold: true, size: 40, font: FONT })],
    }),
  ];

  if (personalInfo.title) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: personalInfo.title, size: 22, color: "1B3A5C", font: FONT })] })
    );
  }

  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: contactParts.join("   |   "), size: 18, font: FONT })],
    })
  );

  if (resume.summary) {
    children.push(heading("Summary"));
    children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: resume.summary, size: 20, font: FONT })] }));
  }

  if (resume.experience.length > 0) {
    children.push(heading("Experience"));
    for (const exp of resume.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          tabStops: [{ type: "right", position: 9000 }],
          children: [
            new TextRun({ text: `${exp.title}${exp.company ? `, ${exp.company}` : ""}`, bold: true, size: 20, font: FONT }),
            new TextRun({ text: `\t${[exp.startDate, exp.endDate].filter(Boolean).join(" – ")}`, size: 18, font: FONT }),
          ],
        })
      );
      if (exp.location) {
        children.push(new Paragraph({ children: [new TextRun({ text: exp.location, italics: true, size: 18, font: FONT })] }));
      }
      for (const b of exp.bullets) children.push(bullet(b));
    }
  }

  if (resume.skills.length > 0) {
    children.push(heading("Skills"));
    for (const cat of resume.skills) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${cat.category}: `, bold: true, size: 20, font: FONT }),
            new TextRun({ text: cat.items.join(", "), size: 20, font: FONT }),
          ],
        })
      );
    }
  }

  if (resume.projects.length > 0) {
    children.push(heading("Projects"));
    for (const p of resume.projects) {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({
              text: `${p.name}${p.technologies.length ? ` (${p.technologies.join(", ")})` : ""}`,
              bold: true,
              size: 20,
              font: FONT,
            }),
          ],
        })
      );
      for (const b of p.bullets) children.push(bullet(b));
    }
  }

  if (resume.education.length > 0) {
    children.push(heading("Education"));
    for (const edu of resume.education) {
      children.push(
        new Paragraph({
          tabStops: [{ type: "right", position: 9000 }],
          children: [
            new TextRun({ text: `${edu.degree}${edu.institution ? `, ${edu.institution}` : ""}`, bold: true, size: 20, font: FONT }),
            new TextRun({ text: `\t${edu.graduationDate || ""}`, size: 18, font: FONT }),
          ],
        })
      );
    }
  }

  if (resume.certifications.length > 0) {
    children.push(heading("Certifications"));
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.certifications.map((c) => [c.name, c.issuer, c.date].filter(Boolean).join(" — ")).join("   |   "),
            size: 20,
            font: FONT,
          }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        children,
      },
    ],
    styles: {
      default: {
        document: { run: { font: FONT, size: 20 } },
      },
    },
  });

  return Packer.toBuffer(doc);
}

import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { Resume } from "@/types/resume";
import { TemplateId } from "@/types/resume";

type TemplateSpec = {
  font: "Times-Roman" | "Helvetica";
  boldFont: "Times-Bold" | "Helvetica-Bold";
  bodyPt: number;
  namePt: number;
  headingPt: number;
  marginIn: number;
  ruleColor: string;
  accentColor: string;
};

const TEMPLATES: Record<TemplateId, TemplateSpec> = {
  classic: {
    font: "Times-Roman",
    boldFont: "Times-Bold",
    bodyPt: 10.5,
    namePt: 19,
    headingPt: 12,
    marginIn: 0.75,
    ruleColor: "#333333",
    accentColor: "#1b3a5c",
  },
  "modern-ats": {
    font: "Helvetica",
    boldFont: "Helvetica-Bold",
    bodyPt: 10,
    namePt: 18,
    headingPt: 11.5,
    marginIn: 0.6,
    ruleColor: "#1b3a5c",
    accentColor: "#1b3a5c",
  },
  "compact-technical": {
    font: "Helvetica",
    boldFont: "Helvetica-Bold",
    bodyPt: 9.5,
    namePt: 16,
    headingPt: 11,
    marginIn: 0.5,
    ruleColor: "#555555",
    accentColor: "#2f5233",
  },
};

function buildStyles(spec: TemplateSpec) {
  return StyleSheet.create({
    page: {
      paddingTop: spec.marginIn * 72,
      paddingBottom: spec.marginIn * 72,
      paddingHorizontal: spec.marginIn * 72,
      fontFamily: spec.font,
      fontSize: spec.bodyPt,
      color: "#161616",
      lineHeight: 1.32,
    },
    name: {
      fontFamily: spec.boldFont,
      fontSize: spec.namePt,
      marginBottom: 1,
    },
    title: {
      fontSize: spec.bodyPt + 0.5,
      color: spec.accentColor,
      marginBottom: 3,
    },
    contactLine: {
      fontSize: spec.bodyPt - 0.8,
      color: "#333333",
      marginBottom: 8,
    },
    headerRule: {
      borderBottomWidth: 1.4,
      borderBottomColor: spec.ruleColor,
      marginBottom: 8,
    },
    section: {
      marginBottom: 8,
    },
    heading: {
      fontFamily: spec.boldFont,
      fontSize: spec.headingPt,
      color: spec.accentColor,
      marginBottom: 3,
      borderBottomWidth: 0.7,
      borderBottomColor: "#cfcabb",
      paddingBottom: 2,
    },
    entryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 1,
    },
    entryLeft: {
      fontFamily: spec.boldFont,
      fontSize: spec.bodyPt,
    },
    entrySub: {
      fontSize: spec.bodyPt - 0.3,
      fontStyle: "italic",
      marginBottom: 2,
    },
    dates: {
      fontSize: spec.bodyPt - 0.5,
      color: "#444444",
    },
    bulletRow: {
      flexDirection: "row",
      marginBottom: 1.5,
    },
    bulletMarker: {
      width: 10,
    },
    bulletText: {
      flex: 1,
    },
    skillRow: {
      marginBottom: 2,
    },
    skillCategory: {
      fontFamily: spec.boldFont,
    },
    summary: {
      marginBottom: 2,
    },
  });
}

export function PdfResumeDocument({ resume, template }: { resume: Resume; template: TemplateId }) {
  const spec = TEMPLATES[template];
  const styles = buildStyles(spec);
  const { personalInfo } = resume;

  const contactParts = [personalInfo.location, personalInfo.phone, personalInfo.email, personalInfo.linkedin, personalInfo.portfolio].filter(Boolean);

  return (
    <Document title={`${personalInfo.name} - Resume`}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.name}>{personalInfo.name || "Your Name"}</Text>
        {personalInfo.title ? <Text style={styles.title}>{personalInfo.title}</Text> : null}
        <Text style={styles.contactLine}>{contactParts.join("   |   ")}</Text>
        <View style={styles.headerRule} />

        {resume.summary ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Summary</Text>
            <Text style={styles.summary}>{resume.summary}</Text>
          </View>
        ) : null}

        {resume.experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Experience</Text>
            {resume.experience.map((exp) => (
              <View key={exp.id} style={{ marginBottom: 5 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryLeft}>
                    {exp.title}
                    {exp.company ? `, ${exp.company}` : ""}
                  </Text>
                  <Text style={styles.dates}>
                    {[exp.startDate, exp.endDate].filter(Boolean).join(" – ")}
                  </Text>
                </View>
                {exp.location ? <Text style={styles.entrySub}>{exp.location}</Text> : null}
                {exp.bullets.map((b, i) => (
                  <View style={styles.bulletRow} key={i}>
                    <Text style={styles.bulletMarker}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {resume.skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Skills</Text>
            {resume.skills.map((cat) => (
              <Text key={cat.id} style={styles.skillRow}>
                <Text style={styles.skillCategory}>{cat.category}: </Text>
                {cat.items.join(", ")}
              </Text>
            ))}
          </View>
        ) : null}

        {resume.projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Projects</Text>
            {resume.projects.map((p) => (
              <View key={p.id} style={{ marginBottom: 4 }}>
                <View style={styles.entryRow}>
                  <Text style={styles.entryLeft}>
                    {p.name}
                    {p.technologies.length > 0 ? ` (${p.technologies.join(", ")})` : ""}
                  </Text>
                </View>
                {p.bullets.map((b, i) => (
                  <View style={styles.bulletRow} key={i}>
                    <Text style={styles.bulletMarker}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {resume.education.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Education</Text>
            {resume.education.map((edu) => (
              <View style={styles.entryRow} key={edu.id}>
                <Text style={styles.entryLeft}>
                  {edu.degree}
                  {edu.institution ? `, ${edu.institution}` : ""}
                </Text>
                <Text style={styles.dates}>{edu.graduationDate}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {resume.certifications.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Certifications</Text>
            <Text>
              {resume.certifications
                .map((c) => [c.name, c.issuer, c.date].filter(Boolean).join(" — "))
                .join("   |   ")}
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

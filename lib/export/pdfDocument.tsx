import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { Resume } from "@/types/resume";
import { TemplateId } from "@/types/resume";
import { TEMPLATE_SPECS, PDF_FONT_STACKS, SECTION_RULE_COLOR, TemplateSpec } from "@/lib/resume/templateSpecs";

function buildStyles(spec: TemplateSpec) {
  const fonts = PDF_FONT_STACKS[spec.fontFamily];
  return StyleSheet.create({
    page: {
      paddingTop: spec.marginIn * 72,
      paddingBottom: spec.marginIn * 72,
      paddingHorizontal: spec.marginIn * 72,
      fontFamily: fonts.normal,
      fontSize: spec.bodyPt,
      color: "#161616",
      lineHeight: 1.32,
    },
    name: {
      fontFamily: fonts.bold,
      fontSize: spec.namePt,
      marginBottom: 1,
    },
    title: {
      fontSize: spec.bodyPt + 0.5,
      color: `#${spec.accentColor}`,
      marginBottom: 3,
    },
    contactLine: {
      fontSize: spec.bodyPt - 0.8,
      color: "#333333",
      marginBottom: 8,
    },
    headerRule: {
      borderBottomWidth: 1.4,
      borderBottomColor: `#${spec.ruleColor}`,
      marginBottom: 8,
    },
    section: {
      marginBottom: 8,
    },
    heading: {
      fontFamily: fonts.bold,
      fontSize: spec.headingPt,
      color: `#${spec.accentColor}`,
      marginBottom: 3,
      borderBottomWidth: 0.7,
      borderBottomColor: `#${SECTION_RULE_COLOR}`,
      paddingBottom: 2,
    },
    entryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 1,
    },
    entryLeft: {
      fontFamily: fonts.bold,
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
      fontFamily: fonts.bold,
    },
    summary: {
      marginBottom: 2,
    },
  });
}

export function PdfResumeDocument({ resume, template }: { resume: Resume; template: TemplateId }) {
  const spec = TEMPLATE_SPECS[template];
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

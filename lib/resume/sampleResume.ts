import { Resume } from "@/types/resume";

/**
 * A representative cybersecurity/SOC-oriented resume used to power the
 * "Try a sample resume" demo path and as a fixture for tests. It is
 * original placeholder content, not copied from any real person's resume.
 */
export const SAMPLE_RESUME: Resume = {
  personalInfo: {
    name: "Jordan Ellis",
    title: "Security Operations Analyst",
    email: "jordan.ellis@example.com",
    phone: "(555) 210-4478",
    location: "Austin, TX",
    linkedin: "linkedin.com/in/jordanellis",
    portfolio: "github.com/jellis-sec",
  },
  summary:
    "Cybersecurity professional with hands-on SOC internship and academic project experience in security monitoring, incident response, and vulnerability management. Skilled in SIEM-based alert triage, endpoint and network security, and cloud security fundamentals on AWS. Builds practical security automation to reduce manual investigation time.",
  experience: [
    {
      id: "exp-1",
      company: "Meridian Financial Group",
      title: "SOC Analyst Intern",
      location: "Austin, TX",
      startDate: "May 2025",
      endDate: "Aug 2025",
      bullets: [
        "Monitored security events and SIEM alerts across endpoint and network sources, escalating confirmed incidents to senior analysts.",
        "Performed vulnerability assessments and risk analysis to identify and remediate security gaps across 40+ endpoints.",
        "Supported incident response investigations by correlating logs in the SIEM and mapping activity to MITRE ATT&CK techniques.",
        "Assisted with security audits against ISO 27001 controls and documented third-party risk management findings for vendor reviews.",
        "Used Microsoft Defender and endpoint protection tooling to investigate malware alerts and contain affected hosts.",
      ],
    },
    {
      id: "exp-2",
      company: "University IT Security Office",
      title: "Student Security Technician",
      location: "Austin, TX",
      startDate: "Sep 2024",
      endDate: "May 2025",
      bullets: [
        "Reviewed network security events and DNS logs to identify anomalous traffic on university systems.",
        "Configured multi-factor authentication (MFA) for staff accounts and supported Active Directory access reviews.",
        "Documented incident response playbooks used by the student security team for common phishing scenarios.",
      ],
    },
  ],
  skills: [
    { id: "sk-1", category: "Security Operations", items: ["Security Monitoring", "Incident Response", "Alert Triage", "Vulnerability Management", "Threat Hunting"] },
    { id: "sk-2", category: "Security Tools", items: ["SIEM", "Microsoft Defender", "Endpoint Security", "Wireshark"] },
    { id: "sk-3", category: "Cloud & Identity", items: ["AWS", "Cloud Security", "MFA", "Identity and Access Management"] },
    { id: "sk-4", category: "Systems & Networking", items: ["Windows", "Linux", "TCP/IP", "DNS", "Network Security", "Active Directory"] },
    { id: "sk-5", category: "Frameworks & Compliance", items: ["MITRE ATT&CK", "OWASP Top 10", "ISO 27001", "Security Audits", "Third-Party Risk Management"] },
  ],
  projects: [
    {
      id: "proj-1",
      name: "OSINT Threat Enrichment Automation",
      url: "github.com/jellis-sec/osint-enrichment",
      technologies: ["Python", "REST API", "OSINT"],
      bullets: [
        "Integrated 11+ threat intelligence APIs to automate IOC enrichment and OSINT lookups for suspicious indicators.",
        "Reduced average investigation time by 83%, from 30 minutes to 5 minutes, by automating manual lookup steps.",
        "Built a lightweight security automation pipeline to flag high-confidence indicators for analyst review.",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "B.S. in Cybersecurity",
      institution: "University of Texas at Austin",
      location: "Austin, TX",
      graduationDate: "May 2025",
      details: [],
    },
  ],
  certifications: [
    { id: "cert-1", name: "CompTIA Security+", issuer: "CompTIA", date: "2024" },
    { id: "cert-2", name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", date: "2025" },
  ],
};

export const SAMPLE_JOB_DESCRIPTION = `Security Operations Analyst

About the role:
We're looking for a Security Operations Analyst to join our growing security team in a fast-paced environment.

Responsibilities:
- Monitor SIEM alerts and investigate security incidents
- Perform vulnerability assessments and support remediation
- Conduct threat analysis and support incident response
- Work with Microsoft Defender and endpoint protection tools
- Analyze network security events and DNS traffic
- Support on-call rotation for critical alerts

Requirements:
- 1-2 years of experience in a SOC or security analyst role
- Hands-on experience with SIEM platforms
- Familiarity with MITRE ATT&CK framework
- Experience with incident response and vulnerability management
- Strong understanding of network security fundamentals

Preferred:
- Experience with Splunk
- CompTIA Security+ or similar certification
- Familiarity with AWS cloud security
- Scripting experience with Python
`;

export type SkillCategory =
  | "security-tool"
  | "security-domain"
  | "cloud"
  | "platform"
  | "language"
  | "framework"
  | "networking"
  | "data"
  | "soft-skill"
  | "certification"
  | "process"
  | "general-tool";

export type DictionaryEntry = {
  canonical: string;
  category: SkillCategory;
  /** Alternate phrasings that should resolve to the canonical term (semantic match). */
  synonyms: string[];
};

// A broad, extensible dictionary. Security/SOC terms are covered in depth
// (matching the reference resume's domain), with enough general
// software/cloud/data/soft-skill coverage that non-security job
// descriptions still extract sensibly.
export const DICTIONARY: DictionaryEntry[] = [
  // --- Security domain & operations ---
  { canonical: "Security Monitoring", category: "security-domain", synonyms: ["monitor security events", "security event monitoring", "monitored security alerts", "24/7 monitoring", "security surveillance"] },
  { canonical: "Incident Response", category: "security-domain", synonyms: ["incident handling", "security incident response", "respond to incidents", "ir process", "breach response"] },
  { canonical: "Vulnerability Management", category: "security-domain", synonyms: ["vulnerability assessment", "vuln management", "patch management", "vulnerability scanning", "vulnerability remediation"] },
  { canonical: "Security Risk Assessment", category: "security-domain", synonyms: ["risk assessment", "security risk analysis", "risk analysis", "threat and risk assessment"] },
  { canonical: "Threat Intelligence", category: "security-domain", synonyms: ["threat intel", "cyber threat intelligence", "threat feeds", "ioc analysis", "indicators of compromise"] },
  { canonical: "Threat Hunting", category: "security-domain", synonyms: ["proactive threat detection", "hunt for threats", "threat detection"] },
  { canonical: "Alert Triage", category: "security-domain", synonyms: ["triage alerts", "alert investigation", "security alert triage"] },
  { canonical: "Endpoint Security", category: "security-domain", synonyms: ["endpoint protection", "edr", "endpoint detection and response"] },
  { canonical: "Network Security", category: "security-domain", synonyms: ["network defense", "securing networks", "network security events", "firewall management"] },
  { canonical: "Cloud Security", category: "security-domain", synonyms: ["securing cloud environments", "cloud security posture"] },
  { canonical: "Security Operations", category: "security-domain", synonyms: ["soc", "security operations center", "socanalyst"] },
  { canonical: "Security Audits", category: "security-domain", synonyms: ["security audit", "compliance audit", "conducted audits"] },
  { canonical: "Third-Party Risk Management", category: "security-domain", synonyms: ["vendor risk management", "supply chain risk", "tprm"] },
  { canonical: "OSINT", category: "security-domain", synonyms: ["open source intelligence", "open-source intelligence"] },
  { canonical: "Security Automation", category: "security-domain", synonyms: ["automate security workflows", "soar", "security orchestration"] },
  { canonical: "Digital Forensics", category: "security-domain", synonyms: ["forensic analysis", "dfir"] },
  { canonical: "Penetration Testing", category: "security-domain", synonyms: ["pen testing", "pentest", "ethical hacking"] },
  { canonical: "Identity and Access Management", category: "security-domain", synonyms: ["iam", "access management", "privileged access management"] },
  { canonical: "Data Loss Prevention", category: "security-domain", synonyms: ["dlp"] },
  { canonical: "Phishing Analysis", category: "security-domain", synonyms: ["phishing investigation", "email security analysis"] },

  // --- Security tools/frameworks ---
  { canonical: "SIEM", category: "security-tool", synonyms: ["security information and event management", "siem platform", "siem alerts", "siem correlation rules", "siem tools"] },
  { canonical: "Splunk", category: "security-tool", synonyms: [] },
  { canonical: "Microsoft Sentinel", category: "security-tool", synonyms: ["azure sentinel"] },
  { canonical: "QRadar", category: "security-tool", synonyms: ["ibm qradar"] },
  { canonical: "Microsoft Defender", category: "security-tool", synonyms: ["windows defender", "defender for endpoint", "ms defender"] },
  { canonical: "CrowdStrike", category: "security-tool", synonyms: ["crowdstrike falcon"] },
  { canonical: "Wireshark", category: "security-tool", synonyms: ["packet analysis"] },
  { canonical: "Nessus", category: "security-tool", synonyms: ["tenable nessus"] },
  { canonical: "Nmap", category: "security-tool", synonyms: [] },
  { canonical: "Metasploit", category: "security-tool", synonyms: [] },
  { canonical: "MITRE ATT&CK", category: "security-tool", synonyms: ["mitre attack framework", "att&ck framework", "mitre framework"] },
  { canonical: "OWASP Top 10", category: "security-tool", synonyms: ["owasp", "owasp top ten"] },
  { canonical: "ISO 27001", category: "security-tool", synonyms: ["iso27001", "iso 27001 compliance"] },
  { canonical: "NIST", category: "security-tool", synonyms: ["nist framework", "nist csf", "nist 800-53"] },
  { canonical: "SOC 2", category: "security-tool", synonyms: ["soc2"] },
  { canonical: "PCI DSS", category: "security-tool", synonyms: ["pci compliance"] },

  // --- Certifications ---
  { canonical: "CompTIA Security+", category: "certification", synonyms: ["security+", "comptia sec+"] },
  { canonical: "CISSP", category: "certification", synonyms: ["certified information systems security professional"] },
  { canonical: "CEH", category: "certification", synonyms: ["certified ethical hacker"] },
  { canonical: "CySA+", category: "certification", synonyms: ["comptia cysa+"] },
  { canonical: "GSEC", category: "certification", synonyms: ["giac security essentials"] },
  { canonical: "AWS Certified", category: "certification", synonyms: ["aws certification", "aws solutions architect", "aws certified cloud practitioner"] },
  { canonical: "Microsoft Certified", category: "certification", synonyms: ["az-900", "az-500", "microsoft certification"] },

  // --- Cloud / platforms ---
  { canonical: "AWS", category: "cloud", synonyms: ["amazon web services"] },
  { canonical: "Azure", category: "cloud", synonyms: ["microsoft azure"] },
  { canonical: "Google Cloud Platform", category: "cloud", synonyms: ["gcp"] },
  { canonical: "MFA", category: "cloud", synonyms: ["multi-factor authentication", "two-factor authentication", "2fa"] },
  { canonical: "Docker", category: "platform", synonyms: ["containerization", "containers"] },
  { canonical: "Kubernetes", category: "platform", synonyms: ["k8s"] },

  // --- Networking / systems ---
  { canonical: "Windows", category: "networking", synonyms: ["windows server", "windows os"] },
  { canonical: "Linux", category: "networking", synonyms: ["unix", "linux administration"] },
  { canonical: "TCP/IP", category: "networking", synonyms: ["tcp ip", "tcp/ip protocols"] },
  { canonical: "DNS", category: "networking", synonyms: ["domain name system"] },
  { canonical: "VPN", category: "networking", synonyms: ["virtual private network"] },
  { canonical: "Active Directory", category: "networking", synonyms: ["ad", "active directory administration"] },

  // --- General languages / data / dev (kept broad so non-security JDs still extract) ---
  { canonical: "Python", category: "language", synonyms: ["python scripting", "python automation"] },
  { canonical: "SQL", category: "language", synonyms: ["structured query language"] },
  { canonical: "JavaScript", category: "language", synonyms: ["js"] },
  { canonical: "TypeScript", category: "language", synonyms: ["ts"] },
  { canonical: "Bash", category: "language", synonyms: ["shell scripting", "bash scripting"] },
  { canonical: "PowerShell", category: "language", synonyms: ["powershell scripting"] },
  { canonical: "REST API", category: "framework", synonyms: ["rest apis", "restful api", "api integration"] },
  { canonical: "Git", category: "general-tool", synonyms: ["version control", "github", "gitlab"] },
  { canonical: "Jira", category: "general-tool", synonyms: ["atlassian jira"] },
  { canonical: "Excel", category: "general-tool", synonyms: ["microsoft excel", "spreadsheets"] },
  { canonical: "Data Analysis", category: "data", synonyms: ["analyzing data", "data analytics"] },

  // --- Process / methodology ---
  { canonical: "Agile", category: "process", synonyms: ["scrum", "agile methodology"] },
  { canonical: "Documentation", category: "process", synonyms: ["technical documentation", "document processes", "runbooks", "playbooks"] },
  { canonical: "Cross-functional Collaboration", category: "process", synonyms: ["cross-functional teams", "collaborate across teams", "worked cross-functionally"] },

  // --- Soft skills ---
  { canonical: "Communication", category: "soft-skill", synonyms: ["verbal and written communication", "communicate findings", "stakeholder communication"] },
  { canonical: "Problem Solving", category: "soft-skill", synonyms: ["analytical thinking", "critical thinking", "troubleshooting"] },
  { canonical: "Attention to Detail", category: "soft-skill", synonyms: ["detail-oriented", "meticulous"] },
  { canonical: "Time Management", category: "soft-skill", synonyms: ["prioritization", "managing multiple priorities"] },
  { canonical: "Leadership", category: "soft-skill", synonyms: ["led a team", "mentored", "team leadership"] },
  { canonical: "Stakeholder Management", category: "soft-skill", synonyms: ["worked with stakeholders", "executive communication"] },
];

export const SOFT_SKILL_TERMS = DICTIONARY.filter((d) => d.category === "soft-skill").map((d) => d.canonical);
export const CERTIFICATION_TERMS = DICTIONARY.filter((d) => d.category === "certification").map((d) => d.canonical);

export const ACTION_VERBS = [
  "led", "managed", "built", "developed", "designed", "implemented", "automated",
  "monitored", "investigated", "analyzed", "identified", "remediated", "resolved",
  "reduced", "improved", "increased", "optimized", "coordinated", "supported",
  "conducted", "performed", "assessed", "documented", "collaborated", "responded",
  "triaged", "configured", "deployed", "maintained", "trained", "mentored",
  "presented", "audited", "detected", "prevented", "escalated", "streamlined",
];

export const GENERIC_FILLER_PHRASES = [
  "hardworking individual",
  "team player",
  "passionate professional",
  "go-getter",
  "self-starter with a passion",
  "results-oriented professional",
  "detail-oriented team player",
];

export const HIDDEN_SIGNAL_PATTERNS: { pattern: RegExp; signal: string }[] = [
  { pattern: /on[-\s]?call/i, signal: "On-call rotation expected" },
  { pattern: /fast[-\s]?paced/i, signal: "Fast-paced environment" },
  { pattern: /wear(?:ing|s)? many hats/i, signal: "Broad, generalist scope expected" },
  { pattern: /start[-\s]?up/i, signal: "Startup environment" },
  { pattern: /regulated industry|compliance[-\s]?driven/i, signal: "Regulated / compliance-driven environment" },
  { pattern: /24\/7|around[-\s]?the[-\s]?clock/i, signal: "24/7 coverage expected" },
  { pattern: /cross[-\s]?functional/i, signal: "Heavy cross-team collaboration" },
  { pattern: /travel required|willing to travel/i, signal: "Travel required" },
  { pattern: /clearance/i, signal: "Security clearance may be required" },
  { pattern: /shift work|rotating shift|night shift/i, signal: "Shift-based schedule" },
];

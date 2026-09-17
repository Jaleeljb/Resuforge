import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResumeForge AI — One-Page ATS Resume Tailor",
  description:
    "Paste a job description, analyze your resume, and generate a truthful, job-specific one-page resume with transparent ATS alignment scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

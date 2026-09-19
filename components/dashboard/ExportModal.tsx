"use client";

import React, { useEffect, useState } from "react";
import { Resume, TemplateId } from "@/types/resume";
import { JobAnalysis } from "@/types/job";
import { ClaimValidation } from "@/types/ats";
import { Button } from "@/components/ui/Button";
import { validateForExport, ExportIssue } from "@/lib/export/validate";
import { X, Download, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const TEMPLATES: { id: TemplateId; label: string; blurb: string }[] = [
  { id: "classic", label: "Classic", blurb: "Minimal, traditional corporate resume." },
  { id: "modern-ats", label: "Modern ATS", blurb: "Contemporary but still parser-friendly." },
  { id: "compact-technical", label: "Compact Technical", blurb: "Denser layout for technical/security roles." },
];

export function ExportModal({
  resume,
  job,
  claims,
  onClose,
}: {
  resume: Resume;
  job: JobAnalysis | null;
  claims: ClaimValidation[];
  onClose: () => void;
}) {
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [issues, setIssues] = useState<ExportIssue[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIssues(validateForExport(resume, claims));
  }, [resume, claims]);

  const blockingIssues = issues.filter((i) => i.severity === "blocking");
  const warnings = issues.filter((i) => i.severity === "warning");
  const canExport = blockingIssues.length === 0 && (warnings.length === 0 || acknowledged);

  async function handleDownload(format: "pdf" | "docx") {
    if (!canExport) return;
    setDownloading(format);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(`/api/export-${format}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume, template, job: job || undefined }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(data.error || `Export failed (HTTP ${res.status}). Please try again.`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (resume.personalInfo.name || "resume").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      a.download = `${safeName}-resume.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Export timed out. Try removing some content or simplifying formatting, then try again.");
      } else {
        setError(err instanceof Error ? err.message : "Export failed.");
      }
    } finally {
      clearTimeout(timeout);
      setDownloading(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-paper-alt rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-serif text-lg">Export Resume</h3>
          <button onClick={onClose} className="text-ink-soft hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-medium text-ink-soft mb-2">Template</p>
            <div className="grid grid-cols-1 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    "text-left border rounded-md px-3 py-2 transition-colors",
                    template === t.id ? "border-navy bg-navy-soft/30" : "border-line hover:bg-black/[0.02]"
                  )}
                >
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-ink-soft">{t.blurb}</p>
                </button>
              ))}
            </div>
          </div>

          {blockingIssues.length > 0 && (
            <div className="bg-clay-soft border border-clay/30 rounded-md p-3 space-y-1">
              {blockingIssues.map((issue, i) => (
                <p key={i} className="text-xs text-clay flex items-start gap-1.5">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {issue.message}
                </p>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="bg-brass-soft border border-brass/30 rounded-md p-3 space-y-2">
              {warnings.map((issue, i) => (
                <p key={i} className="text-xs text-brass flex items-start gap-1.5">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {issue.message}
                </p>
              ))}
              <label className="flex items-center gap-2 text-xs text-ink pt-1">
                <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
                I&rsquo;ve reviewed these warnings and want to export anyway.
              </label>
            </div>
          )}

          {issues.length === 0 && (
            <p className="text-xs text-forest flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Resume Ready — no issues found.
            </p>
          )}

          {error && <p className="text-xs text-clay">{error}</p>}

          <div className="flex gap-2">
            <Button className="flex-1" disabled={!canExport || downloading !== null} onClick={() => handleDownload("pdf")}>
              {downloading === "pdf" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Download PDF
            </Button>
            <Button className="flex-1" variant="outline" disabled={!canExport || downloading !== null} onClick={() => handleDownload("docx")}>
              {downloading === "docx" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Download DOCX
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

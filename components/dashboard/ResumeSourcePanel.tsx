"use client";

import React, { useRef, useState } from "react";
import { Resume } from "@/types/resume";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Primitives";
import { SAMPLE_RESUME } from "@/lib/resume/sampleResume";
import { Upload, FileText, Sparkles, Loader2 } from "lucide-react";

type Mode = "upload" | "paste" | "sample";

export function ResumeSourcePanel({ onResumeLoaded }: { onResumeLoaded: (resume: Resume) => void }) {
  const [mode, setMode] = useState<Mode>("paste");
  const [pasteText, setPasteText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse resume.");
      onResumeLoaded(data.resume as Resume);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please upload a valid PDF or DOCX file.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasteSubmit() {
    if (pasteText.trim().length < 30) {
      setError("Paste your full resume text to continue.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const blob = new Blob([pasteText], { type: "text/plain" });
      const file = new File([blob], "resume.txt", { type: "text/plain" });
      await handleFile(file);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Your Resume" subtitle="Used as the factual source of truth — nothing here gets invented." />
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          {(["paste", "upload", "sample"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                mode === m ? "bg-navy text-paper-alt border-navy" : "border-line text-ink-soft hover:bg-black/5"
              }`}
            >
              {m === "paste" ? "Paste text" : m === "upload" ? "Upload file" : "Try a sample"}
            </button>
          ))}
        </div>

        {mode === "paste" && (
          <div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your full resume text here (contact info, summary, experience, skills, education...)"
              className="w-full h-40 border border-line rounded-md p-3 text-sm bg-paper focus:bg-white outline-none focus:border-navy resize-none"
            />
            <Button className="mt-3" onClick={handlePasteSubmit} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Use this resume
            </Button>
          </div>
        )}

        {mode === "upload" && (
          <div
            className="border border-dashed border-line rounded-md p-8 text-center cursor-pointer hover:border-navy/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {loading ? (
              <Loader2 size={20} className="animate-spin mx-auto text-navy" />
            ) : (
              <>
                <Upload size={20} className="mx-auto text-navy/70 mb-2" />
                <p className="text-sm text-ink">Drop a PDF, DOCX, or TXT file here, or click to browse</p>
                <p className="text-xs text-ink-soft mt-1">Max 5MB. PDF text extraction is best-effort.</p>
              </>
            )}
          </div>
        )}

        {mode === "sample" && (
          <div className="text-sm">
            <p className="text-ink-soft mb-3">Load a sample cybersecurity/SOC resume to explore the workflow.</p>
            <Button variant="secondary" onClick={() => onResumeLoaded(SAMPLE_RESUME)}>
              <Sparkles size={14} /> Load sample resume
            </Button>
          </div>
        )}

        {error && <p className="text-xs text-clay mt-3">{error}</p>}
      </div>
    </Card>
  );
}

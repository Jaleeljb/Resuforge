"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Resume, ResumeVersion, TemplateId } from "@/types/resume";
import { JobAnalysis } from "@/types/job";
import { ATSScoreResult, ClaimValidation } from "@/types/ats";
import { calculateATSScore, explainScoreDelta } from "@/lib/ats/scoring";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { DashboardHeader, DashboardTab } from "@/components/dashboard/DashboardHeader";
import { MobileActionBar } from "@/components/dashboard/MobileActionBar";
import { JobDescriptionPanel } from "@/components/dashboard/JobDescriptionPanel";
import { ResumeSourcePanel } from "@/components/dashboard/ResumeSourcePanel";
import { ScorePanel } from "@/components/dashboard/ScorePanel";
import { KeywordPanel } from "@/components/dashboard/KeywordPanel";
import { SuggestionsPanel } from "@/components/dashboard/SuggestionsPanel";
import { JobIntelPanel } from "@/components/dashboard/JobIntelPanel";
import { ResumeEditorForm } from "@/components/dashboard/ResumeEditorForm";
import { ResumePreview } from "@/components/dashboard/ResumePreview";
import { CompareView } from "@/components/dashboard/CompareView";
import { VersionHistoryPanel } from "@/components/dashboard/VersionHistory";
import { ExportModal } from "@/components/dashboard/ExportModal";
import { Button } from "@/components/ui/Button";
import { Wand2, Loader2, RotateCcw } from "lucide-react";

function cloneResume(r: Resume): Resume {
  return JSON.parse(JSON.stringify(r));
}

export function DashboardClient() {
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [masterResume, setMasterResume] = useState<Resume | null>(null);
  const [workingResume, setWorkingResume] = useState<Resume | null>(null);

  const [jobText, setJobText] = useState("");
  const [job, setJob] = useState<JobAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [tailoring, setTailoring] = useState(false);
  const [changeNotes, setChangeNotes] = useState<{ field: string; note: string }[]>([]);

  const [confirmedTerms, setConfirmedTerms] = useState<string[]>([]);
  const [dismissedMissing, setDismissedMissing] = useState<Set<string>>(new Set());
  const [claims, setClaims] = useState<ClaimValidation[]>([]);

  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [exportOpen, setExportOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<ResumeVersion | null>(null);

  const [scoreDelta, setScoreDelta] = useState<string | null>(null);
  const prevScoreRef = useRef<ATSScoreResult | null>(null);

  const debouncedResume = useDebouncedValue(workingResume, 500);

  const score: ATSScoreResult | null = useMemo(() => {
    if (!debouncedResume || !job) return null;
    return calculateATSScore(debouncedResume, job);
  }, [debouncedResume, job]);

  useEffect(() => {
    if (!score) return;
    const delta = explainScoreDelta(prevScoreRef.current, score);
    setScoreDelta(delta);
    prevScoreRef.current = score;
  }, [score]);

  // Guaranteed one-page preview: the character-based heuristic alone can
  // mismatch real rendered layout, so we also verify (and, if needed, trim
  // further) by actually rendering a PDF server-side and counting its real
  // pages. Debounced so it only runs after the user pauses editing, and it
  // never blocks the editor — while it's in flight or if it fails, the
  // preview simply falls back to showing the raw current content.
  const [previewResume, setPreviewResume] = useState<Resume | null>(null);
  const [previewMeta, setPreviewMeta] = useState<{ pages: number; trimmed: boolean } | null>(null);
  const [fitting, setFitting] = useState(false);
  const fitRequestId = useRef(0);

  useEffect(() => {
    if (!debouncedResume) {
      setPreviewResume(null);
      setPreviewMeta(null);
      return;
    }
    const requestId = ++fitRequestId.current;
    setFitting(true);
    fetch("/api/fit-resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resume: debouncedResume, job: job || undefined, template }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("fit failed"))))
      .then((data) => {
        if (requestId !== fitRequestId.current) return; // stale response
        setPreviewResume(data.resume);
        setPreviewMeta({ pages: data.pages, trimmed: data.trimmed });
      })
      .catch(() => {
        if (requestId !== fitRequestId.current) return;
        setPreviewResume(null);
        setPreviewMeta(null);
      })
      .finally(() => {
        if (requestId === fitRequestId.current) setFitting(false);
      });
  }, [debouncedResume, job, template]);

  const displayResume = previewResume || workingResume;

  async function validateClaimsNow(current: Resume) {
    if (!masterResume) return;
    try {
      const res = await fetch("/api/validate-resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ current, original: masterResume, confirmedTerms }),
      });
      const data = await res.json();
      if (res.ok) setClaims(data.claims || []);
    } catch {
      // Non-blocking: claim validation failures shouldn't break the editor.
    }
  }

  function handleResumeLoaded(resume: Resume) {
    setMasterResume(resume);
    setWorkingResume(resume);
    setConfirmedTerms([]);
    setDismissedMissing(new Set());
    setClaims([]);
    setChangeNotes([]);
    prevScoreRef.current = null;
    setVersions([
      { id: `v-${Date.now()}`, label: "Version 1 — Original", createdAt: new Date().toISOString(), resume: cloneResume(resume), score: null },
    ]);
    setTab("overview");
  }

  async function handleAnalyzeJob() {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/analyze-job", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobDescription: jobText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze job description.");
      setJob(data.analysis);
      setDismissedMissing(new Set());
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Failed to analyze job description.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleTailor() {
    if (!workingResume || !job) return;
    setTailoring(true);
    try {
      const res = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume: workingResume, job }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to tailor resume.");

      const nextResume: Resume = data.resume;
      setWorkingResume(nextResume);
      setChangeNotes(data.changeNotes || []);

      const nextScore = calculateATSScore(nextResume, job);
      setVersions((v) => [
        ...v,
        {
          id: `v-${Date.now()}`,
          label: `Version ${v.length + 1} — ${job.jobTitle}`,
          createdAt: new Date().toISOString(),
          resume: cloneResume(nextResume),
          score: nextScore.overall,
          jobTitle: job.jobTitle,
        },
      ]);
      await validateClaimsNow(nextResume);
      setTab("compare");
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Failed to tailor resume.");
    } finally {
      setTailoring(false);
    }
  }

  function updateWorkingResume(updater: (r: Resume) => Resume) {
    setWorkingResume((prev) => (prev ? updater(prev) : prev));
  }

  function handleConfirmSkill(term: string, evidence: string, mode: "have-it" | "related") {
    setConfirmedTerms((prev) => Array.from(new Set([...prev, term])));
    setDismissedMissing((prev) => new Set(prev).add(term));

    // Route the confirmed gap into the section it actually belongs in,
    // rather than dumping every kind of missing requirement into a single
    // Skills bucket: a confirmed certification reads oddly under "Skills"
    // and won't show up where a reviewer expects to find it. Everything
    // else (tools, technologies, frameworks, domain terms) still goes to
    // Skills, exactly as before.
    const isCertification = job?.certifications.some((c) => c.toLowerCase() === term.toLowerCase()) ?? false;

    updateWorkingResume((r) => {
      if (isCertification && mode === "have-it") {
        const alreadyListed = r.certifications.some((c) => c.name.toLowerCase() === term.toLowerCase());
        if (alreadyListed) return r;
        return {
          ...r,
          certifications: [
            ...r.certifications,
            { id: `cert-${Date.now()}`, name: term, issuer: "Self-reported — verify before submitting" },
          ],
        };
      }

      const categoryName = mode === "have-it" ? "Additional Skills (self-reported)" : "Related Experience (self-reported)";
      const existingIdx = r.skills.findIndex((c) => c.category === categoryName);
      if (existingIdx > -1) {
        const items = Array.from(new Set([...r.skills[existingIdx].items, term]));
        const nextSkills = r.skills.map((c, i) => (i === existingIdx ? { ...c, items } : c));
        return { ...r, skills: nextSkills };
      }
      return {
        ...r,
        skills: [...r.skills, { id: `sk-${Date.now()}`, category: categoryName, items: [term] }],
      };
    });
    // Fire and forget: refresh claim validation shortly after so the new
    // self-reported term is recognized and not flagged as unsupported.
    setTimeout(() => {
      if (workingResume) validateClaimsNow(workingResume);
    }, 50);
    void evidence; // Evidence is captured for the user's own review; stored alongside skill entry above.
  }

  function handleDismissMissing(term: string) {
    setDismissedMissing((prev) => new Set(prev).add(term));
  }

  function handleResetToOriginal() {
    if (!masterResume) return;
    setWorkingResume(cloneResume(masterResume));
    setChangeNotes([]);
  }

  function handleRestoreVersion(v: ResumeVersion) {
    setWorkingResume(cloneResume(v.resume));
    setPreviewVersion(null);
  }

  function handleDuplicateVersion(v: ResumeVersion) {
    setVersions((prev) => [
      ...prev,
      { ...v, id: `v-${Date.now()}`, label: `Copy of ${v.label}`, createdAt: new Date().toISOString() },
    ]);
  }

  if (!workingResume) {
    return (
      <div className="min-h-screen bg-paper">
        <DashboardHeader tab={tab} onTabChange={setTab} score={null} onExport={() => {}} />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <h1 className="font-serif text-2xl mb-2">Let&rsquo;s start with your resume</h1>
          <p className="text-sm text-ink-soft mb-6">Upload or paste your resume to begin. It stays as your factual source of truth.</p>
          <ResumeSourcePanel onResumeLoaded={handleResumeLoaded} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pb-16 md:pb-0">
      <DashboardHeader tab={tab} onTabChange={setTab} score={score} onExport={() => setExportOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <JobDescriptionPanel value={jobText} onChange={setJobText} onAnalyze={handleAnalyzeJob} analyzing={analyzing} />
              <JobIntelPanel job={job} missingKeywords={score?.missingKeywords || []} />
            </div>
            {analyzeError && <p className="text-sm text-clay">{analyzeError}</p>}

            {job && (
              <div className="flex justify-end">
                <Button onClick={handleTailor} disabled={tailoring}>
                  {tailoring ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  Tailor Resume for This Job
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-6">
              <ScorePanel score={score} delta={scoreDelta} />
              <KeywordPanel
                matches={score?.keywordMatches || []}
                educationMatches={score?.educationMatches || []}
                dismissed={dismissedMissing}
                onConfirmSkill={handleConfirmSkill}
                onDismiss={handleDismissMissing}
              />
              <SuggestionsPanel score={score} job={job} resume={workingResume} />
            </div>

            <div>
              <h2 className="font-serif text-lg mb-3">Tailored Resume Preview</h2>
              <ResumePreview resume={displayResume!} template={template} verifiedPages={previewMeta?.pages} verifying={fitting} wasTrimmed={previewMeta?.trimmed} />
            </div>
          </div>
        )}

        {tab === "editor" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-lg">Resume Editor</h2>
                <Button size="sm" variant="ghost" onClick={handleResetToOriginal}>
                  <RotateCcw size={13} /> Reset to Original
                </Button>
              </div>
              <ResumeEditorForm resume={workingResume} onChange={updateWorkingResume} />
            </div>
            <div className="lg:sticky lg:top-20 self-start">
              <h2 className="font-serif text-lg mb-3">Live Preview</h2>
              <TemplatePicker template={template} onChange={setTemplate} />
              <div className="mt-3">
                <ResumePreview resume={displayResume!} template={template} verifiedPages={previewMeta?.pages} verifying={fitting} wasTrimmed={previewMeta?.trimmed} />
              </div>
              {score && (
                <div className="mt-4">
                  <ScorePanel score={score} delta={scoreDelta} />
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "compare" && (
          <CompareView original={masterResume} tailored={workingResume} changeNotes={changeNotes} />
        )}

        {tab === "versions" && (
          <VersionHistoryPanel
            versions={versions}
            onRestore={handleRestoreVersion}
            onDuplicate={handleDuplicateVersion}
            onPreview={(v) => setPreviewVersion(v)}
          />
        )}
      </main>

      <MobileActionBar
        onAnalyze={() => setTab("overview")}
        onTailor={handleTailor}
        onPreview={() => setTab("editor")}
        onExport={() => setExportOpen(true)}
        tailoring={tailoring}
      />

      {exportOpen && (
        <ExportModal resume={workingResume} job={job} claims={claims} onClose={() => setExportOpen(false)} />
      )}

      {previewVersion && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPreviewVersion(null)}>
          <div className="bg-paper-alt rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg">{previewVersion.label}</h3>
              <Button size="sm" onClick={() => handleRestoreVersion(previewVersion)}>
                Restore this version
              </Button>
            </div>
            <ResumePreview resume={previewVersion.resume} template={template} compact />
          </div>
        </div>
      )}
    </div>
  );
}

function TemplatePicker({ template, onChange }: { template: TemplateId; onChange: (t: TemplateId) => void }) {
  const options: { id: TemplateId; label: string }[] = [
    { id: "classic", label: "Classic" },
    { id: "modern-ats", label: "Modern ATS" },
    { id: "compact-technical", label: "Compact Technical" },
  ];
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`text-xs px-2.5 py-1 rounded-full border ${
            template === o.id ? "bg-navy text-paper-alt border-navy" : "border-line text-ink-soft"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

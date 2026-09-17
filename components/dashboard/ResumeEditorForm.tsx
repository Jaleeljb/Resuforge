"use client";

import React from "react";
import { Resume, Experience, SkillCategory, Project, Education, Certification } from "@/types/resume";
import { Card, CardHeader } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";

type Props = {
  resume: Resume;
  onChange: (updater: (r: Resume) => Resume) => void;
};

const inputClass =
  "w-full border border-line rounded-md px-2.5 py-1.5 text-sm bg-paper focus:bg-white outline-none focus:border-navy";
const textareaClass = inputClass + " resize-none";
const labelClass = "text-[11px] text-ink-soft mb-1 block";

let uidCounter = 0;
function uid(prefix: string) {
  uidCounter += 1;
  return `${prefix}-${Date.now()}-${uidCounter}`;
}

export function ResumeEditorForm({ resume, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Header" />
        <div className="p-4 grid grid-cols-2 gap-3">
          <Field label="Full name" value={resume.personalInfo.name} onChange={(v) => onChange((r) => ({ ...r, personalInfo: { ...r.personalInfo, name: v } }))} />
          <Field label="Target title" value={resume.personalInfo.title || ""} onChange={(v) => onChange((r) => ({ ...r, personalInfo: { ...r.personalInfo, title: v } }))} />
          <Field label="Email" value={resume.personalInfo.email || ""} onChange={(v) => onChange((r) => ({ ...r, personalInfo: { ...r.personalInfo, email: v } }))} />
          <Field label="Phone" value={resume.personalInfo.phone || ""} onChange={(v) => onChange((r) => ({ ...r, personalInfo: { ...r.personalInfo, phone: v } }))} />
          <Field label="Location" value={resume.personalInfo.location || ""} onChange={(v) => onChange((r) => ({ ...r, personalInfo: { ...r.personalInfo, location: v } }))} />
          <Field label="LinkedIn" value={resume.personalInfo.linkedin || ""} onChange={(v) => onChange((r) => ({ ...r, personalInfo: { ...r.personalInfo, linkedin: v } }))} />
          <Field label="Portfolio" value={resume.personalInfo.portfolio || ""} onChange={(v) => onChange((r) => ({ ...r, personalInfo: { ...r.personalInfo, portfolio: v } }))} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Summary" />
        <div className="p-4">
          <textarea
            className={textareaClass}
            rows={4}
            value={resume.summary || ""}
            onChange={(e) => onChange((r) => ({ ...r, summary: e.target.value }))}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Experience"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onChange((r) => ({
                  ...r,
                  experience: [...r.experience, { id: uid("exp"), company: "", title: "", bullets: [""] } as Experience],
                }))
              }
            >
              <Plus size={12} /> Add role
            </Button>
          }
        />
        <div className="p-4 space-y-4">
          {resume.experience.map((exp, idx) => (
            <ExperienceItem
              key={exp.id}
              exp={exp}
              onUpdate={(next) =>
                onChange((r) => ({ ...r, experience: r.experience.map((e, i) => (i === idx ? next : e)) }))
              }
              onRemove={() => onChange((r) => ({ ...r, experience: r.experience.filter((_, i) => i !== idx) }))}
            />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Skills"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onChange((r) => ({ ...r, skills: [...r.skills, { id: uid("sk"), category: "New Category", items: [] } as SkillCategory] }))
              }
            >
              <Plus size={12} /> Add category
            </Button>
          }
        />
        <div className="p-4 space-y-3">
          {resume.skills.map((cat, idx) => (
            <SkillCategoryItem
              key={cat.id}
              cat={cat}
              onUpdate={(next) => onChange((r) => ({ ...r, skills: r.skills.map((c, i) => (i === idx ? next : c)) }))}
              onRemove={() => onChange((r) => ({ ...r, skills: r.skills.filter((_, i) => i !== idx) }))}
            />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Projects"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onChange((r) => ({ ...r, projects: [...r.projects, { id: uid("proj"), name: "New Project", technologies: [], bullets: [""] } as Project] }))
              }
            >
              <Plus size={12} /> Add project
            </Button>
          }
        />
        <div className="p-4 space-y-4">
          {resume.projects.map((proj, idx) => (
            <ProjectItem
              key={proj.id}
              proj={proj}
              onUpdate={(next) => onChange((r) => ({ ...r, projects: r.projects.map((p, i) => (i === idx ? next : p)) }))}
              onRemove={() => onChange((r) => ({ ...r, projects: r.projects.filter((_, i) => i !== idx) }))}
            />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Education"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => onChange((r) => ({ ...r, education: [...r.education, { id: uid("edu"), degree: "", institution: "" } as Education] }))}
            >
              <Plus size={12} /> Add
            </Button>
          }
        />
        <div className="p-4 space-y-3">
          {resume.education.map((edu, idx) => (
            <div key={edu.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <Field label="Degree" value={edu.degree} onChange={(v) => onChange((r) => ({ ...r, education: r.education.map((e, i) => (i === idx ? { ...e, degree: v } : e)) }))} />
              <Field label="Institution" value={edu.institution} onChange={(v) => onChange((r) => ({ ...r, education: r.education.map((e, i) => (i === idx ? { ...e, institution: v } : e)) }))} />
              <button className="text-clay p-2" onClick={() => onChange((r) => ({ ...r, education: r.education.filter((_, i) => i !== idx) }))}>
                <Trash2 size={14} />
              </button>
              <Field label="Graduation" value={edu.graduationDate || ""} onChange={(v) => onChange((r) => ({ ...r, education: r.education.map((e, i) => (i === idx ? { ...e, graduationDate: v } : e)) }))} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Certifications"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => onChange((r) => ({ ...r, certifications: [...r.certifications, { id: uid("cert"), name: "" } as Certification] }))}
            >
              <Plus size={12} /> Add
            </Button>
          }
        />
        <div className="p-4 space-y-2">
          {resume.certifications.map((cert, idx) => (
            <div key={cert.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <Field label="Name" value={cert.name} onChange={(v) => onChange((r) => ({ ...r, certifications: r.certifications.map((c, i) => (i === idx ? { ...c, name: v } : c)) }))} />
              <Field label="Issuer / Date" value={[cert.issuer, cert.date].filter(Boolean).join(" · ")} onChange={() => {}} />
              <button className="text-clay p-2" onClick={() => onChange((r) => ({ ...r, certifications: r.certifications.filter((_, i) => i !== idx) }))}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function BulletsEditor({ bullets, onChange }: { bullets: string[]; onChange: (bullets: string[]) => void }) {
  return (
    <div className="space-y-1.5">
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-1.5 items-start">
          <span className="text-ink-soft mt-2 text-xs">•</span>
          <textarea
            className={textareaClass + " flex-1"}
            rows={2}
            value={b}
            onChange={(e) => onChange(bullets.map((bb, idx) => (idx === i ? e.target.value : bb)))}
          />
          <button className="text-clay p-1.5" onClick={() => onChange(bullets.filter((_, idx) => idx !== i))}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button className="text-xs text-navy underline" onClick={() => onChange([...bullets, ""])}>
        + Add bullet
      </button>
    </div>
  );
}

function ExperienceItem({ exp, onUpdate, onRemove }: { exp: Experience; onUpdate: (e: Experience) => void; onRemove: () => void }) {
  return (
    <div className="border border-line rounded-md p-3">
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Field label="Company" value={exp.company} onChange={(v) => onUpdate({ ...exp, company: v })} />
        <Field label="Title" value={exp.title} onChange={(v) => onUpdate({ ...exp, title: v })} />
        <Field label="Start date" value={exp.startDate || ""} onChange={(v) => onUpdate({ ...exp, startDate: v })} />
        <Field label="End date" value={exp.endDate || ""} onChange={(v) => onUpdate({ ...exp, endDate: v })} />
      </div>
      <BulletsEditor bullets={exp.bullets} onChange={(bullets) => onUpdate({ ...exp, bullets })} />
      <button className="text-xs text-clay underline mt-2" onClick={onRemove}>
        Remove role
      </button>
    </div>
  );
}

function SkillCategoryItem({ cat, onUpdate, onRemove }: { cat: SkillCategory; onUpdate: (c: SkillCategory) => void; onRemove: () => void }) {
  return (
    <div className="border border-line rounded-md p-3">
      <div className="flex gap-2 items-end mb-2">
        <Field label="Category" value={cat.category} onChange={(v) => onUpdate({ ...cat, category: v })} />
        <button className="text-clay p-2" onClick={onRemove}>
          <Trash2 size={14} />
        </button>
      </div>
      <label className="block">
        <span className={labelClass}>Skills (comma separated)</span>
        <input
          className={inputClass}
          value={cat.items.join(", ")}
          onChange={(e) => onUpdate({ ...cat, items: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
        />
      </label>
    </div>
  );
}

function ProjectItem({ proj, onUpdate, onRemove }: { proj: Project; onUpdate: (p: Project) => void; onRemove: () => void }) {
  return (
    <div className="border border-line rounded-md p-3">
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Field label="Project name" value={proj.name} onChange={(v) => onUpdate({ ...proj, name: v })} />
        <Field
          label="Technologies (comma separated)"
          value={proj.technologies.join(", ")}
          onChange={(v) => onUpdate({ ...proj, technologies: v.split(",").map((s) => s.trim()).filter(Boolean) })}
        />
      </div>
      <BulletsEditor bullets={proj.bullets} onChange={(bullets) => onUpdate({ ...proj, bullets })} />
      <button className="text-xs text-clay underline mt-2" onClick={onRemove}>
        Remove project
      </button>
    </div>
  );
}

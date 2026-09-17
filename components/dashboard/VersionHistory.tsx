import React from "react";
import { ResumeVersion } from "@/types/resume";
import { Card, CardHeader, EmptyState } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";
import { RotateCcw, Copy, Eye } from "lucide-react";

export function VersionHistoryPanel({
  versions,
  onRestore,
  onDuplicate,
  onPreview,
}: {
  versions: ResumeVersion[];
  onRestore: (v: ResumeVersion) => void;
  onDuplicate: (v: ResumeVersion) => void;
  onPreview: (v: ResumeVersion) => void;
}) {
  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader title="Version History" />
        <EmptyState title="No versions saved yet" description="Versions are saved automatically each time you tailor your resume, and you can save one manually at any time." />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Version History" subtitle="Local to this session — nothing is stored on a server." />
      <div className="p-2">
        {versions
          .slice()
          .reverse()
          .map((v) => (
            <div key={v.id} className="flex items-center justify-between px-2 py-2.5 hover:bg-black/[0.02] rounded-md">
              <div>
                <p className="text-sm font-medium">{v.label}</p>
                <p className="text-[11px] text-ink-soft">
                  {new Date(v.createdAt).toLocaleString()} {v.score !== null ? `· Score ${v.score}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <IconButton onClick={() => onPreview(v)} title="View">
                  <Eye size={14} />
                </IconButton>
                <IconButton onClick={() => onRestore(v)} title="Restore">
                  <RotateCcw size={14} />
                </IconButton>
                <IconButton onClick={() => onDuplicate(v)} title="Duplicate">
                  <Copy size={14} />
                </IconButton>
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}

function IconButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} title={title}>
      {children}
    </Button>
  );
}

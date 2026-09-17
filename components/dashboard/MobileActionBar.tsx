"use client";

import React from "react";
import { ScanSearch, Wand2, Eye, Download } from "lucide-react";

export function MobileActionBar({
  onAnalyze,
  onTailor,
  onPreview,
  onExport,
  tailoring,
}: {
  onAnalyze: () => void;
  onTailor: () => void;
  onPreview: () => void;
  onExport: () => void;
  tailoring: boolean;
}) {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-paper-alt border-t border-line flex items-stretch z-40">
      <BarButton icon={<ScanSearch size={17} />} label="Analyze" onClick={onAnalyze} />
      <BarButton icon={<Wand2 size={17} />} label="Tailor" onClick={onTailor} disabled={tailoring} />
      <BarButton icon={<Eye size={17} />} label="Preview" onClick={onPreview} />
      <BarButton icon={<Download size={17} />} label="Export" onClick={onExport} />
    </div>
  );
}

function BarButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-ink-soft active:bg-black/5 disabled:opacity-40"
    >
      {icon}
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

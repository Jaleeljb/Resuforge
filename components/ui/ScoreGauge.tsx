import React from "react";

const bandColor: Record<string, string> = {
  "very-strong": "#2f5233",
  strong: "#3c6b3f",
  moderate: "#93711f",
  "needs-optimization": "#963c28",
};

export function ScoreGauge({ score, band, size = 128 }: { score: number; band: string; size?: number }) {
  const stroke = size * 0.09;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = bandColor[band] || "#1b3a5c";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e4e0d3" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-serif text-[28px] leading-none text-ink">{score}</span>
        <span className="text-[10px] text-ink-soft mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

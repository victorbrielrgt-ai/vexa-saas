"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

interface ScoreRingProps {
  score: number;
  grade: string;
  size?: number;
}

const GRADE_COLORS: Record<string, { stroke: string; text: string; bg: string }> = {
  "A+": { stroke: "#00D084", text: "text-brand-green", bg: "bg-brand-green-glow" },
  "A":  { stroke: "#00D084", text: "text-brand-green", bg: "bg-brand-green-glow" },
  "B+": { stroke: "#5B2EFF", text: "text-brand-purple-light", bg: "bg-brand-purple-glow" },
  "B":  { stroke: "#5B2EFF", text: "text-brand-purple-light", bg: "bg-brand-purple-glow" },
  "C+": { stroke: "#FFB800", text: "text-brand-amber", bg: "bg-brand-amber-glow" },
  "C":  { stroke: "#FFB800", text: "text-brand-amber", bg: "bg-brand-amber-glow" },
  "D":  { stroke: "#FF4444", text: "text-brand-red", bg: "bg-brand-red-glow" },
  "F":  { stroke: "#FF4444", text: "text-brand-red", bg: "bg-brand-red-glow" },
};

export function ScoreRing({ score, grade, size = 140 }: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const colors = GRADE_COLORS[grade] || GRADE_COLORS["C"];

  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillRatio = animatedScore / 1000;
  const strokeDashoffset = circumference - fillRatio * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = score / 60;
      const interval = setInterval(() => {
        current = Math.min(current + increment, score);
        setAnimatedScore(Math.round(current));
        if (current >= score) clearInterval(interval);
      }, 16);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background glow */}
      <div className="absolute inset-0 rounded-full opacity-20"
        style={{ background: `radial-gradient(circle, ${colors.stroke}33 0%, transparent 70%)` }} />

      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1E2D4A" strokeWidth="8" />
        {/* Progress */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={colors.stroke} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.05s ease" }} />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-ink-primary">{animatedScore}</span>
        <span className={clsx("font-display text-sm font-bold", colors.text)}>{grade}</span>
      </div>
    </div>
  );
}

"use client";

export type DifficultyKey = "EASY" | "MEDIUM" | "HARD";

const DIFF: Record<DifficultyKey, { label: string; className: string }> = {
  EASY: { label: "Dễ", className: "bg-accent-teal/12 text-accent-teal" },
  MEDIUM: { label: "Trung bình", className: "bg-accent-gold/12 text-accent-gold" },
  HARD: { label: "Khó", className: "bg-accent-danger/10 text-accent-danger" },
};

export function DifficultyBadge({ value }: { value: DifficultyKey }) {
  const c = DIFF[value] ?? DIFF.MEDIUM;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.className}`}>{c.label}</span>;
}

export type EraKey = "ANCIENT" | "MEDIEVAL" | "MODERN" | "CONTEMPORARY" | "ALL";

const ERA: Record<EraKey, { label: string; className: string }> = {
  ANCIENT: { label: "Cổ đại", className: "bg-accent-bronze/12 text-accent-bronze" },
  MEDIEVAL: { label: "Trung đại", className: "bg-accent-gold/12 text-accent-gold" },
  MODERN: { label: "Cận đại", className: "bg-accent-blue/12 text-accent-blue" },
  CONTEMPORARY: { label: "Hiện đại", className: "bg-accent-teal/12 text-accent-teal" },
  ALL: { label: "Tất cả", className: "bg-content-muted/10 text-content-muted" },
};

export const ERA_OPTIONS: { value: EraKey; label: string }[] = [
  { value: "ANCIENT", label: "Cổ đại" },
  { value: "MEDIEVAL", label: "Trung đại" },
  { value: "MODERN", label: "Cận đại" },
  { value: "CONTEMPORARY", label: "Hiện đại" },
];

export function EraBadge({ value }: { value: EraKey }) {
  const c = ERA[value] ?? ERA.ALL;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.className}`}>{c.label}</span>;
}

export function GradeBadge({ value }: { value: number }) {
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue">Lớp {value}</span>;
}

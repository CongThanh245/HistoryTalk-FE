"use client";
export type DifficultyKey = "EASY" | "MEDIUM" | "HARD";
const DIFF = { EASY: { label: "Dễ", color: "var(--accent-teal)", bg: "rgba(47,111,115,0.12)" }, MEDIUM: { label: "Trung bình", color: "var(--accent-gold)", bg: "rgba(201,162,77,0.12)" }, HARD: { label: "Khó", color: "var(--accent-danger)", bg: "rgba(184,50,42,0.10)" } };
export function DifficultyBadge({ value }: { value: DifficultyKey }) { const c = DIFF[value] ?? DIFF.MEDIUM; return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>{c.label}</span>; }

export type EraKey = "ANCIENT" | "MEDIEVAL" | "MODERN" | "CONTEMPORARY" | "ALL";
const ERA = { ANCIENT: { label: "Cổ đại", color: "var(--accent-bronze)", bg: "rgba(196,106,47,0.12)" }, MEDIEVAL: { label: "Trung đại", color: "var(--accent-gold)", bg: "rgba(201,162,77,0.12)" }, MODERN: { label: "Cận đại", color: "var(--accent-blue)", bg: "rgba(59,130,246,0.12)" }, CONTEMPORARY: { label: "Hiện đại", color: "var(--accent-teal)", bg: "rgba(47,111,115,0.12)" }, ALL: { label: "Tất cả", color: "var(--content-muted)", bg: "rgba(100,100,100,0.10)" } };
export const ERA_OPTIONS: { value: EraKey; label: string }[] = [{ value: "ANCIENT", label: "Cổ đại" }, { value: "MEDIEVAL", label: "Trung đại" }, { value: "MODERN", label: "Cận đại" }, { value: "CONTEMPORARY", label: "Hiện đại" }];
export function EraBadge({ value }: { value: EraKey }) { const c = ERA[value] ?? ERA.ALL; return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>{c.label}</span>; }

export function GradeBadge({ value }: { value: number }) { return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.10)", color: "var(--accent-blue)" }}>Lớp {value}</span>; }

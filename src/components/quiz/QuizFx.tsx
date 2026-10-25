"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Mascot, type MascotMood } from "@/components/mascot/Mascot";

const CONFETTI_COLORS = [
  "var(--accent-gold)",
  "var(--men-lam)",
  "var(--gold-leaf)",
  "var(--jade)",
  "var(--accent-brass)",
];

/** Phao giay roi tu tren xuong mot lan (CSS thuan, khong can thu vien). Doi `key` de ban lai. */
export function QuizConfetti({ pieces = 90 }: { pieces?: number }) {
  const [items] = useState(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: Math.random() * 100,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        dx: `${(Math.random() - 0.5) * 260}px`,
        rot: `${(Math.random() - 0.5) * 1080}deg`,
        dur: `${2.2 + Math.random() * 1.6}s`,
        delay: `${Math.random() * 0.5}s`,
        round: Math.random() > 0.6,
      })),
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {items.map((p, i) => (
        <span
          key={i}
          className={cn("quiz-confetti-piece", p.round && "rounded-full")}
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              "--dx": p.dx,
              "--rot": p.rot,
              "--dur": p.dur,
              "--delay": p.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export type CheerTone = "good" | "bad" | "info";

export interface Cheer {
  id: number;
  text: string;
  tone: CheerTone;
}

const CHEER_TONE: Record<CheerTone, string> = {
  good: "bg-[var(--jade)] text-[#FFFFFF]",
  bad: "bg-[var(--accent-danger)] text-[#FFFFFF]",
  info: "bg-[var(--text-primary)] text-[var(--text-inverse)]",
};

const CHEER_MOOD: Record<CheerTone, MascotMood> = { good: "happy", bad: "sad", info: "idle" };

/** Loi co vu bat len o giua day man hinh roi tu bien mat. */
export function QuizCheer({ cheer }: { cheer: Cheer | null }) {
  if (!cheer) return null;
  return (
    <div
      role="status"
      className={cn(
        "quiz-cheer flex items-center gap-2 rounded-full py-2 pl-3 pr-6 font-display text-[20px] font-extrabold shadow-[0_6px_0_rgba(0,0,0,0.25)]",
        CHEER_TONE[cheer.tone],
      )}
    >
      <Mascot mood={CHEER_MOOD[cheer.tone]} size={40} arms={false} />
      {cheer.text}
    </div>
  );
}

export const CHEER_LINES = {
  good: [
    "Tuyệt vời! ✨",
    "Chuẩn bài! 👏",
    "Tiếp tục nào! 🚀",
    "Quá đỉnh! 💯",
    "Giỏi lắm! 🌟",
  ],
  bad: [
    "Tiếc quá! Câu sau nhé 💪",
    "Không sao, cố lên! 🙌",
    "Suýt nữa thôi! 🤏",
  ],
};

export function pickCheer(list: string[] = CHEER_LINES.good) {
  return list[Math.floor(Math.random() * list.length)];
}

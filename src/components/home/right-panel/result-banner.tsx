"use client";

import { useState } from "react";

export function ResultBanner({
  correct,
  explanation,
  onNext,
}: {
  correct: boolean;
  explanation: string;
  onNext: () => void;
}) {
  const [showExp, setShowExp] = useState(false);
  return (
    <div className="flex flex-col gap-[7px] mt-1">
      <div
        className={`rounded-[2px] px-3 py-[9px] border ${
          correct
            ? "bg-[var(--status-success-bg)] border-[var(--status-success)]"
            : "bg-[var(--status-danger-bg)] border-[var(--accent-danger)]"
        }`}
      >
        <p
          className={`m-0 text-[11px] font-bold uppercase tracking-[0.1em] ${correct ? "text-[var(--status-success)]" : "text-[var(--accent-danger)]"}`}
        >
          {correct ? "Chính xác!" : "Chưa đúng rồi!"}
        </p>
      </div>
      {!showExp ? (
        <button
          onClick={() => setShowExp(true)}
          className="archive-link self-start cursor-pointer bg-transparent text-[11px]"
        >
          Xem giải thích →
        </button>
      ) : (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[2px] px-3 py-[9px]">
          <p className="m-0 text-[11.5px] leading-[1.65] text-[var(--text-secondary)]">
            {explanation}
          </p>
        </div>
      )}
      <button
        onClick={onNext}
        className="btn-ink w-full min-h-[38px] cursor-pointer text-xs"
      >
        Câu tiếp theo
      </button>
    </div>
  );
}

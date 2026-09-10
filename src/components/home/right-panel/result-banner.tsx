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
        className={`rounded-[9px] px-3 py-[9px] border ${
          correct
            ? "bg-[rgba(16,40,24,0.08)] border-[rgba(74,178,98,0.4)]"
            : "bg-[rgba(90,35,35,0.08)] border-[rgba(184,50,42,0.4)]"
        }`}
      >
        <p
          className={`m-0 text-xs font-bold ${correct ? "text-[#1f5c34]" : "text-[#9b2222]"}`}
        >
          {correct ? "Chính xác!" : "Chưa đúng rồi!"}
        </p>
      </div>
      {!showExp ? (
        <button
          onClick={() => setShowExp(true)}
          className="text-[11px] font-semibold text-[#7a5a1e] bg-accent-gold/[0.07] border border-accent-gold/[0.18] rounded-[7px] cursor-pointer px-2.5 py-1.5 text-left"
        >
          Xem giải thích →
        </button>
      ) : (
        <div className="bg-accent-gold/[0.05] border border-accent-gold/[0.16] rounded-[7px] px-3 py-[9px]">
          <p className="m-0 text-[11.5px] leading-[1.65] text-[#2d3d4f]">
            {explanation}
          </p>
        </div>
      )}
      <button
        onClick={onNext}
        className="text-xs font-bold cursor-pointer py-[9px] rounded-lg bg-[#e8d5a8] border border-[#b8922a] text-[#5c3d0e] w-full"
      >
        Câu tiếp theo
      </button>
    </div>
  );
}

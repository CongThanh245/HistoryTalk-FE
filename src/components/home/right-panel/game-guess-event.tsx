"use client";

import { useState, useEffect } from "react";
import { EventQuestion, eventQuestions } from "@/store/quiz";
import { getRandom } from "./types";
import { OptionBtn } from "./option-btn";
import { ResultBanner } from "./result-banner";

export function GameGuessEvent({ onScore }: { onScore: (c: boolean) => void }) {
  const [q, setQ] = useState<EventQuestion>(eventQuestions[0]);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    setQ(getRandom(eventQuestions));
  }, []);
  const answered = selected !== null;
  const next = () => {
    setQ(getRandom(eventQuestions, q));
    setSelected(null);
  };
  return (
    <div className="flex flex-col gap-2.5">
      <div className="bg-[var(--bg-elevated)] border border-[var(--text-primary)] rounded-[2px] p-3.5 text-center">
        <p className="m-0 mb-1 text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-tertiary)]">
          Năm xảy ra
        </p>
        <p className="m-0 mb-2.5 font-display text-[48px] font-extrabold leading-none text-[var(--accent-gold)]">
          {q.year}
        </p>
        <div className="flex flex-wrap gap-[5px] justify-center">
          {q.clues.map((c, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-[2px] bg-transparent border border-[var(--border-strong)] text-[var(--text-secondary)]"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {q.options.map((opt, i) => (
          <OptionBtn
            key={opt}
            label={opt}
            index={i}
            answered={answered}
            isAnswer={opt === q.answer}
            isSelected={opt === selected}
            onClick={() => {
              if (!answered) {
                setSelected(opt);
                onScore(opt === q.answer);
              }
            }}
          />
        ))}
      </div>
      {answered && (
        <ResultBanner
          correct={selected === q.answer}
          explanation={q.explanation}
          onNext={next}
        />
      )}
    </div>
  );
}

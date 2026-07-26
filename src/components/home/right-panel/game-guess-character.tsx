"use client";

import { useState, useEffect } from "react";
import { CharacterQuestion, characterQuestions } from "@/store/quiz";
import { getRandom } from "./types";
import { OptionBtn } from "./option-btn";
import { ResultBanner } from "./result-banner";

export function GameGuessCharacter({
  onScore,
}: {
  onScore: (c: boolean) => void;
}) {
  const [q, setQ] = useState<CharacterQuestion>(characterQuestions[0]);
  const [hintsRevealed, setHintsRevealed] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    setQ(getRandom(characterQuestions));
  }, []);
  const answered = selected !== null;
  const next = () => {
    setQ(getRandom(characterQuestions, q));
    setHintsRevealed(1);
    setSelected(null);
  };
  return (
    <div className="flex flex-col gap-2.5">
      <div className="bg-accent-gold/[0.04] border border-accent-gold/[0.14] rounded-[10px] px-3.5 py-3">
        <p className="m-0 mb-2 text-[10px] font-bold tracking-[0.1em] uppercase text-gold-on-light">
          Đây là ai?
        </p>
        <ul className="m-0 pl-3.5 flex flex-col gap-[5px]">
          {q.hints.slice(0, hintsRevealed).map((h, i) => (
            <li key={i} className="text-[12.5px] text-content-text leading-[1.5]">
              {h}
            </li>
          ))}
        </ul>
        {!answered && hintsRevealed < q.hints.length && (
          <button
            onClick={() => setHintsRevealed((n) => n + 1)}
            className="mt-2 text-[10px] font-semibold text-gold-on-light bg-accent-gold/10 border border-accent-gold/20 rounded-[5px] px-2 py-0.5 cursor-pointer"
          >
            + Gợi ý ({q.hints.length - hintsRevealed} còn lại)
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
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

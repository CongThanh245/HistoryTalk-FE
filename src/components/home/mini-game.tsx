"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  CharacterQuestion,
  characterQuestions,
  EventQuestion,
  eventQuestions,
  TimelineItem,
  timelineSets,
} from "@/store/quiz";

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRandom<T>(arr: T[], exclude?: T): T {
  let item: T;
  do {
    item = arr[Math.floor(Math.random() * arr.length)];
  } while (arr.length > 1 && item === exclude);
  return item;
}

type GameMode = "character" | "event" | "timeline";

function randomMode(exclude?: GameMode): GameMode {
  const modes: GameMode[] = ["character", "event", "timeline"];
  let m: GameMode;
  do {
    m = modes[Math.floor(Math.random() * modes.length)];
  } while (modes.length > 1 && m === exclude);
  return m;
}

// ─────────────────────────────────────────
// Result Banner — text only, no icon clutter
// ─────────────────────────────────────────

function ResultBanner({
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
    <div className="flex flex-col gap-2 mt-1">
      {/* Status */}
      <div
        className={`rounded-[10px] px-3.5 py-2.5 border ${
          correct
            ? "bg-[rgba(16,40,24,0.08)] border-[rgba(74,178,98,0.4)]"
            : "bg-[rgba(90,35,35,0.08)] border-[rgba(184,50,42,0.4)]"
        }`}
      >
        <p
          className={`m-0 text-[13px] font-bold ${correct ? "text-[#1f5c34]" : "text-[#9b2222]"}`}
        >
          {correct ? "Chính xác!" : "Chưa đúng rồi!"}
        </p>
      </div>

      {/* Explanation */}
      {!showExp ? (
        <button
          onClick={() => setShowExp(true)}
          className="text-xs font-semibold text-[#7a5a1e] bg-accent-gold/[0.07] border border-accent-gold/20 rounded-lg cursor-pointer px-3 py-[7px] text-left"
        >
          Xem giải thích →
        </button>
      ) : (
        <div className="bg-accent-gold/[0.05] border border-accent-gold/[0.18] rounded-lg px-[13px] py-2.5">
          <p className="m-0 text-[12.5px] leading-[1.7] text-[#2d3d4f]">
            {explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        className="text-[13px] font-bold cursor-pointer py-2.5 rounded-[9px] bg-[#e8d5a8] border border-[#b8922a] text-[#5c3d0e] w-full"
      >
        Câu tiếp theo
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Option Button — clean, no icon badges
// ─────────────────────────────────────────

function OptionBtn({
  label,
  index,
  answered,
  isAnswer,
  isSelected,
  onClick,
}: {
  label: string;
  index: number;
  answered: boolean;
  isAnswer: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const letters = ["A", "B", "C", "D"];

  let bg = "transparent";
  let border = "var(--card-light-border)";
  let color = "var(--content-text)";
  let letterColor = "var(--content-muted)";

  if (answered) {
    if (isAnswer) {
      bg = "rgba(16,40,24,0.08)";
      border = "rgba(74,178,98,0.45)";
      color = "#2d6b3e";
      letterColor = "#3a9e57";
    } else if (isSelected) {
      bg = "rgba(90,35,35,0.08)";
      border = "rgba(184,50,42,0.45)";
      color = "#9b2222";
      letterColor = "#c94040";
    } else {
      color = "var(--content-muted)";
    }
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-[9px] px-3 py-[9px] text-[13px] text-left flex items-center gap-2.5 w-full transition-[background,border-color] duration-[120ms] ${
        answered ? "cursor-default" : "cursor-pointer"
      }`}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color,
      }}
      onMouseEnter={(e) => {
        if (!answered)
          e.currentTarget.style.background = "rgba(201,162,77,0.06)";
      }}
      onMouseLeave={(e) => {
        if (!answered) e.currentTarget.style.background = bg;
      }}
    >
      <span
        className="text-[10px] font-extrabold min-w-5 h-5 flex items-center justify-center rounded shrink-0 bg-accent-gold/10"
        style={{ color: letterColor }}
      >
        {letters[index]}
      </span>
      <span className="flex-1 font-medium">{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────
// Game 1 — Guess the Character
// ─────────────────────────────────────────

function GameGuessCharacter({ onScore }: { onScore: (c: boolean) => void }) {
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
    <div className="flex flex-col gap-[11px]">
      {/* Hint card */}
      <div className="bg-accent-gold/[0.04] border border-accent-gold/15 rounded-xl px-4 py-3.5">
        <p className="m-0 mb-2.5 text-[11px] font-bold tracking-[0.1em] uppercase text-gold-on-light">
          Đây là ai?
        </p>

        <ul className="m-0 pl-4 flex flex-col gap-1.5">
          {q.hints.slice(0, hintsRevealed).map((h, i) => (
            <li key={i} className="text-[13.5px] text-content-text leading-[1.5]">
              {h}
            </li>
          ))}
        </ul>

        {!answered && hintsRevealed < q.hints.length && (
          <button
            onClick={() => setHintsRevealed((n) => n + 1)}
            className="mt-2.5 text-[11px] font-semibold text-gold-on-light bg-accent-gold/10 border border-accent-gold/[0.22] rounded-md px-2.5 py-[3px] cursor-pointer"
          >
            + Gợi ý thêm ({q.hints.length - hintsRevealed} còn lại)
          </button>
        )}
      </div>

      {/* Options 2×2 */}
      <div className="grid grid-cols-2 gap-[7px]">
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
        <ResultBanner correct={selected === q.answer} explanation={q.explanation} onNext={next} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Game 2 — Guess the Event
// ─────────────────────────────────────────

function GameGuessEvent({ onScore }: { onScore: (c: boolean) => void }) {
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
    <div className="flex flex-col gap-[11px]">
      {/* Year showcase */}
      <div className="bg-[var(--accent-earth,rgba(196,106,47,0.06))] border border-[rgba(196,106,47,0.2)] rounded-[14px] px-4 py-[18px] text-center">
        <p className="m-0 mb-1 text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--accent-bronze,#c46a2f)]">
          Năm xảy ra sự kiện
        </p>

        <p className="m-0 mb-3 text-[52px] font-black leading-none tracking-[-2px] text-[var(--burning-flame,#e08040)]">
          {q.year}
        </p>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {q.clues.map((c, i) => (
            <span
              key={i}
              className="text-[11px] px-2.5 py-[3px] rounded-[20px] bg-[rgba(196,106,47,0.08)] border border-[rgba(196,106,47,0.18)] text-[var(--burning-flame,#c46a2f)]"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-[7px]">
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
        <ResultBanner correct={selected === q.answer} explanation={q.explanation} onNext={next} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Game 3 — Timeline Drag-to-Sort
// ─────────────────────────────────────────

function GameTimeline({ onScore }: { onScore: (c: boolean) => void }) {
  const [setIdx, setSetIdx] = useState(0);
  const [items, setItems] = useState<TimelineItem[]>(() => shuffle(timelineSets[0]));
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const dragItemRef = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);

  const correctOrder = [...timelineSets[setIdx]].sort((a, b) => a.year - b.year);

  const handleDrop = () => {
    if (dragItemRef.current === null || dragOverRef.current === null) return;
    const copy = [...items];
    const [dragged] = copy.splice(dragItemRef.current, 1);
    copy.splice(dragOverRef.current, 0, dragged);
    setItems(copy);
    dragItemRef.current = null;
    dragOverRef.current = null;
    setDragging(null);
    setDragOverIdx(null);
  };

  const handleSubmit = () => {
    const ok = items.every((item, i) => item.id === correctOrder[i].id);
    setIsCorrect(ok);
    setSubmitted(true);
    onScore(ok);
  };

  const next = () => {
    const ni = (setIdx + 1) % timelineSets.length;
    setSetIdx(ni);
    setItems(shuffle(timelineSets[ni]));
    setSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Instruction */}
      <p className="m-0 text-xs text-content-muted">
        Kéo thả sắp xếp{" "}
        <strong className="text-content-text">từ sớm đến muộn nhất</strong>
      </p>

      {/* Draggable list */}
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => {
          const correctPos = correctOrder.findIndex((c) => c.id === item.id);
          const placedOk = submitted && correctPos === i;
          const placedWrong = submitted && correctPos !== i;
          const isDraggingThis = dragging === i;
          const isDragTarget = dragOverIdx === i && dragging !== i;

          return (
            <div
              key={item.id}
              draggable={!submitted}
              onDragStart={() => {
                dragItemRef.current = i;
                setDragging(i);
              }}
              onDragEnter={() => {
                dragOverRef.current = i;
                setDragOverIdx(i);
              }}
              onDragEnd={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className={`rounded-[10px] px-[13px] py-2.5 flex items-center gap-2.5 transition-all duration-[120ms] select-none ${
                submitted ? "cursor-default" : "cursor-grab"
              } ${isDraggingThis ? "opacity-35" : "opacity-100"}`}
              style={{
                background: placedOk
                  ? "rgba(16,40,24,0.08)"
                  : placedWrong
                  ? "rgba(90,35,35,0.08)"
                  : isDragTarget
                  ? "rgba(201,162,77,0.07)"
                  : "var(--card-light-bg)",
                border: `1px solid ${
                  placedOk
                    ? "rgba(74,178,98,0.45)"
                    : placedWrong
                    ? "rgba(184,50,42,0.45)"
                    : isDragTarget
                    ? "rgba(201,162,77,0.4)"
                    : "var(--card-light-border)"
                }`,
              }}
            >
              {/* Handle / result dot */}
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: submitted
                    ? placedOk
                      ? "#5dcc78"
                      : "#f07070"
                    : "rgba(201,162,77,0.4)",
                }}
              />

              <div className="flex-1">
                <p className="m-0 text-[13px] font-semibold text-content-text">
                  {item.label}
                </p>
                <p className="m-0 mt-0.5 text-[11px] text-content-muted">
                  {item.description}
                </p>
              </div>

              {/* Year badge (post-submit) */}
              {submitted && (
                <span
                  className={`text-[11px] font-extrabold rounded-[5px] px-[7px] py-px border ${
                    placedOk
                      ? "text-[#1f5c34] bg-[rgba(74,178,98,0.12)] border-[rgba(74,178,98,0.3)]"
                      : "text-[#9b2222] bg-[rgba(184,50,42,0.12)] border-[rgba(184,50,42,0.3)]"
                  }`}
                >
                  {item.yearDisplay}
                </span>
              )}

              {/* Position number */}
              <span className="text-[10px] font-bold min-w-5 h-5 flex items-center justify-center rounded-[5px] bg-accent-gold/10 text-gold-on-light shrink-0">
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="text-[13px] font-bold cursor-pointer py-2.5 rounded-[9px] bg-[#e8d5a8] border border-[#b8922a] text-[#5c3d0e] w-full"
        >
          Kiểm tra thứ tự
        </button>
      ) : (
        <ResultBanner
          correct={isCorrect}
          explanation={
            isCorrect
              ? "Hoàn hảo! Bạn đã sắp xếp đúng thứ tự thời gian."
              : `Thứ tự đúng: ${correctOrder.map((c) => `${c.label} (${c.yearDisplay})`).join(" → ")}`
          }
          onNext={next}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Game mode label — minimal, no icon
// ─────────────────────────────────────────

const MODE_LABELS: Record<GameMode, string> = {
  character: "Đoán nhân vật",
  event: "Đoán sự kiện",
  timeline: "Sắp xếp dòng thời gian",
};

// ─────────────────────────────────────────
// Main Widget — no tabs, random game
// ─────────────────────────────────────────

export function HistoryMiniGame() {
  const [mode, setMode] = useState<GameMode>("character"); // stable SSR default
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [key, setKey] = useState(0);

  // Randomize only on client after hydration
  useEffect(() => {
    setMode(randomMode());
  }, []);

  const handleScore = useCallback((correct: boolean) => {
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
    }));
  }, []);

  const handleSwitchGame = () => {
    const next = randomMode(mode);
    setMode(next);
    setKey((k) => k + 1);
  };

  return (
    <div className="bg-card-light-bg border border-card-light-border rounded-[14px] overflow-hidden shadow-[0_2px_12px_rgba(27,38,50,0.07)]">
      {/* Header — chỉ text, không icon */}
      <div className="px-[18px] pt-3.5 pb-3 border-b border-card-light-border flex items-center justify-between">
        <div>
          <p className="m-0 text-[13px] font-bold text-content-heading">
            {MODE_LABELS[mode]}
          </p>
          {score.total > 0 && (
            <p className="m-0 mt-0.5 text-[11px] text-content-muted">
              {score.correct}/{score.total} câu đúng
            </p>
          )}
        </div>

        <button
          onClick={handleSwitchGame}
          className="text-[11px] font-semibold cursor-pointer px-[11px] py-[5px] rounded-[7px] bg-transparent border border-card-light-border text-content-muted transition-all duration-[120ms] hover:border-accent-gold/40 hover:text-gold-on-light"
        >
          Game khác
        </button>
      </div>

      {/* Game area */}
      <div className="px-[18px] pt-4 pb-[18px]">
        {mode === "character" && (
          <GameGuessCharacter key={`char-${key}`} onScore={handleScore} />
        )}
        {mode === "event" && (
          <GameGuessEvent key={`evt-${key}`} onScore={handleScore} />
        )}
        {mode === "timeline" && (
          <GameTimeline key={`tl-${key}`} onScore={handleScore} />
        )}
      </div>
    </div>
  );
}

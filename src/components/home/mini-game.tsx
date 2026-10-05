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
        className={`rounded-[2px] px-3.5 py-2.5 border ${
          correct
            ? "bg-[var(--status-success-bg)] border-[var(--status-success)]"
            : "bg-[var(--status-danger-bg)] border-[var(--accent-danger)]"
        }`}
      >
        <p
          className={`m-0 text-[12px] font-bold uppercase tracking-[0.1em] ${correct ? "text-[var(--status-success)]" : "text-[var(--accent-danger)]"}`}
        >
          {correct ? "Chính xác!" : "Chưa đúng rồi!"}
        </p>
      </div>

      {/* Explanation */}
      {!showExp ? (
        <button
          onClick={() => setShowExp(true)}
          className="archive-link self-start cursor-pointer bg-transparent"
        >
          Xem giải thích →
        </button>
      ) : (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[2px] px-[13px] py-2.5">
          <p className="m-0 text-[12.5px] leading-[1.7] text-[var(--text-secondary)]">
            {explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        className="btn-ink w-full cursor-pointer"
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

  let tone =
    "bg-[var(--bg-elevated)] border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--text-primary)]";
  let letterTone = "border-[var(--text-primary)] text-[var(--text-primary)]";

  if (answered) {
    if (isAnswer) {
      tone = "bg-[var(--status-success-bg)] border-[var(--status-success)] text-[var(--status-success)]";
      letterTone = "border-[var(--status-success)] bg-[var(--status-success)] text-[var(--text-inverse)]";
    } else if (isSelected) {
      tone = "bg-[var(--status-danger-bg)] border-[var(--accent-danger)] text-[var(--accent-danger)]";
      letterTone = "border-[var(--accent-danger)] bg-[var(--accent-danger)] text-[var(--text-inverse)]";
    } else {
      tone = "bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-muted)]";
      letterTone = "border-[var(--border-strong)] text-[var(--text-muted)]";
    }
  } else if (isSelected) {
    tone = "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--text-inverse)]";
    letterTone = "border-[var(--text-inverse)] text-[var(--text-inverse)]";
  }

  return (
    <button
      onClick={onClick}
      className={`rounded-[2px] border px-3 py-[9px] text-[13px] text-left flex items-center gap-2.5 w-full transition-[background,border-color,color] duration-[120ms] ${tone} ${
        answered ? "cursor-default" : "cursor-pointer"
      }`}
    >
      <span
        className={`text-[10px] font-extrabold min-w-5 h-5 flex items-center justify-center rounded-[2px] border shrink-0 ${letterTone}`}
      >
        {letters[index]}
      </span>
      <span className="flex-1 font-semibold">{label}</span>
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
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-[2px] px-4 py-3.5">
        <p className="m-0 mb-2.5 text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--gold-on-light)]">
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
            className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-primary)] bg-transparent border border-[var(--text-primary)] rounded-[2px] px-2.5 py-1 cursor-pointer transition-colors duration-100 hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
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
      <div className="bg-[var(--bg-elevated)] border border-[var(--text-primary)] rounded-[2px] px-4 py-[18px] text-center">
        <p className="m-0 mb-1 text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-tertiary)]">
          Năm xảy ra sự kiện
        </p>

        <p className="m-0 mb-3 font-display text-[56px] font-extrabold leading-none text-[var(--accent-gold)]">
          {q.year}
        </p>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {q.clues.map((c, i) => (
            <span
              key={i}
              className="text-[11px] font-semibold px-2.5 py-[3px] rounded-[2px] bg-transparent border border-[var(--border-strong)] text-[var(--text-secondary)]"
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
              className={`rounded-[2px] border px-[13px] py-2.5 flex items-center gap-2.5 transition-all duration-[120ms] select-none ${
                submitted ? "cursor-default" : "cursor-grab"
              } ${isDraggingThis ? "opacity-35" : "opacity-100"}`}
              style={{
                background: placedOk
                  ? "var(--status-success-bg)"
                  : placedWrong
                  ? "var(--status-danger-bg)"
                  : isDragTarget
                  ? "var(--accent-gold-active-bg)"
                  : "var(--bg-elevated)",
                borderColor: placedOk
                  ? "var(--status-success)"
                  : placedWrong
                  ? "var(--accent-danger)"
                  : isDragTarget
                  ? "var(--text-primary)"
                  : "var(--border-strong)",
              }}
            >
              {/* Handle / result dot */}
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background: submitted
                    ? placedOk
                      ? "var(--status-success)"
                      : "var(--accent-danger)"
                    : "var(--accent-gold)",
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
                  className={`text-[11px] font-extrabold rounded-[2px] px-[7px] py-px border ${
                    placedOk
                      ? "text-[var(--status-success)] bg-[var(--status-success-bg)] border-[var(--status-success-border)]"
                      : "text-[var(--accent-danger)] bg-[var(--status-danger-bg)] border-[var(--status-danger-border)]"
                  }`}
                >
                  {item.yearDisplay}
                </span>
              )}

              {/* Position number */}
              <span className="font-display text-[12px] font-extrabold min-w-5 h-5 flex items-center justify-center rounded-[2px] border border-[var(--text-primary)] text-[var(--text-primary)] shrink-0">
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="btn-crimson w-full cursor-pointer"
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
    <div className="bg-[var(--bg-surface)] border border-[var(--text-primary)] rounded-[2px] overflow-hidden">
      {/* Header — chỉ text, không icon */}
      <div className="px-[18px] pt-3.5 pb-3 border-b border-[var(--text-primary)] flex items-center justify-between">
        <div>
          <p className="m-0 font-display text-[20px] font-extrabold uppercase leading-[1.1] text-content-heading">
            {MODE_LABELS[mode]}
          </p>
          {score.total > 0 && (
            <p className="m-0 mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-content-muted">
              {score.correct}/{score.total} câu đúng
            </p>
          )}
        </div>

        <button
          onClick={handleSwitchGame}
          className="text-[11px] font-bold uppercase tracking-[0.1em] cursor-pointer px-[11px] py-[6px] rounded-[2px] bg-transparent border border-[var(--text-primary)] text-[var(--text-primary)] transition-colors duration-[120ms] hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
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

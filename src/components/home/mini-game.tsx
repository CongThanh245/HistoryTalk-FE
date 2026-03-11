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
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
      {/* Status */}
      <div
        style={{
          borderRadius: 10,
          padding: "10px 14px",
          background: correct ? "rgba(16,40,24,0.08)" : "rgba(90,35,35,0.08)",
          border: `1px solid ${correct ? "rgba(74,178,98,0.4)" : "rgba(184,50,42,0.4)"}`,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: correct ? "#1f5c34" : "#9b2222",
          }}
        >
          {correct ? "Chính xác!" : "Chưa đúng rồi!"}
        </p>
      </div>

      {/* Explanation */}
      {!showExp ? (
        <button
          onClick={() => setShowExp(true)}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#7a5a1e",
            background: "rgba(201,162,77,0.07)",
            border: "1px solid rgba(201,162,77,0.2)",
            borderRadius: 8,
            cursor: "pointer",
            padding: "7px 12px",
            textAlign: "left",
          }}
        >
          Xem giải thích →
        </button>
      ) : (
        <div
          style={{
            background: "rgba(201,162,77,0.05)",
            border: "1px solid rgba(201,162,77,0.18)",
            borderRadius: 8,
            padding: "10px 13px",
          }}
        >
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7, color: "#2d3d4f" }}>
            {explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        style={{
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          padding: "10px 0",
          borderRadius: 9,
          background: "#e8d5a8",
          border: "1px solid #b8922a",
          color: "#5c3d0e",
          width: "100%",
        }}
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
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color,
        borderRadius: 9,
        padding: "9px 12px",
        fontSize: 13,
        cursor: answered ? "default" : "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        transition: "background 0.12s, border-color 0.12s",
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
        style={{
          fontSize: 10,
          fontWeight: 800,
          minWidth: 20,
          height: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          flexShrink: 0,
          background: "rgba(201,162,77,0.1)",
          color: letterColor,
        }}
      >
        {letters[index]}
      </span>
      <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {/* Hint card */}
      <div
        style={{
          background: "rgba(201,162,77,0.04)",
          border: "1px solid rgba(201,162,77,0.15)",
          borderRadius: 12,
          padding: "14px 16px",
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--gold-on-light, #a07828)",
          }}
        >
          Đây là ai?
        </p>

        <ul
          style={{
            margin: 0,
            padding: "0 0 0 16px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {q.hints.slice(0, hintsRevealed).map((h, i) => (
            <li key={i} style={{ fontSize: 13.5, color: "var(--content-text)", lineHeight: 1.5 }}>
              {h}
            </li>
          ))}
        </ul>

        {!answered && hintsRevealed < q.hints.length && (
          <button
            onClick={() => setHintsRevealed((n) => n + 1)}
            style={{
              marginTop: 10,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--gold-on-light, #a07828)",
              background: "rgba(201,162,77,0.1)",
              border: "1px solid rgba(201,162,77,0.22)",
              borderRadius: 6,
              padding: "3px 10px",
              cursor: "pointer",
            }}
          >
            + Gợi ý thêm ({q.hints.length - hintsRevealed} còn lại)
          </button>
        )}
      </div>

      {/* Options 2×2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {/* Year showcase */}
      <div
        style={{
          background: "var(--accent-earth, rgba(196,106,47,0.06))",
          border: "1px solid rgba(196,106,47,0.2)",
          borderRadius: 14,
          padding: "18px 16px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: "0 0 4px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--accent-bronze, #c46a2f)",
          }}
        >
          Năm xảy ra sự kiện
        </p>

        <p
          style={{
            margin: "0 0 12px",
            fontSize: 52,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-2px",
            color: "var(--burning-flame, #e08040)",
          }}
        >
          {q.year}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
          {q.clues.map((c, i) => (
            <span
              key={i}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 20,
                background: "rgba(196,106,47,0.08)",
                border: "1px solid rgba(196,106,47,0.18)",
                color: "var(--burning-flame, #c46a2f)",
              }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Instruction */}
      <p style={{ margin: 0, fontSize: 12, color: "var(--content-muted)" }}>
        Kéo thả sắp xếp{" "}
        <strong style={{ color: "var(--content-text)" }}>từ sớm đến muộn nhất</strong>
      </p>

      {/* Draggable list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                borderRadius: 10,
                padding: "10px 13px",
                cursor: submitted ? "default" : "grab",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.12s",
                opacity: isDraggingThis ? 0.35 : 1,
                userSelect: "none",
              }}
            >
              {/* Handle / result dot */}
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: submitted
                    ? placedOk
                      ? "#5dcc78"
                      : "#f07070"
                    : "rgba(201,162,77,0.4)",
                }}
              />

              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--content-text)" }}>
                  {item.label}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--content-muted)" }}>
                  {item.description}
                </p>
              </div>

              {/* Year badge (post-submit) */}
              {submitted && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: placedOk ? "#1f5c34" : "#9b2222",
                    background: placedOk ? "rgba(74,178,98,0.12)" : "rgba(184,50,42,0.12)",
                    border: `1px solid ${placedOk ? "rgba(74,178,98,0.3)" : "rgba(184,50,42,0.3)"}`,
                    borderRadius: 5,
                    padding: "1px 7px",
                  }}
                >
                  {item.yearDisplay}
                </span>
              )}

              {/* Position number */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  minWidth: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 5,
                  background: "rgba(201,162,77,0.1)",
                  color: "var(--gold-on-light, #a07828)",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          style={{
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            padding: "10px 0",
            borderRadius: 9,
            background: "#e8d5a8",
            border: "1px solid #b8922a",
            color: "#5c3d0e",
            width: "100%",
          }}
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
    <div
      style={{
        background: "var(--card-light-bg)",
        border: "1px solid var(--card-light-border)",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(27,38,50,0.07)",
      }}
    >
      {/* Header — chỉ text, không icon */}
      <div
        style={{
          padding: "14px 18px 12px",
          borderBottom: "1px solid var(--card-light-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: "var(--content-heading)",
            }}
          >
            {MODE_LABELS[mode]}
          </p>
          {score.total > 0 && (
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--content-muted)" }}>
              {score.correct}/{score.total} câu đúng
            </p>
          )}
        </div>

        <button
          onClick={handleSwitchGame}
          style={{
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            padding: "5px 11px",
            borderRadius: 7,
            background: "transparent",
            border: "1px solid var(--card-light-border)",
            color: "var(--content-muted)",
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(201,162,77,0.4)";
            e.currentTarget.style.color = "var(--gold-on-light, #a07828)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--card-light-border)";
            e.currentTarget.style.color = "var(--content-muted)";
          }}
        >
          Game khác
        </button>
      </div>

      {/* Game area */}
      <div style={{ padding: "16px 18px 18px" }}>
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
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  SwordIcon,
  CalendarDotsIcon,
  SortAscendingIcon,
  TrophyIcon,
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  LightbulbIcon,
  DotsSixVerticalIcon,
  MagnifyingGlassIcon,
  CheckFatIcon,
} from "@phosphor-icons/react";
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

// ─────────────────────────────────────────
// Result Banner
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
  const bannerRef = useRef<HTMLDivElement>(null);
  const gsapRef = useRef<any>(null);

  useEffect(() => {
    import("gsap").then((mod) => {
      gsapRef.current = mod.gsap ?? mod.default;
      if (bannerRef.current)
        gsapRef.current.from(bannerRef.current, {
          y: 8,
          opacity: 0,
          duration: 0.3,
          ease: "power3.out",
        });
    });
  }, []);

  return (
    <div
      ref={bannerRef}
      style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}
    >
      {/* Status */}
      <div
        style={{
          borderRadius: 10,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: correct ? "rgba(16,40,24,0.1)" : "rgba(90,35,35,0.1)",
          border: `1px solid ${correct ? "rgba(74,178,98,0.45)" : "rgba(184,50,42,0.45)"}`,
        }}
      >
        {correct ? (
          <CheckCircleIcon size={16} weight="fill" color="#3a9e57" />
        ) : (
          <XCircleIcon size={16} weight="fill" color="#c94040" />
        )}
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

      {/* Explanation toggle */}
      {!showExp ? (
        <button
          onClick={() => setShowExp(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: "#4a3a1a",
            background: "#fdf6e8",
            border: "1px solid #d4a84b",
            borderRadius: 8,
            cursor: "pointer",
            padding: "7px 12px",
          }}
        >
          <EyeIcon size={14} weight="bold" />
          Xem giải thích
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            background: "#fdf6e8",
            border: "1px solid #c9a24d",
            borderRadius: 8,
            padding: "10px 13px",
          }}
        >
          <LightbulbIcon
            size={14}
            weight="fill"
            style={{ color: "#c46a2f", marginTop: 2, flexShrink: 0 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              lineHeight: 1.7,
              color: "#2d3d4f",
            }}
          >
            {explanation}
          </p>
        </div>
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          padding: "10px 0",
          borderRadius: 9,
          background: "#e8d5a8",
          border: "1px solid #b8922a",
          color: "#5c3d0e",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#dcc88e";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#e8d5a8";
        }}
      >
        <ArrowCounterClockwiseIcon size={13} weight="bold" />
        Câu tiếp theo
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Option Button — shared
// ─────────────────────────────────────────

function OptionBtn({
  label,
  index,
  answered,
  isAnswer,
  isSelected,
  onClick,
  accentColor,
}: {
  label: string;
  index: number;
  answered: boolean;
  isAnswer: boolean;
  isSelected: boolean;
  onClick: () => void;
  accentColor: string;
}) {
  const gsapRef = useRef<any>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    import("gsap").then((mod) => {
      gsapRef.current = mod.gsap ?? mod.default;
    });
  }, []);

  let bg = "var(--card-light-hover, rgba(27,38,50,0.03))";
  let border = "var(--card-light-border)";
  let color = "var(--content-text)";

  if (answered) {
    if (isAnswer) {
      bg = "rgba(16,40,24,0.09)";
      border = "rgba(74,178,98,0.45)";
      color = "#2d6b3e";
    } else if (isSelected) {
      bg = "rgba(90,35,35,0.09)";
      border = "rgba(184,50,42,0.45)";
      color = "#b8322a";
    } else {
      color = "var(--content-muted)";
    }
  }

  const letters = ["A", "B", "C", "D"];

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color,
        borderRadius: 9,
        padding: "9px 13px",
        fontSize: 13,
        fontWeight: 500,
        cursor: answered ? "default" : "pointer",
        textAlign: "left",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
      }}
      onMouseEnter={(e) => {
        if (!answered) {
          e.currentTarget.style.background = `${accentColor}12`;
          e.currentTarget.style.borderColor = `${accentColor}35`;
          if (gsapRef.current && btnRef.current)
            gsapRef.current.to(btnRef.current, { x: 3, duration: 0.15 });
        }
      }}
      onMouseLeave={(e) => {
        if (!answered) {
          e.currentTarget.style.background = bg;
          e.currentTarget.style.borderColor = border;
          if (gsapRef.current && btnRef.current)
            gsapRef.current.to(btnRef.current, { x: 0, duration: 0.15 });
        }
      }}
    >
      {/* Letter badge */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          minWidth: 18,
          height: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          flexShrink: 0,
          background:
            answered && isAnswer
              ? "rgba(74,178,98,0.15)"
              : answered && isSelected
                ? "rgba(184,50,42,0.15)"
                : `${accentColor}15`,
          color:
            answered && isAnswer
              ? "#5dcc78"
              : answered && isSelected
                ? "#f07070"
                : accentColor,
        }}
      >
        {letters[index]}
      </span>

      <span style={{ flex: 1 }}>{label}</span>

      {/* State icon */}
      {answered && isAnswer && (
        <CheckCircleIcon
          size={14}
          weight="fill"
          color="#5dcc78"
          style={{ flexShrink: 0 }}
        />
      )}
      {answered && isSelected && !isAnswer && (
        <XCircleIcon
          size={14}
          weight="fill"
          color="#f07070"
          style={{ flexShrink: 0 }}
        />
      )}
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
  const hintRef = useRef<HTMLUListElement>(null);
  const gsapRef = useRef<any>(null);

  useEffect(() => {
    setQ(getRandom(characterQuestions));
    import("gsap").then((mod) => {
      gsapRef.current = mod.gsap ?? mod.default;
    });
  }, []);

  const answered = selected !== null;
  const isCorrect = selected === q.answer;

  const revealHint = () => {
    if (hintsRevealed >= q.hints.length) return;
    setHintsRevealed((n) => n + 1);
    if (gsapRef.current && hintRef.current) {
      const items = hintRef.current.querySelectorAll("li");
      const last = items[items.length - 1];
      if (last)
        gsapRef.current.from(last, {
          x: -8,
          opacity: 0,
          duration: 0.25,
          ease: "power3.out",
        });
    }
  };

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
          background:
            "linear-gradient(135deg, rgba(27,38,50,0.05), rgba(201,162,77,0.04))",
          border: "1px solid rgba(201,162,77,0.18)",
          borderRadius: 12,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <MagnifyingGlassIcon
            size={13}
            weight="bold"
            style={{ color: "var(--gold-on-light)" }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--gold-on-light)",
            }}
          >
            Đây là ai?
          </p>
        </div>

        <ul
          ref={hintRef}
          style={{
            margin: 0,
            padding: "0 0 0 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {q.hints.slice(0, hintsRevealed).map((h, i) => (
            <li
              key={i}
              style={{
                fontSize: 13.5,
                color: "var(--content-text)",
                lineHeight: 1.5,
              }}
            >
              {h}
            </li>
          ))}
        </ul>

        {!answered && hintsRevealed < q.hints.length && (
          <button
            onClick={revealHint}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              marginTop: 10,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--gold-on-light)",
              background: "rgba(201,162,77,0.1)",
              border: "1px solid rgba(201,162,77,0.22)",
              borderRadius: 6,
              padding: "3px 10px",
              cursor: "pointer",
            }}
          >
            <LightbulbIcon size={11} weight="fill" />
            Gợi ý thêm ({q.hints.length - hintsRevealed} còn lại)
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
            accentColor="#a07828"
          />
        ))}
      </div>

      {answered && (
        <ResultBanner
          correct={isCorrect}
          explanation={q.explanation}
          onNext={next}
        />
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
  const yearRef = useRef<HTMLDivElement>(null);
  const gsapRef = useRef<any>(null);

  useEffect(() => {
    setQ(getRandom(eventQuestions));
    import("gsap").then((mod) => {
      gsapRef.current = mod.gsap ?? mod.default;
    });
  }, []);

  const answered = selected !== null;
  const isCorrect = selected === q.answer;

  const next = () => {
    const g = gsapRef.current;
    if (g && yearRef.current) {
      g.to(yearRef.current, {
        scale: 0.92,
        opacity: 0,
        duration: 0.18,
        ease: "power2.in",
        onComplete: () => {
          setQ(getRandom(eventQuestions, q));
          setSelected(null);
          g.fromTo(
            yearRef.current,
            { scale: 1.06, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.28, ease: "back.out(1.5)" },
          );
        },
      });
    } else {
      setQ(getRandom(eventQuestions, q));
      setSelected(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {/* Year showcase */}
      <div
        ref={yearRef}
        style={{
          background:
            "linear-gradient(135deg, var(--accent-earth), rgba(59,42,31,0.6))",
          border: "1px solid rgba(196,106,47,0.3)",
          borderRadius: 14,
          padding: "18px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <CalendarDotsIcon
            size={13}
            weight="fill"
            style={{ color: "var(--accent-bronze)" }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--accent-bronze)",
            }}
          >
            Năm xảy ra sự kiện
          </p>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 52,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-2px",
            color: "var(--burning-flame)",
            textShadow: "0 0 30px rgba(255,177,98,0.4)",
          }}
        >
          {q.year}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            justifyContent: "center",
          }}
        >
          {q.clues.map((c, i) => (
            <span
              key={i}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 20,
                background: "rgba(255,177,98,0.12)",
                border: "1px solid rgba(255,177,98,0.2)",
                color: "var(--burning-flame)",
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
            accentColor="#c46a2f"
          />
        ))}
      </div>

      {answered && (
        <ResultBanner
          correct={isCorrect}
          explanation={q.explanation}
          onNext={next}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Game 3 — Timeline Drag-to-Sort
// ─────────────────────────────────────────

function GameTimeline({ onScore }: { onScore: (c: boolean) => void }) {
  const [setIdx, setSetIdx] = useState(0);
  const [items, setItems] = useState<TimelineItem[]>(timelineSets[0]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const dragItemRef = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const gsapRef = useRef<any>(null);

  useEffect(() => {
    setItems(shuffle(timelineSets[0]));
    import("gsap").then((mod) => {
      gsapRef.current = mod.gsap ?? mod.default;
    });
  }, []);

  const correctOrder = [...timelineSets[setIdx]].sort(
    (a, b) => a.year - b.year,
  );

  const handleDragStart = (i: number) => {
    dragItemRef.current = i;
    setDragging(i);
  };
  const handleDragEnter = (i: number) => {
    dragOverRef.current = i;
    setDragOverIdx(i);
  };
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
    if (gsapRef.current && listRef.current) {
      const cards = listRef.current.querySelectorAll("[data-item]");
      gsapRef.current.from(cards, {
        scale: 0.97,
        opacity: 0.5,
        duration: 0.3,
        stagger: 0.06,
        ease: "power3.out",
      });
    }
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "rgba(201,162,77,0.05)",
          border: "1px solid rgba(201,162,77,0.15)",
          borderRadius: 9,
          padding: "9px 13px",
        }}
      >
        <SortAscendingIcon
          size={14}
          weight="bold"
          style={{ color: "var(--gold-on-light)", flexShrink: 0 }}
        />
        <p style={{ margin: 0, fontSize: 12, color: "var(--content-muted)" }}>
          Kéo thả sắp xếp{" "}
          <strong style={{ color: "var(--content-text)" }}>
            từ sớm đến muộn nhất
          </strong>
        </p>
      </div>

      {/* Draggable list */}
      <div
        ref={listRef}
        style={{ display: "flex", flexDirection: "column", gap: 6 }}
      >
        {items.map((item, i) => {
          const correctPos = correctOrder.findIndex((c) => c.id === item.id);
          const placedOk = submitted && correctPos === i;
          const placedWrong = submitted && correctPos !== i;
          const isDraggingThis = dragging === i;
          const isDragTarget = dragOverIdx === i && dragging !== i;

          return (
            <div
              key={item.id}
              data-item
              draggable={!submitted}
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              style={{
                background: placedOk
                  ? "rgba(16,40,24,0.09)"
                  : placedWrong
                    ? "rgba(90,35,35,0.09)"
                    : isDragTarget
                      ? "rgba(201,162,77,0.08)"
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
                transition: "all 0.15s",
                opacity: isDraggingThis ? 0.4 : 1,
                boxShadow: isDragTarget
                  ? "0 4px 16px rgba(201,162,77,0.12)"
                  : "none",
                userSelect: "none",
              }}
            >
              {/* Drag handle or result icon */}
              {!submitted ? (
                <DotsSixVerticalIcon
                  size={14}
                  weight="bold"
                  style={{ color: "var(--content-subtle)", flexShrink: 0 }}
                />
              ) : placedOk ? (
                <CheckCircleIcon
                  size={15}
                  weight="fill"
                  color="#5dcc78"
                  style={{ flexShrink: 0 }}
                />
              ) : (
                <XCircleIcon
                  size={15}
                  weight="fill"
                  color="#f07070"
                  style={{ flexShrink: 0 }}
                />
              )}

              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--content-text)",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: "var(--content-muted)",
                    marginTop: 2,
                  }}
                >
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
                    background: placedOk
                      ? "rgba(74,178,98,0.15)"
                      : "rgba(184,50,42,0.15)",
                    border: `1px solid ${placedOk ? "rgba(74,178,98,0.4)" : "rgba(184,50,42,0.4)"}`,
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
                  color: "var(--gold-on-light)",
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            padding: "10px 0",
            borderRadius: 9,
            background: "#e8d5a8",
            border: "1px solid #b8922a",
            color: "#5c3d0e",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#dcc88e";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#e8d5a8";
          }}
        >
          <CheckFatIcon size={14} weight="bold" />
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
// Main Widget
// ─────────────────────────────────────────

type GameMode = "character" | "event" | "timeline";

const TABS: {
  id: GameMode;
  label: string;
  Icon: React.ElementType;
  accent: string;
}[] = [
  {
    id: "character",
    label: "Đoán nhân vật",
    Icon: SwordIcon,
    accent: "#a07828",
  },
  {
    id: "event",
    label: "Đoán sự kiện",
    Icon: CalendarDotsIcon,
    accent: "#c46a2f",
  },
  {
    id: "timeline",
    label: "Sắp xếp TL",
    Icon: SortAscendingIcon,
    accent: "#2f6f73",
  },
];

export function HistoryMiniGame() {
  const [mode, setMode] = useState<GameMode>("character");
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const gsapRef = useRef<any>(null);

  useEffect(() => {
    import("gsap").then((mod) => {
      gsapRef.current = mod.gsap ?? mod.default;
      // No entrance animation — load only for tab transitions
    });
  }, []);

  const handleScore = useCallback((correct: boolean) => {
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
    }));
  }, []);

  const handleTabChange = (id: GameMode) => {
    if (id === mode) return;
    const g = gsapRef.current;
    if (g && contentRef.current) {
      g.to(contentRef.current, {
        y: -6,
        opacity: 0,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          setMode(id);
          g.fromTo(
            contentRef.current,
            { y: 8, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.25, ease: "power3.out" },
          );
        },
      });
    } else {
      setMode(id);
    }
  };

  const activeTab = TABS.find((t) => t.id === mode)!;

  return (
    <div
      ref={containerRef}
      style={{
        background: "var(--card-light-bg)",
        border: "1px solid var(--card-light-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(27,38,50,0.07)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "14px 18px 0",
          borderBottom: "1px solid var(--card-light-border)",
          background:
            "linear-gradient(to right, rgba(201,162,77,0.04), transparent)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >

          {/* Score badge */}
          {score.total > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: 20,
                background: "var(--streak-bg)",
                border: "1px solid var(--streak-border)",
                color: "var(--streak-text)",
              }}
            >
              <TrophyIcon size={11} weight="fill" />
              {score.correct}/{score.total} đúng
            </span>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex" }}>
          {TABS.map(({ id, label, Icon, accent }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: "transparent",
                border: "none",
                borderBottom:
                  mode === id ? `2px solid ${accent}` : "2px solid transparent",
                color: mode === id ? accent : "var(--content-muted)",
                marginBottom: -1,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={13} weight={mode === id ? "fill" : "regular"} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Game area ── */}
      <div ref={contentRef} style={{ padding: "16px 18px 18px", flex: 1 }}>
        {/* Active mode label */}
  

        {mode === "character" && (
          <GameGuessCharacter key="char" onScore={handleScore} />
        )}
        {mode === "event" && <GameGuessEvent key="evt" onScore={handleScore} />}
        {mode === "timeline" && <GameTimeline key="tl" onScore={handleScore} />}
      </div>
    </div>
  );
}

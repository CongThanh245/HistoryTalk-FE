"use client";

import { useState, useEffect, useRef } from "react";
import { TimelineItem, timelineSets } from "@/store/quiz";
import { shuffle } from "./types";
import { ResultBanner } from "./result-banner";

export function GameTimeline({ onScore }: { onScore: (c: boolean) => void }) {
  const [setIdx, setSetIdx] = useState(0);
  const [items, setItems] = useState<TimelineItem[]>(timelineSets[0]);
  useEffect(() => {
    setItems(shuffle(timelineSets[0]));
  }, []);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragItemRef = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);
  const correctOrder = [...timelineSets[setIdx]].sort(
    (a, b) => a.year - b.year,
  );

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

  const next = () => {
    const ni = (setIdx + 1) % timelineSets.length;
    setSetIdx(ni);
    setItems(shuffle(timelineSets[ni]));
    setSubmitted(false);
    setIsCorrect(false);
  };

  return (
    <div className="flex flex-col gap-[9px]">
      <p className="m-0 text-[11px] text-content-muted">
        Kéo thả sắp xếp{" "}
        <strong className="text-content-text">
          từ sớm → muộn nhất
        </strong>
      </p>
      <div className="flex flex-col gap-[5px]">
        {items.map((item, i) => {
          const correctPos = correctOrder.findIndex((c) => c.id === item.id);
          const placedOk = submitted && correctPos === i;
          const placedWrong = submitted && correctPos !== i;
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
              className={`rounded-[2px] border px-[11px] py-2 flex items-center gap-[9px] select-none transition-all duration-100 ${
                submitted ? "cursor-default" : "cursor-grab"
              } ${dragging === i ? "opacity-35" : "opacity-100"}`}
              style={{
                background: placedOk
                  ? "var(--status-success-bg)"
                  : placedWrong
                    ? "var(--status-danger-bg)"
                    : dragOverIdx === i && dragging !== i
                      ? "var(--accent-gold-active-bg)"
                      : "var(--bg-elevated)",
                borderColor: placedOk ? "var(--status-success)" : placedWrong ? "var(--accent-danger)" : dragOverIdx === i && dragging !== i ? "var(--text-primary)" : "var(--border-strong)",
              }}
            >
              <span
                className="w-[5px] h-[5px] rounded-full shrink-0"
                style={{
                  background: submitted
                    ? placedOk
                      ? "var(--status-success)"
                      : "var(--accent-danger)"
                    : "var(--accent-gold)",
                }}
              />
              <div className="flex-1">
                <p className="m-0 text-xs font-semibold text-content-text">
                  {item.label}
                </p>
                <p className="m-0 mt-px text-[10px] text-content-muted">
                  {item.description}
                </p>
              </div>
              {submitted && (
                <span
                  className={`text-[10px] font-extrabold rounded-[2px] px-1.5 py-px border ${
                    placedOk
                      ? "text-[var(--status-success)] bg-[var(--status-success-bg)] border-[var(--status-success-border)]"
                      : "text-[var(--accent-danger)] bg-[var(--status-danger-bg)] border-[var(--status-danger-border)]"
                  }`}
                >
                  {item.yearDisplay}
                </span>
              )}
              <span className="font-display text-[12px] font-extrabold min-w-[20px] h-[20px] flex items-center justify-center rounded-[2px] border border-[var(--text-primary)] text-[var(--text-primary)] shrink-0">
                {i + 1}
              </span>
            </div>
          );
        })}
      </div>
      {!submitted ? (
        <button
          onClick={() => {
            const ok = items.every((item, i) => item.id === correctOrder[i].id);
            setIsCorrect(ok);
            setSubmitted(true);
            onScore(ok);
          }}
          className="btn-crimson w-full min-h-[38px] cursor-pointer text-xs"
        >
          Kiểm tra thứ tự
        </button>
      ) : (
        <ResultBanner
          correct={isCorrect}
          explanation={
            isCorrect
              ? "Hoàn hảo! Đúng thứ tự thời gian."
              : `Thứ tự đúng: ${correctOrder.map((c) => `${c.label} (${c.yearDisplay})`).join(" → ")}`
          }
          onNext={next}
        />
      )}
    </div>
  );
}

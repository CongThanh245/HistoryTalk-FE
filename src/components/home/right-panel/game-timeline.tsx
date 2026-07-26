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
              className={`rounded-[9px] px-[11px] py-2 flex items-center gap-[9px] select-none transition-all duration-100 ${
                submitted ? "cursor-default" : "cursor-grab"
              } ${dragging === i ? "opacity-35" : "opacity-100"}`}
              style={{
                background: placedOk
                  ? "rgba(16,40,24,0.08)"
                  : placedWrong
                    ? "rgba(90,35,35,0.08)"
                    : dragOverIdx === i && dragging !== i
                      ? "rgba(201,162,77,0.06)"
                      : "var(--card-light-bg)",
                border: `1px solid ${placedOk ? "rgba(74,178,98,0.45)" : placedWrong ? "rgba(184,50,42,0.45)" : dragOverIdx === i && dragging !== i ? "rgba(201,162,77,0.35)" : "var(--card-light-border)"}`,
              }}
            >
              <span
                className="w-[5px] h-[5px] rounded-full shrink-0"
                style={{
                  background: submitted
                    ? placedOk
                      ? "#5dcc78"
                      : "#f07070"
                    : "rgba(201,162,77,0.4)",
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
                  className={`text-[10px] font-extrabold rounded px-1.5 py-px border ${
                    placedOk
                      ? "text-[#1f5c34] bg-[rgba(74,178,98,0.12)] border-[rgba(74,178,98,0.3)]"
                      : "text-[#9b2222] bg-[rgba(184,50,42,0.12)] border-[rgba(184,50,42,0.3)]"
                  }`}
                >
                  {item.yearDisplay}
                </span>
              )}
              <span className="text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded bg-accent-gold/10 text-gold-on-light shrink-0">
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
          className="text-xs font-bold cursor-pointer py-[9px] rounded-lg bg-[#e8d5a8] border border-[#b8922a] text-[#5c3d0e] w-full"
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

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface TourStep {
  /** CSS selector of the element to light up; when it is missing the card is centred with no cut-out. */
  target: string;
  title: string;
  body: React.ReactNode;
  /** Runs before the step is measured, e.g. to switch to the tab that holds the target. */
  before?: () => void;
}

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 6;
const CARD_W = 320;
const GAP = 14;

/** Where the card goes: beside the target if there is room, else below/above, always inside the viewport. */
function cardPosition(rect: Rect | null, cardH: number) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const clampX = (x: number) => Math.max(12, Math.min(vw - CARD_W - 12, x));
  const clampY = (y: number) => Math.max(12, Math.min(vh - cardH - 12, y));
  if (!rect) return { left: (vw - CARD_W) / 2, top: (vh - cardH) / 2 };
  const right = rect.left + rect.width + PAD + GAP;
  if (right + CARD_W <= vw - 12) return { left: right, top: clampY(rect.top) };
  const left = rect.left - PAD - GAP - CARD_W;
  if (left >= 12) return { left, top: clampY(rect.top) };
  const below = rect.top + rect.height + PAD + GAP;
  if (below + cardH <= vh - 12) return { left: clampX(rect.left), top: below };
  return { left: clampX(rect.left), top: clampY(rect.top - PAD - GAP - cardH) };
}

/**
 * Guided tour: dims the page, cuts a lit window around one element at a time and explains it in a small card
 * (Bỏ qua / Quay lại / Tiếp). `onClose(true)` when the last step is finished, `onClose(false)` when skipped.
 */
export function SpotlightTour({ steps, open, onClose }: { steps: TourStep[]; open: boolean; onClose: (finished: boolean) => void }) {
  const [index, setIndex] = React.useState(0);
  const [rect, setRect] = React.useState<Rect | null>(null);
  const [cardH, setCardH] = React.useState(200);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const step = steps[index];

  // Restart from the first step each time the tour opens.
  const [lastOpen, setLastOpen] = React.useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setIndex(0);
  }

  // Callers usually build `steps` inline (new objects every render). Reading them through a ref and keying the
  // effect on the index keeps setRect → re-render → new step object from looping.
  const stepsRef = React.useRef(steps);
  React.useEffect(() => {
    stepsRef.current = steps;
  });

  React.useEffect(() => {
    const step = stepsRef.current[index];
    if (!open || !step) return;
    step.before?.();
    let frame = 0, tries = 0;
    const measure = () => {
      const el = document.querySelector(step.target);
      if (!el && tries++ < 20) { frame = requestAnimationFrame(measure); return; } // target may render a frame later
      if (el) el.scrollIntoView({ block: "nearest", inline: "nearest" });
      const r = el?.getBoundingClientRect();
      setRect(r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null);
    };
    frame = requestAnimationFrame(measure);
    const remeasure = () => { tries = 20; measure(); };
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
    };
  }, [open, index]);

  React.useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [index, rect, open]);

  React.useEffect(() => {
    if (!open) return;
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onClose(false); return; }
      // The page's own shortcuts (Delete, digits…) must not fire behind the tour; keys that drive its buttons pass.
      if (!["Tab", "Enter", " "].includes(e.key)) e.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose, index]);

  if (!open || !step || typeof document === "undefined") return null;
  const last = index === steps.length - 1;
  const pos = cardPosition(rect, cardH);

  return createPortal(
    <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {/* Click-blocker: the tour is read, not interacted through. */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-md ring-2 ring-[var(--accent-gold)] transition-all duration-300 ease-out"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(15, 12, 10, 0.62)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[rgba(15,12,10,0.62)]" />
      )}

      <div
        ref={cardRef}
        tabIndex={-1}
        className="absolute rounded-md border border-border-card bg-[var(--bg-surface)] p-4 text-[var(--text-primary)] shadow-[var(--shadow-strong)] outline-none transition-[top,left] duration-300 ease-out"
        style={{ width: CARD_W, top: pos.top, left: pos.left }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold tabular-nums text-[var(--accent-gold)]">
            {steps.length > 1 ? `Bước ${index + 1}/${steps.length}` : "Hướng dẫn"}
          </p>
          <button type="button" onClick={() => onClose(false)} aria-label="Đóng hướng dẫn" className="-m-1 rounded-sm p-1 text-[var(--text-tertiary)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)]">
            <X size={15} />
          </button>
        </div>
        <h2 id="tour-title" className="mt-1 text-[15px] font-semibold">{step.title}</h2>
        <div className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">{step.body}</div>
        <div className="mt-4 flex items-center justify-between gap-2">
          {steps.length > 1 && !last ? (
            <button type="button" onClick={() => onClose(false)} className="text-[13px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
              Bỏ qua
            </button>
          ) : <span />}
          <div className="flex gap-2">
            {index > 0 && (
              <button type="button" onClick={() => setIndex((i) => i - 1)} className="btn-line h-8 min-h-0 px-3 text-xs">
                Quay lại
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? onClose(true) : setIndex((i) => i + 1))}
              className="btn-crimson h-8 min-h-0 px-3 text-xs"
            >
              {last ? (steps.length > 1 ? "Bắt đầu vẽ" : "Đã hiểu") : "Tiếp"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

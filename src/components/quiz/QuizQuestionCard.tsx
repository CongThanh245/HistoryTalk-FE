"use client";

import React from "react";
import {
  Bookmark,
  Check,
  CheckCircle2,
  Link2,
  ListChecks,
  PenLine,
  X,
  XCircle,
} from "lucide-react";
import type { QuizQuestion } from "@/services/quiz.service";
import {
  QUESTION_TYPE_LABELS,
  describeCorrectAnswer,
  gradeAnswer,
  hasAnswerKey,
  isAnswerComplete,
  optionLabel,
  type AnswerData,
  type MatchingPair,
} from "@/features/quiz/question-data";
import { cn } from "@/lib/utils/cn";

const TYPE_ICON = {
  MULTIPLE_CHOICE: ListChecks,
  FILL_IN_BLANK: PenLine,
  MATCHING: Link2,
} as const;


interface QuizQuestionCardProps {
  question: QuizQuestion;
  index: number;
  answer: AnswerData | undefined;
  onAnswer: (questionId: string, answer: AnswerData) => void;
  flagged?: boolean;
  onToggleFlag?: (questionId: string) => void;
  /**
   * Che do luyen tap: lo dap an ngay khi da tra loi xong, khoa lai khong cho sua.
   * Chi co tac dung khi questionData co dap an — BE hien luoc dap an luc bat dau
   * lam bai, khi do dap an se hien o man ket qua sau khi nop.
   */
  practiceMode?: boolean;
}

export function QuizQuestionCard({
  question,
  index,
  answer,
  onAnswer,
  flagged = false,
  onToggleFlag,
  practiceMode = false,
}: QuizQuestionCardProps) {
  const complete = isAnswerComplete(question, answer);
  const revealed =
    practiceMode &&
    complete &&
    question.questionType !== "FILL_IN_BLANK" &&
    hasAnswerKey(question);
  const isCorrect = revealed && gradeAnswer(question, answer);
  const TypeIcon = TYPE_ICON[question.questionType];

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-[var(--bg-surface)] transition-[border-color,box-shadow] duration-300",
        revealed
          ? isCorrect
            ? "border-[var(--status-success)]"
            : "quiz-shake border-[var(--accent-danger)]"
          : complete
            ? "border-[var(--jade)]"
            : "border-border-card hover:shadow-[var(--shadow-soft)]",
      )}
    >
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-colors duration-300",
              complete
                ? "bg-[var(--jade)] text-[#FFFFFF]"
                : "bg-[var(--status-neutral-bg)] text-content-heading",
            )}
          >
            {complete ? (
              <Check size={18} strokeWidth={3} aria-label={`Câu ${index + 1}, đã trả lời`} />
            ) : (
              <span aria-label={`Câu ${index + 1}`}>{index + 1}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              {complete && (
                <span className="text-[11px] font-bold tabular-nums text-[var(--jade)]">
                  Câu {index + 1}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-content-muted">
                <TypeIcon size={11} aria-hidden="true" />
                {QUESTION_TYPE_LABELS[question.questionType]}
              </span>
            </div>
            <p className="text-[17px] font-semibold leading-relaxed text-content-heading">
              {question.content}
            </p>
          </div>
          {onToggleFlag && (
            <button
              onClick={() => onToggleFlag(question.questionId)}
              className={cn(
                "flex-shrink-0 rounded-full p-2 transition-colors",
                flagged
                  ? "quiz-pop bg-[var(--accent-gold)] text-[#FFFFFF]"
                  : "text-content-subtle hover:bg-[var(--bg-elevated)] hover:text-content-heading",
              )}
              title={flagged ? "Bỏ đánh dấu" : "Đánh dấu để xem lại"}
            >
              <Bookmark size={16} fill={flagged ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>

      {revealed && (
        <div
          className={cn(
            "mx-5 mb-3 flex items-center gap-2 rounded-[4px] px-4 py-2.5 text-[14px] font-bold text-[#FFFFFF]",
            isCorrect
              ? "quiz-pop bg-[var(--status-success)]"
              : "bg-[var(--accent-danger)]",
          )}
        >
          {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {isCorrect
            ? "Chính xác! 🎉"
            : `Sai rồi — đáp án đúng là ${describeCorrectAnswer(question)}`}
        </div>
      )}

      {question.questionType === "FILL_IN_BLANK" ? (
        <FillInBlankInput
          question={question}
          answer={answer}
          onAnswer={onAnswer}
        />
      ) : question.questionType === "MATCHING" ? (
        <MatchingInput
          question={question}
          answer={answer}
          onAnswer={onAnswer}
          locked={revealed}
        />
      ) : (
        <MultipleChoiceInput
          question={question}
          answer={answer}
          onAnswer={onAnswer}
          revealed={revealed}
        />
      )}

      {revealed && question.explanation && (
        <div className="mx-5 mb-5 rounded-[4px] border-l-4 border-[var(--accent-brass)] bg-[var(--bg-elevated)] px-4 py-3 text-xs leading-5 text-content-muted">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-content-heading">
            Giải thích:{" "}
          </span>
          {question.explanation}
        </div>
      )}
    </div>
  );
}

// ── Multiple choice ────────────────────────────────────────

type TileState = "idle" | "dimmed" | "selected" | "correct" | "wrong" | "muted";

function MultipleChoiceInput({
  question,
  answer,
  onAnswer,
  revealed,
}: {
  question: QuizQuestion;
  answer: AnswerData | undefined;
  onAnswer: QuizQuestionCardProps["onAnswer"];
  revealed: boolean;
}) {
  const options = question.questionData.options ?? [];
  const correctIds = question.questionData.correctOptionIds ?? [];
  const selectedIds = answer?.selectedOptionIds ?? [];
  const hasSelection = selectedIds.length > 0;

  return (
    <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
      {options.map((option, optIndex) => {
        const selected = selectedIds.includes(option.id);
        const state: TileState = revealed
          ? correctIds.includes(option.id)
            ? "correct"
            : selected
              ? "wrong"
              : "muted"
          : selected
            ? "selected"
            : hasSelection
              ? "dimmed"
              : "idle";
        return (
          <button
            key={option.id}
            onClick={() =>
              !revealed &&
              onAnswer(question.questionId, { selectedOptionIds: [option.id] })
            }
            disabled={revealed}
            aria-pressed={selected}
            className={cn(
              "relative flex min-h-[56px] w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-content-heading transition-colors duration-150",
              (state === "idle" || state === "dimmed") &&
                "border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]",
              state === "selected" &&
                "border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)] font-semibold",
              state === "correct" &&
                "cursor-default border-[var(--status-success)] bg-[var(--status-success-bg)] font-semibold",
              state === "wrong" &&
                "cursor-default border-[var(--accent-danger)] bg-[var(--status-danger-bg)] font-semibold",
              state === "muted" &&
                "cursor-default border-[var(--border-default)] bg-[var(--bg-surface)] text-content-muted opacity-60",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border text-sm font-semibold",
                state === "selected"
                  ? "border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[#FFFFFF]"
                  : state === "correct"
                    ? "border-[var(--status-success)] bg-[var(--status-success)] text-[#FFFFFF]"
                    : state === "wrong"
                      ? "border-[var(--accent-danger)] bg-[var(--accent-danger)] text-[#FFFFFF]"
                      : "border-[var(--border-strong)] text-[var(--text-secondary)]",
              )}
              aria-hidden="true"
            >
              {optionLabel(optIndex)}
            </span>
            <span className="flex-1 text-[15px] leading-snug">
              <span className="sr-only">{optionLabel(optIndex)}. </span>
              {option.text}
            </span>
            {state === "correct" && <Check size={18} strokeWidth={3} className="flex-shrink-0 text-[var(--status-success)]" aria-label="Đáp án đúng" />}
            {state === "wrong" && <X size={18} strokeWidth={3} className="flex-shrink-0 text-[var(--accent-danger)]" aria-label="Bạn chọn sai" />}
          </button>
        );
      })}
    </div>
  );
}

// ── Fill in blank ──────────────────────────────────────────

function FillInBlankInput({
  question,
  answer,
  onAnswer,
}: {
  question: QuizQuestion;
  answer: AnswerData | undefined;
  onAnswer: QuizQuestionCardProps["onAnswer"];
}) {
  return (
    <div className="px-5 pb-5">
      <div className="relative">
        <PenLine
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--men-lam)]"
          aria-hidden="true"
        />
        <input
          type="text"
          value={answer?.answers?.[0] ?? ""}
          onChange={(event) =>
            onAnswer(question.questionId, { answers: [event.target.value] })
          }
          placeholder="Nhập câu trả lời của bạn..."
          className="h-12 w-full rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] pl-11 pr-4 text-[16px] font-semibold text-content-heading outline-none transition-[border-color,box-shadow] placeholder:font-normal focus:border-[var(--men-lam)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--men-lam)_20%,transparent)]"
        />
      </div>
    </div>
  );
}

// ── Matching ───────────────────────────────────────────────

// Moi cap noi mot mau rieng de nhin day noi la biet cap nao voi cap nao.
const PAIR_COLORS = [
  { stroke: "var(--men-lam)", tone: "[--pair:var(--men-lam)]" },
  { stroke: "var(--accent-teal)", tone: "[--pair:var(--accent-teal)]" },
  { stroke: "var(--accent-brass)", tone: "[--pair:var(--accent-brass)]" },
  { stroke: "var(--accent-gold)", tone: "[--pair:var(--accent-gold)]" },
  { stroke: "var(--accent-blue)", tone: "[--pair:var(--accent-blue)]" },
];

type Side = "left" | "right";
type Anchor = { x: number; y: number };
type DragLine = { side: Side; id: string; from: Anchor; to: Anchor };

function curvePath(from: Anchor, to: Anchor) {
  const bend = Math.max(24, Math.abs(to.x - from.x) / 2);
  const dir = to.x >= from.x ? 1 : -1;
  return `M ${from.x} ${from.y} C ${from.x + bend * dir} ${from.y}, ${to.x - bend * dir} ${to.y}, ${to.x} ${to.y}`;
}

function MatchingInput({
  question,
  answer,
  onAnswer,
  locked,
}: {
  question: QuizQuestion;
  answer: AnswerData | undefined;
  onAnswer: QuizQuestionCardProps["onAnswer"];
  locked: boolean;
}) {
  const leftItems = question.questionData.leftItems ?? [];
  const rightItems = question.questionData.rightItems ?? [];
  const correctPairs = question.questionData.correctPairs ?? [];
  const pairs = answer?.pairs ?? [];

  const containerRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef(new Map<string, HTMLElement>());
  const [anchors, setAnchors] = React.useState<Record<string, Anchor>>({});
  // Muc dang duoc chon (bam/cham) cho cach noi khong can keo.
  const [active, setActive] = React.useState<{ side: Side; id: string } | null>(null);
  const [drag, setDrag] = React.useState<DragLine | null>(null);
  const [hoverTarget, setHoverTarget] = React.useState<string | null>(null);
  const pointerTypeRef = React.useRef<string>("");

  const leftIndex = (id: string) => leftItems.findIndex((item) => item.id === id);
  const colorOf = (leftId: string) => PAIR_COLORS[Math.max(0, leftIndex(leftId)) % PAIR_COLORS.length];
  const rightOf = (leftId: string) => pairs.find((pair) => pair.leftId === leftId)?.rightId;
  const leftOf = (rightId: string) => pairs.find((pair) => pair.rightId === rightId)?.leftId;

  const itemKey = (side: Side, id: string) => `${side}:${id}`;
  const registerItem = (side: Side, id: string) => (node: HTMLElement | null) => {
    if (node) itemRefs.current.set(itemKey(side, id), node);
    else itemRefs.current.delete(itemKey(side, id));
  };

  // Diem moc cua day noi: canh phai the trai, canh trai the phai (toa do trong khung chua).
  const measure = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const box = container.getBoundingClientRect();
    const next: Record<string, Anchor> = {};
    itemRefs.current.forEach((node, key) => {
      const rect = node.getBoundingClientRect();
      const isLeft = key.startsWith("left:");
      next[key] = {
        x: (isLeft ? rect.right : rect.left) - box.left,
        y: rect.top + rect.height / 2 - box.top,
      };
    });
    setAnchors(next);
  }, []);

  React.useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    itemRefs.current.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [measure, leftItems.length, rightItems.length]);

  function commit(next: MatchingPair[]) {
    // Giu thu tu theo cot trai cho de doc khi gui len BE.
    next.sort((a, b) => leftIndex(a.leftId) - leftIndex(b.leftId));
    onAnswer(question.questionId, { pairs: next });
  }

  // Noi 1-1: mot muc ben phai chi thuoc ve mot muc ben trai, noi lai se thay day cu.
  function connect(leftId: string, rightId: string) {
    const rest = pairs.filter((pair) => pair.leftId !== leftId && pair.rightId !== rightId);
    commit([...rest, { leftId, rightId }]);
  }

  function disconnect(leftId: string) {
    commit(pairs.filter((pair) => pair.leftId !== leftId));
  }

  function handleSelect(side: Side, id: string) {
    if (locked) return;
    if (active && active.side !== side) {
      if (side === "right") connect(active.id, id);
      else connect(id, active.id);
      setActive(null);
      return;
    }
    setActive(active?.side === side && active.id === id ? null : { side, id });
  }

  function pointerPosition(event: { clientX: number; clientY: number }): Anchor {
    const box = containerRef.current?.getBoundingClientRect();
    return { x: event.clientX - (box?.left ?? 0), y: event.clientY - (box?.top ?? 0) };
  }

  function targetAt(clientX: number, clientY: number, from: Side) {
    const element = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-match-side]");
    if (!element || element.dataset.matchSide === from) return null;
    return element.dataset.matchId ?? null;
  }

  // Keo bang chuot/but; tren man hinh cam ung dung cach cham hai lan de khong chan cuon trang.
  function handlePointerDown(event: React.PointerEvent, side: Side, id: string) {
    pointerTypeRef.current = event.pointerType;
    if (locked || event.pointerType === "touch" || event.button !== 0) return;
    const from = anchors[itemKey(side, id)];
    if (!from) return;
    event.preventDefault();
    const start = { x: event.clientX, y: event.clientY };
    let moved = false;
    const onMove = (moveEvent: PointerEvent) => {
      if (!moved && Math.hypot(moveEvent.clientX - start.x, moveEvent.clientY - start.y) < 6) return;
      moved = true;
      setDrag({ side, id, from, to: pointerPosition(moveEvent) });
      setHoverTarget(targetAt(moveEvent.clientX, moveEvent.clientY, side));
    };
    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDrag(null);
      setHoverTarget(null);
      if (!moved) {
        handleSelect(side, id);
        return;
      }
      const target = targetAt(upEvent.clientX, upEvent.clientY, side);
      if (target) {
        if (side === "left") connect(id, target);
        else connect(target, id);
      }
      setActive(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  const statusOf = (leftId: string) => {
    if (!locked) return null;
    const correctRight = correctPairs.find((pair) => pair.leftId === leftId)?.rightId;
    return rightOf(leftId) === correctRight ? "correct" : "wrong";
  };

  const renderItem = (side: Side, item: { id: string; text: string }, index: number) => {
    const pairedLeft = side === "left" ? (rightOf(item.id) ? item.id : undefined) : leftOf(item.id);
    const color = pairedLeft ? colorOf(pairedLeft) : undefined;
    const isActive = active?.side === side && active.id === item.id;
    const isDragSource = drag?.side === side && drag.id === item.id;
    const isHoverTarget = !!drag && drag.side !== side && hoverTarget === item.id;
    const awaitsPartner = !!active && active.side !== side;
    const status = side === "left" ? statusOf(item.id) : null;
    const correctRight =
      side === "left" && status === "wrong"
        ? rightItems.find((right) => right.id === correctPairs.find((pair) => pair.leftId === item.id)?.rightId)
        : undefined;
    const badge = side === "left" ? String(index + 1) : optionLabel(index);

    return (
      <div key={item.id} className="relative">
        <button
          type="button"
          ref={registerItem(side, item.id)}
          data-match-side={side}
          data-match-id={item.id}
          disabled={locked}
          aria-pressed={isActive}
          aria-label={`${side === "left" ? "Mục" : "Đáp án"} ${badge}: ${item.text}`}
          onPointerDown={(event) => handlePointerDown(event, side, item.id)}
          onClick={(event) => {
            // Chuot da xu ly o pointerup; click o day danh cho cham va ban phim.
            const viaPointer = event.detail > 0 && (pointerTypeRef.current === "mouse" || pointerTypeRef.current === "pen");
            pointerTypeRef.current = "";
            if (!viaPointer) handleSelect(side, item.id);
          }}
          className={cn(
            color?.tone,
            "flex min-h-[52px] w-full select-none items-center gap-2.5 rounded-lg border-2 px-3 py-2 text-left text-[14px] leading-snug text-content-heading transition-[border-color,background-color,box-shadow] duration-150 sm:text-[15px]",
            side === "right" && "flex-row-reverse text-right",
            !locked && "cursor-grab active:cursor-grabbing",
            locked && "cursor-default",
            status === "correct" && "border-[var(--status-success)] bg-[var(--status-success-bg)]",
            status === "wrong" && "border-[var(--accent-danger)] bg-[var(--status-danger-bg)]",
            !status && color && "border-[var(--pair)] bg-[color-mix(in_srgb,var(--pair)_10%,var(--bg-surface))]",
            !status && !color && "border-[var(--border-default)] bg-[var(--bg-elevated)]",
            !locked && !color && "hover:border-[var(--border-strong)]",
            (isActive || isDragSource) && "border-[var(--text-primary)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--text-primary)_15%,transparent)]",
            isHoverTarget && "border-[var(--text-primary)] bg-[var(--bg-surface)]",
            awaitsPartner && !color && "border-dashed border-[var(--border-strong)]",
          )}
        >
          <span
            className={cn(
              "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold",
              color && !status
                ? "bg-[var(--pair)] text-[#FFFFFF]"
                : "border border-[var(--border-strong)] text-[var(--text-secondary)]",
            )}
            aria-hidden="true"
          >
            {badge}
          </span>
          <span className="min-w-0 flex-1 break-words font-medium">{item.text}</span>
          {/* Cham noi o mep the, goi y cho nguoi dung keo tu day. */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 bg-[var(--bg-surface)]",
              side === "left" ? "-right-[7px]" : "-left-[7px]",
              color && !status ? "border-[var(--pair)] bg-[var(--pair)]" : "border-[var(--border-strong)]",
            )}
          />
        </button>
        {correctRight && (
          <p className="mt-1 pl-1 text-xs font-medium text-[var(--status-success)]">
            Đúng: {optionLabel(rightItems.indexOf(correctRight))}. {correctRight.text}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="px-5 pb-5">
      {!locked && (
        <div className="mb-3 flex items-center justify-between gap-3 text-xs text-content-muted">
          <span>
            {active
              ? "Giờ chọn mục ở cột bên kia để nối."
              : "Kéo từ một mục sang mục tương ứng ở cột bên kia (hoặc chạm lần lượt hai mục). Bấm vào dây nối để gỡ."}
          </span>
          {pairs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setActive(null);
                commit([]);
              }}
              className="flex-shrink-0 font-semibold text-[var(--text-secondary)] underline-offset-2 hover:text-content-heading hover:underline"
            >
              Nối lại từ đầu
            </button>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className="relative grid grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] items-start sm:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)]"
      >
        <div className="space-y-2.5">{leftItems.map((item, index) => renderItem("left", item, index))}</div>
        <div aria-hidden="true" />
        <div className="space-y-2.5">{rightItems.map((item, index) => renderItem("right", item, index))}</div>

        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          {pairs.map((pair) => {
            const from = anchors[itemKey("left", pair.leftId)];
            const to = anchors[itemKey("right", pair.rightId)];
            if (!from || !to) return null;
            const status = statusOf(pair.leftId);
            const stroke =
              status === "correct"
                ? "var(--status-success)"
                : status === "wrong"
                  ? "var(--accent-danger)"
                  : colorOf(pair.leftId).stroke;
            const path = curvePath(from, to);
            return (
              <g key={`${pair.leftId}-${pair.rightId}`} className="group">
                <path d={path} fill="none" stroke={stroke} strokeWidth={3} strokeLinecap="round" strokeDasharray={status === "wrong" ? "6 5" : undefined} />
                {!locked && (
                  // Vung bam rong hon net ve de de go day.
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                    className="pointer-events-auto cursor-pointer"
                    onClick={() => disconnect(pair.leftId)}
                  >
                    <title>Bấm để gỡ dây nối</title>
                  </path>
                )}
              </g>
            );
          })}
          {drag && (
            <path
              d={drag.side === "left" ? curvePath(drag.from, drag.to) : curvePath(drag.to, drag.from)}
              fill="none"
              stroke="var(--text-primary)"
              strokeWidth={2.5}
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

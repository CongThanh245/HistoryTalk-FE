"use client";

import React from "react";
import {
  Bookmark,
  Check,
  CheckCircle2,
  Circle,
  Diamond,
  Link2,
  ListChecks,
  PenLine,
  Square,
  Triangle,
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

// O dap an kieu Kahoot: moi vi tri co mot mau + mot hinh rieng de de nhan biet.
const OPTION_TILES = [
  {
    color: "[--opt:var(--accent-gold)]",
    ink: "text-[#FFFFFF]",
    shape: Triangle,
  },
  { color: "[--opt:var(--men-lam)]", ink: "text-[#FFFFFF]", shape: Diamond },
  { color: "[--opt:var(--gold-leaf)]", ink: "text-[#1F1A14]", shape: Circle },
  { color: "[--opt:var(--jade)]", ink: "text-[#FFFFFF]", shape: Square },
];

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
        "relative rounded-[4px] border-2 bg-[var(--bg-surface)] transition-[border-color,box-shadow] duration-300",
        revealed
          ? isCorrect
            ? "border-[var(--status-success)] shadow-[5px_5px_0_var(--status-success)]"
            : "quiz-shake border-[var(--accent-danger)] shadow-[5px_5px_0_var(--accent-danger)]"
          : complete
            ? "border-[var(--jade)] shadow-[5px_5px_0_var(--jade)]"
            : "border-[var(--text-primary)] shadow-[5px_5px_0_var(--border-strong)] hover:shadow-[5px_5px_0_var(--accent-gold)]",
      )}
    >
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-[4px] transition-colors duration-300",
              complete
                ? "quiz-pop bg-[var(--jade)] text-[#FFFFFF]"
                : "bg-[var(--text-primary)] text-[var(--text-inverse)]",
            )}
          >
            {complete ? (
              <Check size={26} strokeWidth={3} aria-label="Đã trả lời" />
            ) : (
              <>
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] opacity-70">
                  Câu
                </span>
                <span className="font-display text-[24px] font-extrabold leading-none tabular-nums">
                  {index + 1}
                </span>
              </>
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
        const tile = OPTION_TILES[optIndex % OPTION_TILES.length];
        const Shape = tile.shape;
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
        const filled =
          state === "selected" || state === "correct" || state === "wrong";
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
              "relative flex min-h-[64px] w-full items-center gap-3 rounded-[6px] border-2 px-3 py-3 text-left transition-all duration-200",
              tile.color,
              state === "idle" &&
                "border-[var(--opt)] bg-[color-mix(in_srgb,var(--opt)_9%,var(--bg-surface))] text-content-heading shadow-[0_4px_0_var(--opt)] hover:-translate-y-0.5 hover:bg-[color-mix(in_srgb,var(--opt)_18%,var(--bg-surface))] hover:shadow-[0_6px_0_var(--opt)] active:translate-y-1 active:shadow-none",
              state === "dimmed" &&
                "border-[var(--opt)] bg-[var(--bg-surface)] text-content-muted opacity-60 shadow-[0_4px_0_var(--opt)] hover:opacity-100 active:translate-y-1 active:shadow-none",
              state === "selected" &&
                cn(
                  "quiz-pop border-[var(--opt)] bg-[var(--opt)] font-semibold shadow-[0_4px_0_color-mix(in_srgb,var(--opt)_60%,black)]",
                  tile.ink,
                ),
              state === "correct" &&
                "quiz-pop cursor-default border-[var(--status-success)] bg-[var(--status-success)] font-semibold text-[#FFFFFF] shadow-[0_4px_0_color-mix(in_srgb,var(--status-success)_60%,black)]",
              state === "wrong" &&
                "cursor-default border-[var(--accent-danger)] bg-[var(--accent-danger)] font-semibold text-[#FFFFFF]",
              state === "muted" &&
                "cursor-default border-[var(--border-default)] bg-[var(--bg-surface)] text-content-muted opacity-50",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[4px]",
                filled
                  ? "bg-[rgba(255,255,255,0.25)]"
                  : "bg-[var(--opt)] text-[#FFFFFF]",
              )}
              aria-hidden="true"
            >
              <Shape size={18} fill="currentColor" strokeWidth={0} />
            </span>
            <span className="flex-1 text-[15px] leading-snug">
              <span className="sr-only">{optionLabel(optIndex)}. </span>
              {option.text}
            </span>
            {(state === "selected" || state === "correct") && (
              <span className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#FFFFFF] text-[#1F1A14]">
                <span
                  className="quiz-burst absolute inset-0 rounded-full bg-[#FFFFFF]"
                  aria-hidden="true"
                />
                <Check size={16} strokeWidth={3} />
              </span>
            )}
            {state === "wrong" && (
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#FFFFFF] text-[var(--accent-danger)]">
                <X size={16} strokeWidth={3} />
              </span>
            )}
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
          className="h-14 w-full rounded-[6px] border-2 border-[var(--men-lam)] bg-[color-mix(in_srgb,var(--men-lam)_6%,var(--bg-surface))] pl-11 pr-4 text-[16px] font-semibold text-content-heading shadow-[0_4px_0_var(--men-lam)] outline-none transition-shadow placeholder:font-normal focus:shadow-[0_4px_0_var(--men-lam),0_0_0_4px_color-mix(in_srgb,var(--men-lam)_20%,transparent)]"
        />
      </div>
    </div>
  );
}

// ── Matching ───────────────────────────────────────────────

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

  function setPair(leftId: string, rightId: string) {
    const rest = pairs.filter((pair) => pair.leftId !== leftId);
    const next: MatchingPair[] = rightId
      ? [...rest, { leftId, rightId }]
      : rest;
    // Giu thu tu theo cot trai cho de doc khi gui len BE.
    next.sort(
      (a, b) =>
        leftItems.findIndex((item) => item.id === a.leftId) -
        leftItems.findIndex((item) => item.id === b.leftId),
    );
    onAnswer(question.questionId, { pairs: next });
  }

  return (
    <div className="space-y-2.5 px-5 pb-5">
      {leftItems.map((left, leftIndex) => {
        const chosen =
          pairs.find((pair) => pair.leftId === left.id)?.rightId ?? "";
        const correctRight = correctPairs.find(
          (pair) => pair.leftId === left.id,
        )?.rightId;
        const status = !locked
          ? null
          : chosen === correctRight
            ? "correct"
            : "wrong";
        return (
          <div
            key={left.id}
            className={cn(
              "flex flex-col gap-2 rounded-[6px] border-2 px-3 py-2.5 transition-colors sm:flex-row sm:items-center",
              OPTION_TILES[leftIndex % OPTION_TILES.length].color,
              chosen
                ? "border-[var(--opt)] bg-[color-mix(in_srgb,var(--opt)_12%,var(--bg-surface))]"
                : "border-[var(--border-strong)] bg-[var(--bg-surface)]",
            )}
          >
            <span className="flex flex-1 items-center gap-2.5 text-[15px] font-semibold text-content-heading">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[4px] bg-[var(--opt)] text-[#FFFFFF]">
                <Link2 size={14} aria-hidden="true" />
              </span>
              {left.text}
            </span>
            <select
              value={chosen}
              disabled={locked}
              onChange={(event) => setPair(left.id, event.target.value)}
              className={cn(
                "h-11 rounded-[4px] border-2 bg-[var(--bg-surface)] px-2 text-sm font-medium text-content-heading outline-none sm:w-[50%]",
                status === "correct"
                  ? "border-[var(--status-success)]"
                  : status === "wrong"
                    ? "border-[var(--accent-danger)]"
                    : "border-[var(--border-strong)] focus:border-[var(--text-primary)]",
              )}
            >
              <option value="">— Chọn —</option>
              {rightItems.map((right) => (
                <option key={right.id} value={right.id}>
                  {right.text}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}

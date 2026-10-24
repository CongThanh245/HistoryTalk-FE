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

// Dap an trung tinh, danh dau A/B/C/D (khong dung mau + hinh rieng tung o nhu Kahoot): mau chi de bao da chon / dung / sai.
const OPTION_TILES = [{ color: "[--opt:var(--accent-gold)]" }];

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
              "flex flex-col gap-2 rounded-lg border px-3 py-2.5 transition-colors sm:flex-row sm:items-center",
              OPTION_TILES[leftIndex % OPTION_TILES.length].color,
              chosen
                ? "border-[var(--opt)] bg-[color-mix(in_srgb,var(--opt)_12%,var(--bg-surface))]"
                : "border-[var(--border-strong)] bg-[var(--bg-surface)]",
            )}
          >
            <span className="flex flex-1 items-center gap-2.5 text-[15px] font-semibold text-content-heading">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-[var(--border-strong)] text-[var(--text-secondary)]">
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

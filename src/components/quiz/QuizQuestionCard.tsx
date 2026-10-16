"use client";

import React from "react";
import { Bookmark, CheckCircle2, XCircle } from "lucide-react";
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

  return (
    <div className="rounded-[2px] overflow-hidden transition-colors duration-200 bg-[var(--bg-surface)] border border-[var(--text-primary)]">
      <div className="px-5 py-4 border-b border-[var(--text-primary)]">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 font-display text-[28px] font-extrabold leading-none text-accent-gold tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 pt-0.5">
            {question.questionType !== "MULTIPLE_CHOICE" && (
              <span className="mb-1 inline-block text-[10px] font-bold uppercase tracking-[0.1em] text-content-subtle">
                {QUESTION_TYPE_LABELS[question.questionType]}
              </span>
            )}
            <p className="text-[15px] font-semibold leading-relaxed text-content-heading">
              {question.content}
            </p>
          </div>
          {onToggleFlag && (
            <button
              onClick={() => onToggleFlag(question.questionId)}
              className={cn(
                "flex-shrink-0 p-1 -mt-0.5 -mr-1 rounded-[2px] border border-transparent transition-colors hover:border-[var(--text-primary)]",
                flagged ? "text-accent-gold" : "text-content-subtle",
              )}
              title={flagged ? "Bỏ đánh dấu" : "Đánh dấu để xem lại"}
            >
              <Bookmark size={16} fill={flagged ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>

      <div>
        {revealed && (
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] border-b border-[var(--border-default)]",
              isCorrect
                ? "bg-[var(--status-success-bg)] text-[var(--status-success)]"
                : "bg-[var(--status-danger-bg)] text-accent-danger",
            )}
          >
            {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {isCorrect ? "Chính xác!" : `Sai rồi — đáp án đúng là ${describeCorrectAnswer(question)}`}
          </div>
        )}

        {question.questionType === "FILL_IN_BLANK" ? (
          <FillInBlankInput question={question} answer={answer} onAnswer={onAnswer} />
        ) : question.questionType === "MATCHING" ? (
          <MatchingInput question={question} answer={answer} onAnswer={onAnswer} locked={revealed} />
        ) : (
          <MultipleChoiceInput question={question} answer={answer} onAnswer={onAnswer} revealed={revealed} />
        )}

        {revealed && question.explanation && (
          <div className="px-4 py-3 text-xs leading-5 border-t border-[var(--text-primary)] bg-[var(--bg-elevated)] text-content-muted">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-content-heading">
              Giải thích:{" "}
            </span>
            {question.explanation}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Multiple choice ────────────────────────────────────────

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

  function getOptionClasses(optionId: string) {
    const selected = selectedIds.includes(optionId);
    if (revealed) {
      if (correctIds.includes(optionId)) {
        return "bg-[var(--status-success)] text-[var(--text-inverse)] font-semibold cursor-default";
      }
      if (selected) {
        return "bg-[var(--accent-danger)] text-[var(--text-inverse)] font-semibold cursor-default";
      }
      return "bg-[var(--bg-surface)] text-content-muted cursor-default";
    }
    if (selected) {
      return "bg-[var(--text-primary)] text-[var(--text-inverse)] font-semibold cursor-pointer";
    }
    return "bg-[var(--bg-surface)] text-content-heading cursor-pointer hover:bg-[var(--bg-elevated)]";
  }

  return (
    <>
      {options.map((option, optIndex) => {
        const selected = selectedIds.includes(option.id);
        return (
          <button
            key={option.id}
            onClick={() => !revealed && onAnswer(question.questionId, { selectedOptionIds: [option.id] })}
            disabled={revealed}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 border-b border-[var(--border-default)] last:border-b-0",
              getOptionClasses(option.id),
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-[2px] flex items-center justify-center text-xs font-bold border",
                revealed && (correctIds.includes(option.id) || selected)
                  ? "border-[var(--text-inverse)] text-[var(--text-inverse)]"
                  : selected
                    ? "bg-[var(--text-inverse)] text-[var(--text-primary)] border-[var(--text-inverse)]"
                    : "bg-transparent text-content-muted border-[var(--border-strong)]",
              )}
            >
              {optionLabel(optIndex)}
            </span>
            <span className="flex-1 text-sm">{option.text}</span>
          </button>
        );
      })}
    </>
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
    <div className="px-4 py-4">
      <input
        type="text"
        value={answer?.answers?.[0] ?? ""}
        onChange={(event) => onAnswer(question.questionId, { answers: [event.target.value] })}
        placeholder="Nhập câu trả lời của bạn..."
        className="w-full h-11 px-3 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-sm text-content-heading outline-none focus:border-[var(--text-primary)]"
      />
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
    const next: MatchingPair[] = rightId ? [...rest, { leftId, rightId }] : rest;
    // Giu thu tu theo cot trai cho de doc khi gui len BE.
    next.sort(
      (a, b) =>
        leftItems.findIndex((item) => item.id === a.leftId) -
        leftItems.findIndex((item) => item.id === b.leftId),
    );
    onAnswer(question.questionId, { pairs: next });
  }

  return (
    <div className="divide-y divide-[var(--border-default)]">
      {leftItems.map((left) => {
        const chosen = pairs.find((pair) => pair.leftId === left.id)?.rightId ?? "";
        const correctRight = correctPairs.find((pair) => pair.leftId === left.id)?.rightId;
        const status = !locked ? null : chosen === correctRight ? "correct" : "wrong";
        return (
          <div key={left.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
            <span className="flex-1 text-sm font-medium text-content-heading">{left.text}</span>
            <select
              value={chosen}
              disabled={locked}
              onChange={(event) => setPair(left.id, event.target.value)}
              className={cn(
                "h-10 sm:w-[55%] px-2 rounded-[2px] border bg-[var(--bg-elevated)] text-sm text-content-heading outline-none",
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

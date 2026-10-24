"use client";

import React from "react";
import {
  optionLabel,
  type AnswerData,
  type TypedQuestion,
} from "@/features/quiz/question-data";
import { cn } from "@/lib/utils/cn";

const CORRECT_CLASSES =
  "bg-[var(--status-success-bg)] border-[var(--status-success)] text-[var(--status-success)] font-bold";
const WRONG_CLASSES =
  "bg-[var(--status-danger-bg)] border-[var(--accent-danger)] text-accent-danger font-bold";
const NEUTRAL_CLASSES =
  "bg-[var(--bg-elevated)] border-[var(--border-default)] text-content-muted font-medium";

interface QuestionAnswerReviewProps {
  question: TypedQuestion;
  answer: AnswerData | null | undefined;
  correct: boolean;
}

/**
 * Hien dap an nguoi dung da chon so voi dap an dung cho 1 cau hoi
 * (trac nghiem / dien chu / noi cap). Neu questionData khong co dap an
 * (vd. phien lam bai chua tai duoc chi tiet) thi chi hien lua chon cua nguoi dung.
 */
export function QuestionAnswerReview({ question, answer, correct }: QuestionAnswerReviewProps) {
  const data = question.questionData;

  if (question.questionType === "FILL_IN_BLANK") {
    const submitted = answer?.answers?.[0]?.trim();
    const accepted = data.acceptedAnswers ?? [];
    return (
      <div className="grid gap-2 text-sm">
        <div className={cn("rounded-sm border px-3 py-2", correct ? CORRECT_CLASSES : WRONG_CLASSES)}>
          <span className="mr-2 text-[10px] uppercase tracking-[0.1em] opacity-80">Bạn trả lời</span>
          {submitted || <em className="font-normal">Chưa trả lời</em>}
        </div>
        {!correct && accepted.length > 0 && (
          <div className={cn("rounded-sm border px-3 py-2", CORRECT_CLASSES)}>
            <span className="mr-2 text-[10px] uppercase tracking-[0.1em] opacity-80">Đáp án đúng</span>
            {accepted.join(" / ")}
          </div>
        )}
      </div>
    );
  }

  if (question.questionType === "MATCHING") {
    const leftItems = data.leftItems ?? [];
    const rightText = (id?: string) => data.rightItems?.find((item) => item.id === id)?.text;
    return (
      <div className="grid gap-2">
        {leftItems.map((left) => {
          const chosenId = answer?.pairs?.find((pair) => pair.leftId === left.id)?.rightId;
          const correctId = data.correctPairs?.find((pair) => pair.leftId === left.id)?.rightId;
          const known = correctId !== undefined;
          const pairCorrect = known ? chosenId === correctId : correct;
          return (
            <div
              key={left.id}
              className={cn(
                "flex flex-col gap-1 rounded-sm border px-3 py-2 text-sm sm:flex-row sm:items-center sm:gap-3",
                pairCorrect ? CORRECT_CLASSES : WRONG_CLASSES,
              )}
            >
              <span className="flex-1">{left.text}</span>
              <span className="sm:text-right">
                → {rightText(chosenId) ?? <em className="font-normal">Chưa nối</em>}
                {known && !pairCorrect && (
                  <span className="ml-2 font-normal text-[var(--status-success)]">
                    (đúng: {rightText(correctId)})
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  const options = data.options ?? [];
  const correctIds = data.correctOptionIds ?? [];
  const selectedIds = answer?.selectedOptionIds ?? [];
  const hasKey = correctIds.length > 0;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option, index) => {
        const isAnswer = correctIds.includes(option.id);
        const isPicked = selectedIds.includes(option.id);
        // Khong co dap an: van to mau lua chon theo ket qua cham cua BE.
        const isWrongPick = isPicked && (hasKey ? !isAnswer : !correct);
        const showCorrect = isAnswer || (!hasKey && isPicked && correct);
        return (
          <div
            key={option.id}
            className={cn(
              "flex items-center gap-2 rounded-sm border px-3 py-2 text-sm",
              showCorrect ? CORRECT_CLASSES : isWrongPick ? WRONG_CLASSES : NEUTRAL_CLASSES,
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-[11px] font-bold",
                showCorrect
                  ? "bg-[var(--status-success)] text-[var(--text-inverse)]"
                  : isWrongPick
                    ? "bg-[var(--accent-danger)] text-[var(--text-inverse)]"
                    : "bg-[var(--bg-surface)] text-content-muted border border-[var(--border-strong)]",
              )}
            >
              {optionLabel(index)}
            </span>
            <span className="min-w-0">{option.text}</span>
          </div>
        );
      })}
    </div>
  );
}

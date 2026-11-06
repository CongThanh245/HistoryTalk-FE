"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EXAM_QUESTION_COUNT } from "@/services/chat.service";
import { hasPlusAccess } from "@/services/user.service";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils/cn";

/** The backend caps exam sessions of Free customers at this many questions. */
const FREE_EXAM_QUESTIONS = 2;

const COUNTS = Array.from(
  { length: EXAM_QUESTION_COUNT.max - EXAM_QUESTION_COUNT.min + 1 },
  (_, i) => EXAM_QUESTION_COUNT.min + i,
);

/** Picks how many questions the character asks before an exam session starts. */
export function ExamStartDialog({
  open,
  characterName,
  onOpenChange,
  onStart,
}: {
  open: boolean;
  characterName: string;
  onOpenChange: (open: boolean) => void;
  onStart: (questionCount: number) => void;
}) {
  const [count, setCount] = useState<number>(EXAM_QUESTION_COUNT.default);
  const user = useAuthStore((s) => s.user);
  const isFreeCustomer =
    user?.role === "CUSTOMER" && !hasPlusAccess({ tierId: user.tierId ?? null, tierTitle: user.tierTitle ?? null });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 shrink-0" aria-hidden="true" />
            Vấn đáp với {characterName}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-content-text">
            {characterName} sẽ lần lượt hỏi, bạn trả lời từng câu và được chấm ngay. Mỗi câu chỉ trả lời một lần,
            hết câu hỏi sẽ có điểm trên thang 10.
          </DialogDescription>
        </DialogHeader>

        {isFreeCustomer ? (
          <p className="border border-[var(--border-strong)] px-3 py-2 text-sm text-content-text">
            Gói Free được hỏi tối đa {FREE_EXAM_QUESTIONS} câu mỗi buổi vấn đáp. Nâng cấp Plus hoặc Pro để chọn từ{" "}
            {EXAM_QUESTION_COUNT.min} đến {EXAM_QUESTION_COUNT.max} câu.
          </p>
        ) : (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-content-muted">Số câu hỏi</legend>
          <div className="flex flex-wrap gap-1.5">
            {COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={count === n}
                onClick={() => setCount(n)}
                className={cn(
                  "h-9 w-9 rounded-sm border text-sm font-semibold tabular-nums transition-colors",
                  count === n
                    ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                    : "border-[var(--border-strong)] text-content-text hover:border-[var(--text-primary)]",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        )}

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="btn-ink min-h-0 px-4 py-2 text-sm"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={() => {
              onStart(count);
              onOpenChange(false);
            }}
            className="btn-crimson min-h-0 px-4 py-2 text-sm"
          >
            Bắt đầu vấn đáp
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

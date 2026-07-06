"use client";

import { useRouter } from "next/navigation";
import { useQuizSets } from "@/features/quiz/hooks";
import { QuizCard } from "@/components/quiz/quiz-card";

interface ChatQuizSuggestionProps {
  contextId?: string;
}

export function ChatQuizSuggestion({ contextId }: ChatQuizSuggestionProps) {
  const router = useRouter();
  const { data } = useQuizSets(contextId ? { contextId } : undefined);
  const quizzes = (data?.content ?? []).slice(0, 2);

  if (!contextId || quizzes.length === 0) return null;

  return (
    <div
      className="px-3 pt-3 pb-1 border-b"
      style={{ borderColor: "var(--border-default)" }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-widest px-1 mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        Kiểm tra kiến thức
      </p>
      <div className="space-y-2 pb-2">
        {quizzes.map((quiz) => (
          <QuizCard
            key={quiz.quizId}
            quiz={quiz}
            onStart={(quizId) => router.push(`/quiz/${quizId}`)}
            compact
          />
        ))}
      </div>
    </div>
  );
}

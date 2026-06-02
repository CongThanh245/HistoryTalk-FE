"use client";

import { use } from "react";
import { useQuizDetail } from "@/features/quiz/hooks";
import { QuizFlow } from "@/components/quiz/QuizFlow";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  params: Promise<{ quizId: string }>;
}

export default function QuizDetailRoute({ params }: Props) {
  const { quizId } = use(params);
  const router = useRouter();
  const { data: quiz, isLoading } = useQuizDetail(quizId);

  if (isLoading) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: "var(--bg-content)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={28}
            className="animate-spin"
            style={{ color: "var(--accent-gold)" }}
          />
          <p className="text-sm" style={{ color: "var(--content-muted)" }}>
            Đang tải...
          </p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-4"
        style={{ background: "var(--bg-content)" }}
      >
        <p className="text-sm" style={{ color: "var(--content-muted)" }}>
          Không tìm thấy bộ câu hỏi
        </p>
        <button
          onClick={() => router.push("/trac-nghiem")}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: "var(--accent-gold)", color: "white" }}
        >
          Quay lại
        </button>
      </div>
    );
  }

  return <QuizFlow quiz={quiz} />;
}
/*
 * ═══════════════════════════════════════════════════
 * TÍCH HỢP
 * ═══════════════════════════════════════════════════
 *
 * 1. Tạo file: app/(app)/quiz/[quizId]/page.tsx ← file này
 *
 * 2. Trong QuizCard.tsx / QuizPageClient.tsx,
 *    sửa handleStartQuiz:
 *
 *    const handleStartQuiz = (quizId: string) => {
 *      router.push(`/quiz/${quizId}`);
 *    };
 *
 * 3. Thêm getQuestions vào quiz.service.ts:
 *    getQuestions: async (quizId: string): Promise<QuizQuestion[]> => {
 *      // TODO: const res = await axiosClient.get(`/quizzes/${quizId}/questions`);
 *      await new Promise(r => setTimeout(r, 400));
 *      return MOCK_QUESTIONS[quizId] ?? MOCK_QUESTIONS["quiz-001"];
 *    },
 *
 * 4. Thêm query key vào shared/query-key.ts:
 *    quizzes: {
 *      ...existing,
 *      questions: (quizId: string) => ["quizzes", "questions", quizId] as const,
 *    }
 *
 * 5. Khi có API submit thật, trong QuizFlow.tsx
 *    thay comment TODO trong handleSubmit bằng:
 *    await quizService.submitQuiz({ sessionId, answers: [...], durationSeconds })
 * ═══════════════════════════════════════════════════
 */

"use client";

import { use } from "react";
import { useQuizDetail } from "@/features/quiz/hooks";
import { QuizFlow } from "@/components/quiz/QuizFlow";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuizPageClientProps {
  params: Promise<{ quizId: string }>;
}

export default function QuizPageClient({ params }: QuizPageClientProps) {
  const { quizId } = use(params);
  const router = useRouter();
  const { data: quiz, isLoading } = useQuizDetail(quizId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p>Không tìm thấy quiz</p>
        <button onClick={() => router.push("/quiz")}>Quay lại</button>
      </div>
    );
  }

  return <QuizFlow quiz={quiz} />;
}

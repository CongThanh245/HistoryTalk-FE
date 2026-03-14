// app/(app)/trac-nghiem/page.tsx
// Server Component entry point

import { QuizPageClient } from "@/components/quiz/quiz-page";
import { useRouter } from "next/navigation";
import React from "react";

export default function QuizPage() {
  const router = useRouter(); // ← thêm
  const handleStartQuiz = (quizId: string) => {
    router.push(`/trac-nghiem/${quizId}`);
  };
  return <QuizPageClient />;
}

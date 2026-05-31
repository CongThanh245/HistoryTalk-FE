import { QuizPageClient } from "@/components/quiz/quiz-page";

export const metadata = {
  title: "Trắc nghiệm lịch sử",
  description: "Kiểm tra kiến thức lịch sử của bạn với các bộ câu hỏi trắc nghiệm",
};

export default function QuizPage() {
  return (
    <div className="px-3 py-6 md:px-6 md:py-8">
      <QuizPageClient />
    </div>
  );
}

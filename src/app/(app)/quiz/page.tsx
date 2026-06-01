import { QuizPageClient } from "@/components/quiz/quiz-page";

export const metadata = {
  title: "Câu đố lịch sử",
  description: "Kiểm tra kiến thức lịch sử của bạn với các bộ câu hỏi",
};

export default function QuizPage() {
  return (
    <div className="px-3 py-4 md:px-6 md:py-8">
      <QuizPageClient />
    </div>
  );
}

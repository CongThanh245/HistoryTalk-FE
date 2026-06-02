export const runtime = 'edge';

import PageContent from "./page-content";

export default function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  return <PageContent />;
}

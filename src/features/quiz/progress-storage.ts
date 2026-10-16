import type { QuizQuestion } from "@/services/quiz.service";
import type { AnswerData } from "@/features/quiz/question-data";

// v2: cau hoi dung questionType/questionData, cau tra loi dung answerData.
const KEY_PREFIX = "quiz-progress-v2:";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface SavedQuizProgress {
  quizId: string;
  sessionId: string;
  quizTitle: string;
  questions: QuizQuestion[];
  answers: Record<string, AnswerData>;
  limitedTime?: number;
  elapsedSeconds: number;
  flagged: string[];
  practiceMode: boolean;
  savedAt: number;
}

export function saveQuizProgress(progress: SavedQuizProgress): void {
  try {
    localStorage.setItem(KEY_PREFIX + progress.quizId, JSON.stringify(progress));
  } catch {
    // best-effort — khong lam gian doan trai nghiem lam bai neu ghi that bai
  }
}

export function loadQuizProgress(quizId: string): SavedQuizProgress | null {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + quizId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedQuizProgress;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY_PREFIX + quizId);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearQuizProgress(quizId: string): void {
  try {
    localStorage.removeItem(KEY_PREFIX + quizId);
  } catch {
    // ignore
  }
}

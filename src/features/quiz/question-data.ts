/**
 * Kieu du lieu cau hoi / cau tra loi theo contract quiz Sprint 7:
 * moi cau hoi co `questionType` + `questionData`, moi cau tra loi gui `answerData`.
 * Learner nhan questionData da bi luoc dap an (correctOptionIds / acceptedAnswers /
 * correctPairs) khi bat dau lam bai; staff va man chi tiet ket qua nhan ban day du.
 */

export type QuestionType = "MULTIPLE_CHOICE" | "FILL_IN_BLANK" | "MATCHING";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  FILL_IN_BLANK: "Điền vào chỗ trống",
  MATCHING: "Nối cặp",
};

export interface QuizOption {
  id: string;
  text: string;
}

export interface MatchingPair {
  leftId: string;
  rightId: string;
}

/** Hop nhat 3 loai questionData — chi cac field cua loai tuong ung duoc dien. */
export interface QuestionData {
  // MULTIPLE_CHOICE
  options?: QuizOption[];
  correctOptionIds?: string[];
  // FILL_IN_BLANK
  acceptedAnswers?: string[];
  caseSensitive?: boolean;
  trimWhitespace?: boolean;
  // MATCHING
  leftItems?: QuizOption[];
  rightItems?: QuizOption[];
  correctPairs?: MatchingPair[];
}

/** Hop nhat 3 loai answerData. */
export interface AnswerData {
  selectedOptionIds?: string[];
  answers?: string[];
  pairs?: MatchingPair[];
}

export interface TypedQuestion {
  questionType: QuestionType;
  questionData: QuestionData;
}

// ── Parsing ────────────────────────────────────────────────

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  return typeof value === "object" && value !== null ? (value as RawRecord) : {};
}

function asStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
}

function asOptions(value: unknown): QuizOption[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((item, index) => {
    if (typeof item === "string") return { id: String(index), text: item };
    const raw = asRecord(item);
    return {
      id: raw.id != null ? String(raw.id) : String(index),
      text: typeof raw.text === "string" ? raw.text : "",
    };
  });
}

function asPairs(value: unknown): MatchingPair[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((item) => {
    const raw = asRecord(item);
    return { leftId: String(raw.leftId ?? ""), rightId: String(raw.rightId ?? "") };
  });
}

export function parseQuestionType(value: unknown): QuestionType {
  return value === "FILL_IN_BLANK" || value === "MATCHING" ? value : "MULTIPLE_CHOICE";
}

/**
 * Doc questionData tu BE. Neu BE cu van tra `options: string[]` + `correctAnswer`
 * o cap cau hoi (truoc migration V35) thi quy doi sang dang moi.
 */
export function parseQuestionData(rawQuestion: unknown): QuestionData {
  const question = asRecord(rawQuestion);
  const data = asRecord(question.questionData);
  const result: QuestionData = {
    options: asOptions(data.options),
    correctOptionIds: asStringArray(data.correctOptionIds),
    acceptedAnswers: asStringArray(data.acceptedAnswers),
    caseSensitive: typeof data.caseSensitive === "boolean" ? data.caseSensitive : undefined,
    trimWhitespace: typeof data.trimWhitespace === "boolean" ? data.trimWhitespace : undefined,
    leftItems: asOptions(data.leftItems),
    rightItems: asOptions(data.rightItems),
    correctPairs: asPairs(data.correctPairs),
  };

  if (!result.options && Array.isArray(question.options)) {
    result.options = asOptions(question.options);
    if (typeof question.correctAnswer === "number" && question.correctAnswer >= 0) {
      result.correctOptionIds = [String(question.correctAnswer)];
    }
  }
  return result;
}

export function parseAnswerData(value: unknown): AnswerData {
  const raw = asRecord(value);
  return {
    selectedOptionIds: asStringArray(raw.selectedOptionIds),
    answers: asStringArray(raw.answers),
    pairs: asPairs(raw.pairs),
  };
}

// ── Answer helpers ─────────────────────────────────────────

/** Cau da duoc tra loi day du chua (dung de dem tien do & quyet dinh gui len BE). */
export function isAnswerComplete(question: TypedQuestion, answer: AnswerData | undefined): boolean {
  if (!answer) return false;
  switch (question.questionType) {
    case "FILL_IN_BLANK":
      return !!answer.answers?.[0]?.trim();
    case "MATCHING": {
      const leftCount = question.questionData.leftItems?.length ?? 0;
      return leftCount > 0 && (answer.pairs?.length ?? 0) >= leftCount;
    }
    default:
      return (answer.selectedOptionIds?.length ?? 0) > 0;
  }
}

/** Chi giu lai field cua dung loai cau hoi truoc khi gui len BE. */
export function toAnswerPayload(question: TypedQuestion, answer: AnswerData): AnswerData {
  switch (question.questionType) {
    case "FILL_IN_BLANK":
      return { answers: answer.answers ?? [] };
    case "MATCHING":
      return { pairs: answer.pairs ?? [] };
    default:
      return { selectedOptionIds: answer.selectedOptionIds ?? [] };
  }
}

/** Co dap an trong questionData khong (learner chi co sau khi nop bai). */
export function hasAnswerKey(question: TypedQuestion): boolean {
  const data = question.questionData;
  switch (question.questionType) {
    case "FILL_IN_BLANK":
      return (data.acceptedAnswers?.length ?? 0) > 0;
    case "MATCHING":
      return (data.correctPairs?.length ?? 0) > 0;
    default:
      return (data.correctOptionIds?.length ?? 0) > 0;
  }
}

/** Cham diem phia client — chi dung khi questionData co dap an. Khop logic grade cua BE. */
export function gradeAnswer(question: TypedQuestion, answer: AnswerData | undefined): boolean {
  if (!answer) return false;
  const data = question.questionData;
  switch (question.questionType) {
    case "FILL_IN_BLANK": {
      let submitted = answer.answers?.[0];
      if (submitted == null) return false;
      const trim = data.trimWhitespace ?? true;
      if (trim) submitted = submitted.trim();
      return (data.acceptedAnswers ?? []).some((accepted) => {
        const target = trim ? accepted.trim() : accepted;
        return data.caseSensitive
          ? submitted === target
          : submitted!.toLowerCase() === target.toLowerCase();
      });
    }
    case "MATCHING": {
      const correct = data.correctPairs ?? [];
      const pairs = answer.pairs ?? [];
      return (
        correct.length > 0 &&
        pairs.length === correct.length &&
        correct.every((c) => pairs.some((p) => p.leftId === c.leftId && p.rightId === c.rightId))
      );
    }
    default: {
      const correct = data.correctOptionIds ?? [];
      const selected = answer.selectedOptionIds ?? [];
      return (
        correct.length > 0 &&
        selected.length === correct.length &&
        correct.every((id) => selected.includes(id))
      );
    }
  }
}

/** Mo ta ngan dap an dung, vd. de hien "dap an dung la ..." */
export function describeCorrectAnswer(question: TypedQuestion): string {
  const data = question.questionData;
  switch (question.questionType) {
    case "FILL_IN_BLANK":
      return (data.acceptedAnswers ?? []).join(" / ");
    case "MATCHING":
      return (data.correctPairs ?? [])
        .map((pair) => {
          const left = data.leftItems?.find((item) => item.id === pair.leftId)?.text ?? pair.leftId;
          const right = data.rightItems?.find((item) => item.id === pair.rightId)?.text ?? pair.rightId;
          return `${left} → ${right}`;
        })
        .join("; ");
    default: {
      const options = data.options ?? [];
      return (data.correctOptionIds ?? [])
        .map((id) => {
          const index = options.findIndex((option) => option.id === id);
          return index >= 0 ? optionLabel(index) : id;
        })
        .join(", ");
    }
  }
}

export function optionLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

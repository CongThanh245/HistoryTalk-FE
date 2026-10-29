/**
 * Pure utility: parse quiz question imports from JSON, CSV, or plain text.
 * No side-effects — safe for client-side use.
 *
 * CSV accepts the backend's import template (GET /staff/quizzes/import/template, read by column name):
 *   questionType (MULTIPLE_CHOICE | FILL_IN_BLANK | MATCHING), questionContent, option1..option6,
 *   correctAnswer, caseSensitive, trimWhitespace, explanation — title/contextId/level are ignored here
 *   because the questions go into the quiz being edited.
 * and the older 7-column layout: content, A, B, C, D, correctAnswer (0-3), explanation.
 */

export type ImportedQuestionType = "MULTIPLE_CHOICE" | "FILL_IN_BLANK" | "MATCHING";

export interface ImportedQuestion {
  orderIndex: number;
  questionType: ImportedQuestionType;
  content: string;
  explanation?: string;
  /** MULTIPLE_CHOICE: 2–6 options, one or more correct (0-based indices). */
  options?: string[];
  correctAnswers?: number[];
  /** FILL_IN_BLANK */
  acceptedAnswers?: string[];
  caseSensitive?: boolean;
  /** MATCHING */
  matchingPairs?: { left: string; right: string }[];
}

export type ParseResult =
  | { ok: true; questions: ImportedQuestion[] }
  | { ok: false; error: string };

const MAX_OPTIONS = 6;
const LETTERS = "ABCDEF";

// ─── Plain Text Parser ────────────────────────────────────────────────────────
/**
 * Parses a plain-text block containing multiple multiple-choice questions.
 *
 * FORMAT (questions separated by "---" or a blank line):
 * ─────────────────────────────────────────────────────
 * Câu hỏi viết ở đây?
 * A. Đáp án A
 * B. Đáp án B
 * C. Đáp án C
 * D. Đáp án D
 * *B                    ← correct answer: prefix * then A/B/C/D (case-insensitive)
 * // Giải thích ở đây  ← optional: line starting with // or "Giải thích:"
 *
 * ---                   ← separator (or just a blank line)
 * ─────────────────────────────────────────────────────
 */
export function parsePlainTextQuestions(raw: string, startIndex = 1): ParseResult {
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = text
    .split(/\n---+\n|\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (!blocks.length) return { ok: false, error: "Không tìm thấy câu hỏi nào." };

  const questions: ImportedQuestion[] = [];

  for (let bi = 0; bi < blocks.length; bi++) {
    const lines = blocks[bi].split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const contentLines: string[] = [];
    const options: string[] = [];
    let correctLetter = "";
    let explanation = "";

    const OPTION_RE = /^[a-dA-D][.):\s]/;
    const ANSWER_RE = /^\*([a-dA-D])$/i;
    const ANSWER_LABEL_RE = /^(?:đáp án|answer)[:\s]+([a-dA-D])/i;
    const EXPLAIN_RE = /^(?:\/\/|gt:|giải thích:)\s*/i;

    for (const line of lines) {
      if (ANSWER_RE.test(line)) {
        correctLetter = line.replace("*", "").toUpperCase();
      } else if (ANSWER_LABEL_RE.test(line)) {
        correctLetter = (ANSWER_LABEL_RE.exec(line)![1]).toUpperCase();
      } else if (EXPLAIN_RE.test(line)) {
        explanation = line.replace(EXPLAIN_RE, "").trim();
      } else if (OPTION_RE.test(line)) {
        options.push(line.slice(2).trim() || line.slice(1).replace(/^[.):\s]+/, "").trim());
      } else {
        contentLines.push(line);
      }
    }

    const content = contentLines.join(" ").trim();
    if (!content) continue;

    if (options.length !== 4)
      return { ok: false, error: `Câu ${bi + 1}: cần đúng 4 đáp án (A B C D), tìm thấy ${options.length}.` };
    if (!correctLetter)
      return { ok: false, error: `Câu ${bi + 1}: thiếu đáp án đúng — thêm dòng *A / *B / *C / *D.` };
    const caIndex = "ABCD".indexOf(correctLetter);
    if (caIndex < 0)
      return { ok: false, error: `Câu ${bi + 1}: đáp án đúng "${correctLetter}" không hợp lệ.` };

    questions.push({
      orderIndex: startIndex + questions.length,
      questionType: "MULTIPLE_CHOICE",
      content,
      options,
      correctAnswers: [caIndex],
      explanation: explanation || undefined,
    });
  }

  if (!questions.length) return { ok: false, error: "Không tìm thấy câu hỏi hợp lệ nào." };
  return { ok: true, questions };
}

// ─── JSON Parser ──────────────────────────────────────────────────────────────
/** Array of { content, options: string[2..6], correctAnswer: number | number[], explanation? }. */
export function parseJsonQuestions(raw: string, startIndex = 1): ParseResult {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch {
    return { ok: false, error: "File không đúng định dạng JSON." };
  }
  if (!Array.isArray(parsed))
    return { ok: false, error: "JSON phải là một mảng (array) câu hỏi." };

  const questions: ImportedQuestion[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i] as Record<string, unknown>;
    if (typeof item?.content !== "string" || !item.content.trim())
      return { ok: false, error: `Câu ${i + 1}: thiếu trường "content".` };
    const options = item.options;
    if (!Array.isArray(options) || options.length < 2 || options.length > MAX_OPTIONS || options.some((o) => typeof o !== "string" || !o.trim()))
      return { ok: false, error: `Câu ${i + 1}: "options" phải là mảng 2–6 chuỗi không rỗng.` };
    const raw = Array.isArray(item.correctAnswer) ? item.correctAnswer : [item.correctAnswer];
    const correct = raw.map(Number);
    if (!correct.length || correct.some((n) => !Number.isInteger(n) || n < 0 || n >= options.length))
      return { ok: false, error: `Câu ${i + 1}: "correctAnswer" phải là số thứ tự đáp án từ 0 đến ${options.length - 1}.` };
    questions.push({
      orderIndex: typeof item.orderIndex === "number" ? item.orderIndex : startIndex + i,
      questionType: "MULTIPLE_CHOICE",
      content: (item.content as string).trim(),
      options: (options as string[]).map((o) => o.trim()),
      correctAnswers: [...new Set(correct)],
      explanation: typeof item.explanation === "string" ? item.explanation.trim() || undefined : undefined,
    });
  }
  if (!questions.length) return { ok: false, error: "File JSON không chứa câu hỏi nào." };
  return { ok: true, questions };
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
export function parseCsvQuestions(raw: string, startIndex = 1): ParseResult {
  const rows = parseCsvRows(raw.replace(/^﻿/, "")).filter((r) => r.some((c) => c.trim()));
  if (!rows.length) return { ok: false, error: "File CSV trống." };

  const header = rows[0].map((h) => h.trim().toLowerCase());
  // The backend template is read by column name; anything else falls back to the old fixed layout.
  if (header.includes("questioncontent") || header.includes("questiontype")) {
    return parseTemplateRows(header, rows.slice(1), startIndex);
  }
  const hasHeader = header[0] === "content" || header[0] === "câu hỏi";
  return parseLegacyRows(hasHeader ? rows.slice(1) : rows, hasHeader ? 2 : 1, startIndex);
}

/** Backend import template: one question per row, any column order. */
function parseTemplateRows(header: string[], rows: string[][], startIndex: number): ParseResult {
  const col = (row: string[], name: string) => {
    const i = header.indexOf(name.toLowerCase());
    return i === -1 ? "" : (row[i] ?? "").trim();
  };
  const splitMulti = (v: string) => v.split("|").map((s) => s.trim()).filter(Boolean);
  if (!rows.length) return { ok: false, error: "File CSV không có dữ liệu." };

  const questions: ImportedQuestion[] = [];
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const line = r + 2; // header is line 1
    const content = col(row, "questionContent");
    if (!content) return { ok: false, error: `Dòng ${line}: thiếu questionContent.` };
    const type = (col(row, "questionType") || "MULTIPLE_CHOICE").toUpperCase();
    const explanation = col(row, "explanation") || undefined;
    const optionCells = Array.from({ length: MAX_OPTIONS }, (_, k) => col(row, `option${k + 1}`));
    const lastFilled = optionCells.map((o) => !!o).lastIndexOf(true);
    const options = optionCells.slice(0, lastFilled + 1);
    const base = { orderIndex: startIndex + questions.length, content, explanation };

    if (type === "MULTIPLE_CHOICE") {
      if (options.some((o) => !o)) return { ok: false, error: `Dòng ${line}: điền lựa chọn liên tục từ option1, không bỏ trống xen giữa.` };
      if (options.length < 2) return { ok: false, error: `Dòng ${line}: câu trắc nghiệm cần ít nhất 2 lựa chọn (option1, option2).` };
      const rawCorrect = splitMulti(col(row, "correctAnswer"));
      if (!rawCorrect.length) return { ok: false, error: `Dòng ${line}: thiếu correctAnswer.` };
      const correct: number[] = [];
      for (const v of rawCorrect) {
        const n = /^\d+$/.test(v) ? Number(v) : NaN;
        if (!Number.isInteger(n) || n >= options.length)
          return { ok: false, error: `Dòng ${line}: correctAnswer phải là số thứ tự lựa chọn từ 0 đến ${options.length - 1} (option1 = 0), nhiều đáp án cách nhau bởi «|» — nhận «${v}».` };
        if (!correct.includes(n)) correct.push(n);
      }
      questions.push({ ...base, questionType: "MULTIPLE_CHOICE", options, correctAnswers: correct });
    } else if (type === "FILL_IN_BLANK") {
      const accepted = splitMulti(col(row, "correctAnswer"));
      if (!accepted.length) return { ok: false, error: `Dòng ${line}: câu điền chỗ trống cần ít nhất 1 đáp án trong correctAnswer (nhiều đáp án cách nhau bởi «|»).` };
      questions.push({ ...base, questionType: "FILL_IN_BLANK", acceptedAnswers: accepted, caseSensitive: col(row, "caseSensitive").toLowerCase() === "true" });
    } else if (type === "MATCHING") {
      if (options.some((o) => !o)) return { ok: false, error: `Dòng ${line}: điền các cặp nối liên tục từ option1, không bỏ trống xen giữa.` };
      const pairs: { left: string; right: string }[] = [];
      for (const cell of options) {
        const [left, right, extra] = cell.split("=>").map((s) => s.trim());
        if (!left || !right || extra !== undefined)
          return { ok: false, error: `Dòng ${line}: mỗi ô của câu nối phải có dạng «Vế trái => Vế phải», nhận «${cell}».` };
        pairs.push({ left, right });
      }
      if (pairs.length < 2) return { ok: false, error: `Dòng ${line}: câu nối cần ít nhất 2 cặp.` };
      questions.push({ ...base, questionType: "MATCHING", matchingPairs: pairs });
    } else {
      return { ok: false, error: `Dòng ${line}: questionType «${type}» không hợp lệ (MULTIPLE_CHOICE, FILL_IN_BLANK hoặc MATCHING).` };
    }
  }
  return { ok: true, questions };
}

/** Older layout: content, A, B, C, D, correctAnswer (0-3 or A-D), explanation. */
function parseLegacyRows(rows: string[][], firstLine: number, startIndex: number): ParseResult {
  if (!rows.length) return { ok: false, error: "File CSV không có dữ liệu." };
  const questions: ImportedQuestion[] = [];
  for (let i = 0; i < rows.length; i++) {
    const line = firstLine + i;
    const [content, a, b, c, d, caRaw, explanation] = rows[i].map((v) => (v ?? "").trim());
    if (!content) return { ok: false, error: `Dòng ${line}: thiếu nội dung.` };
    if (!a || !b || !c || !d) return { ok: false, error: `Dòng ${line}: thiếu đáp án.` };
    const letter = LETTERS.slice(0, 4).indexOf((caRaw ?? "").toUpperCase());
    const ca = /^\d$/.test(caRaw ?? "") ? Number(caRaw) : letter;
    if (ca < 0 || ca > 3) return { ok: false, error: `Dòng ${line}: correctAnswer phải là 0-3 (hoặc A-D).` };
    questions.push({
      orderIndex: startIndex + i,
      questionType: "MULTIPLE_CHOICE",
      content,
      options: [a, b, c, d],
      correctAnswers: [ca],
      explanation: explanation || undefined,
    });
  }
  return { ok: true, questions };
}

/** RFC 4180 CSV: quoted fields may hold commas, line breaks and doubled quotes (""). */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

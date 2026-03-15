/**
 * Pure utility: parse quiz question imports from JSON, CSV, or plain text.
 * No side-effects — safe for client-side use.
 */

export interface ImportedQuestion {
  orderIndex: number;
  content: string;
  options: [string, string, string, string];
  correctAnswer: 0 | 1 | 2 | 3;
  explanation?: string;
}

export type ParseResult =
  | { ok: true; questions: ImportedQuestion[] }
  | { ok: false; error: string };

// ─── Plain Text Parser ────────────────────────────────────────────────────────
/**
 * Parses a plain-text block containing multiple questions.
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
 *
 * Câu hỏi tiếp theo?
 * A. ...
 * ─────────────────────────────────────────────────────
 *
 * Rules:
 * - Options may use "A." "A)" "A:" "a." etc.
 * - Correct answer line: *A *B *C *D  (or "Đáp án: B")
 * - Explanation: line starting with "//" or "gt:" or "giải thích:"
 * - Separator: "---" alone on a line, OR two or more consecutive blank lines
 */
export function parsePlainTextQuestions(raw: string, startIndex = 1): ParseResult {
  // Normalise line endings
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split into blocks by "---" separator or 2+ blank lines
  const blocks = text
    .split(/\n---+\n|\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (!blocks.length) return { ok: false, error: "Không tìm thấy câu hỏi nào." };

  const questions: ImportedQuestion[] = [];

  for (let bi = 0; bi < blocks.length; bi++) {
    const lines = blocks[bi].split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    // ── Collect content, options, answer, explanation ────────────────────────
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
        // Strip leading letter + separator, keep the rest
        options.push(line.slice(2).trim() || line.slice(1).replace(/^[.):\s]+/, "").trim());
      } else {
        contentLines.push(line);
      }
    }

    const content = contentLines.join(" ").trim();
    if (!content) continue; // skip blank blocks

    if (options.length !== 4)
      return { ok: false, error: `Câu ${bi + 1}: cần đúng 4 đáp án (A B C D), tìm thấy ${options.length}.` };

    if (!correctLetter)
      return { ok: false, error: `Câu ${bi + 1}: thiếu đáp án đúng — thêm dòng *A / *B / *C / *D.` };

    const caIndex = "ABCD".indexOf(correctLetter);
    if (caIndex < 0)
      return { ok: false, error: `Câu ${bi + 1}: đáp án đúng "${correctLetter}" không hợp lệ.` };

    questions.push({
      orderIndex: startIndex + questions.length,
      content,
      options: options as [string, string, string, string],
      correctAnswer: caIndex as 0 | 1 | 2 | 3,
      explanation: explanation || undefined,
    });
  }

  if (!questions.length) return { ok: false, error: "Không tìm thấy câu hỏi hợp lệ nào." };
  return { ok: true, questions };
}

// ─── JSON Parser ──────────────────────────────────────────────────────────────
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
    if (!Array.isArray(item.options) || item.options.length !== 4 || item.options.some((o) => typeof o !== "string"))
      return { ok: false, error: `Câu ${i + 1}: "options" phải là mảng 4 chuỗi.` };
    const ca = Number(item.correctAnswer);
    if (![0, 1, 2, 3].includes(ca))
      return { ok: false, error: `Câu ${i + 1}: "correctAnswer" phải là 0-3.` };
    questions.push({
      orderIndex: typeof item.orderIndex === "number" ? item.orderIndex : startIndex + i,
      content: (item.content as string).trim(),
      options: item.options as [string, string, string, string],
      correctAnswer: ca as 0 | 1 | 2 | 3,
      explanation: typeof item.explanation === "string" ? item.explanation.trim() || undefined : undefined,
    });
  }
  if (!questions.length) return { ok: false, error: "File JSON không chứa câu hỏi nào." };
  return { ok: true, questions };
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
export function parseCsvQuestions(raw: string, startIndex = 1): ParseResult {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { ok: false, error: "File CSV trống." };
  const firstCell = splitCsvLine(lines[0])[0]?.toLowerCase() ?? "";
  const dataLines = firstCell === "content" || firstCell === "câu hỏi" ? lines.slice(1) : lines;
  if (!dataLines.length) return { ok: false, error: "File CSV không có dữ liệu." };
  const questions: ImportedQuestion[] = [];
  for (let i = 0; i < dataLines.length; i++) {
    const [content, optA, optB, optC, optD, caRaw, explanation] = splitCsvLine(dataLines[i]);
    if (!content?.trim()) return { ok: false, error: `Dòng ${i + 2}: thiếu nội dung.` };
    if (!optA || !optB || !optC || !optD) return { ok: false, error: `Dòng ${i + 2}: thiếu đáp án.` };
    const ca = Number(caRaw);
    if (![0, 1, 2, 3].includes(ca)) return { ok: false, error: `Dòng ${i + 2}: correctAnswer phải là 0-3.` };
    questions.push({
      orderIndex: startIndex + i,
      content: content.trim(),
      options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
      correctAnswer: ca as 0 | 1 | 2 | 3,
      explanation: explanation?.trim() || undefined,
    });
  }
  return { ok: true, questions };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []; let cur = "", inQ = false;
  for (const c of line) {
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { result.push(cur); cur = ""; }
    else { cur += c; }
  }
  result.push(cur); return result;
}

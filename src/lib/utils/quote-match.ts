// Đối chiếu một đoạn trích (quote_used) do AI trả về với nội dung tài liệu gốc.
// Do backend chỉ trả text thô (không kèm docId/offset), việc match ở đây là "best effort":
// coi khoảng trắng liền nhau là tương đương để chịu được khác biệt xuống dòng/format,
// không phân biệt hoa/thường. Không đảm bảo khớp nếu AI diễn giải lại câu chữ.

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Trả về RegExp (không có flag "g") để test một đoạn quote có nằm trong text hay không. */
export function buildQuoteMatcher(quote: string): RegExp | null {
  const trimmed = quote.trim();
  if (!trimmed) return null;

  const pattern = trimmed
    .split(/\s+/)
    .map(escapeRegExp)
    .join("\\s+");

  try {
    return new RegExp(pattern, "i");
  } catch {
    return null;
  }
}

/** Tìm tài liệu đầu tiên trong danh sách có nội dung chứa đoạn quote. */
export function findDocumentForQuote<T extends { content: string }>(
  quote: string,
  documents: T[],
): T | null {
  const matcher = buildQuoteMatcher(quote);
  if (!matcher) return null;
  return documents.find((doc) => matcher.test(doc.content)) ?? null;
}

export interface QuoteTextPart {
  text: string;
  matched: boolean;
}

/**
 * Cắt `content` thành các đoạn, đánh dấu đoạn nào trùng với `quote` để hiển thị highlight.
 * Trả về nguyên `content` (không highlight) nếu không tìm thấy hoặc không có quote.
 */
export function splitContentByQuote(content: string, quote?: string): QuoteTextPart[] {
  const matcher = quote ? buildQuoteMatcher(quote) : null;
  if (!matcher) return [{ text: content, matched: false }];

  const globalMatcher = new RegExp(`(${matcher.source})`, "gi");
  const rawParts = content.split(globalMatcher);
  if (rawParts.length === 1) return [{ text: content, matched: false }];

  return rawParts
    .map((part, idx) => ({ text: part, matched: idx % 2 === 1 }))
    .filter((part) => part.text.length > 0);
}

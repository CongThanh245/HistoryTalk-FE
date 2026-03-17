import { useMemo } from "react";
import React from "react";
import { KEYWORD_MAP, ALL_TERMS, type KeywordData } from "@/data/keywords";
import { HistoricalKeywordSpan } from "@/components/chat/HistoricalKeywordSpan";

/**
 * Quét văn bản, tìm từ khóa lịch sử và trả về mảng React nodes
 * với HistoricalKeywordSpan thay thế các đoạn khớp.
 *
 * Dùng useMemo để tránh chạy lại khi re-render không liên quan.
 */
export function useKeywordHighlight(
  text: string,
  onSelect: (kw: KeywordData) => void,
): React.ReactNode[] {
  return useMemo(() => {
    if (!text || ALL_TERMS.length === 0) return [text];

    // Build regex một lần từ ALL_TERMS (đã sorted dài trước)
    const escaped = ALL_TERMS.map((t) =>
      t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    const pattern = new RegExp(`(${escaped.join("|")})`, "gi");

    const parts = text.split(pattern);

    return parts.map((part, idx) => {
      if (!part) return null;
      const kwData = KEYWORD_MAP.get(part.toLowerCase());
      if (kwData) {
        return React.createElement(HistoricalKeywordSpan, {
          key: idx,
          keyword: kwData,
          displayText: part,
          onSelect,
        });
      }
      return part;
    });
  }, [text, onSelect]);
}

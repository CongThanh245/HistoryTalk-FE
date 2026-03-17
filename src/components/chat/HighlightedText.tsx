"use client";

import { useCallback } from "react";
import { useKeywordHighlight } from "@/features/chat/useKeywordHighlight";
import type { KeywordData } from "@/data/keywords";

interface Props {
  text: string;
  onKeywordSelect: (kw: KeywordData) => void;
}

export function HighlightedText({ text, onKeywordSelect }: Props) {
  // useCallback để tránh invalidate useMemo bên trong hook
  const stableSelect = useCallback(onKeywordSelect, [onKeywordSelect]);
  const nodes = useKeywordHighlight(text, stableSelect);
  return <>{nodes}</>;
}

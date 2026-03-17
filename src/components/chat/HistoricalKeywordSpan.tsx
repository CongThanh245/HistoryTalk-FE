"use client";

import type { KeywordData } from "@/data/keywords";

interface Props {
  keyword: KeywordData;
  displayText: string;
  onSelect: (kw: KeywordData) => void;
}

const TYPE_COLOR: Record<string, string> = {
  person: "rgba(201, 162, 77, 0.85)",
  location: "rgba(100, 200, 180, 0.85)",
  event: "rgba(220, 120, 80, 0.85)",
};

export function HistoricalKeywordSpan({ keyword, displayText, onSelect }: Props) {
  const underlineColor = TYPE_COLOR[keyword.type] ?? TYPE_COLOR.event;

  return (
    <span
      onClick={() => onSelect(keyword)}
      title={keyword.shortDesc}
      style={{
        borderBottom: `1.5px dashed ${underlineColor}`,
        color: "inherit",
        cursor: "pointer",
        paddingBottom: "1px",
        transition: "background 150ms ease, color 150ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = `${underlineColor.replace("0.85)", "0.15)")}`;
        (e.currentTarget as HTMLElement).style.borderRadius = "3px";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {displayText}
    </span>
  );
}

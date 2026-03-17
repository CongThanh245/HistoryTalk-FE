import rawKeywords from "./keywords.json";

export type KeywordType = "person" | "location" | "event";

export interface KeywordData {
  id: string;
  keyword: string;
  aliases: string[];
  type: KeywordType;
  shortDesc: string;
  description: string;
  imageUrl: string | null;
}

export const KEYWORDS: KeywordData[] = rawKeywords as KeywordData[];

/** Map để lookup nhanh keyword/alias → KeywordData */
export const KEYWORD_MAP: Map<string, KeywordData> = new Map();

for (const kw of KEYWORDS) {
  KEYWORD_MAP.set(kw.keyword.toLowerCase(), kw);
  for (const alias of kw.aliases) {
    KEYWORD_MAP.set(alias.toLowerCase(), kw);
  }
}

/** Tất cả các chuỗi cần match (keyword + aliases), sorted dài trước để tránh partial match */
export const ALL_TERMS: string[] = [
  ...KEYWORDS.flatMap((kw) => [kw.keyword, ...kw.aliases]),
].sort((a, b) => b.length - a.length);

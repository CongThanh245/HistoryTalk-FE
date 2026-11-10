import type { BattleMapScore } from "./battle-map-scoring";
import { SYMBOL_LABELS, type BattleMap } from "./battle-map.types";

/** Results of "Tự vẽ lược đồ" kept in this browser only, per user and battle. */
export interface PracticeRecord {
  /** Best percent so far. */
  best: number;
  /** Percent of the latest comparison. */
  last: number;
  attempts: number;
}

export const practiceRecordKey = (uid: string | undefined, eventId: string) =>
  `historytalk:battle-practice:v1:${uid ?? "anonymous"}:${eventId}`;

const isRecord = (value: unknown): value is PracticeRecord => {
  const r = value as PracticeRecord | null;
  return !!r && typeof r.best === "number" && typeof r.last === "number" && typeof r.attempts === "number";
};

export function readPracticeRecord(uid: string | undefined, eventId: string): PracticeRecord | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(practiceRecordKey(uid, eventId)) ?? "null");
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

/** Adds one comparison to the record. Returns the record before and after, so the result screen can show progress. */
export function savePracticeScore(uid: string | undefined, eventId: string, percent: number) {
  const previous = readPracticeRecord(uid, eventId);
  const record: PracticeRecord = {
    best: Math.max(previous?.best ?? 0, percent),
    last: percent,
    attempts: (previous?.attempts ?? 0) + 1,
  };
  try {
    localStorage.setItem(practiceRecordKey(uid, eventId), JSON.stringify(record));
  } catch {
    // Storage unavailable: the result still shows, it just is not remembered.
  }
  return { previous, record };
}

export interface PracticeRank {
  /** 0 to 3. */
  stars: number;
  title: string;
  message: string;
}

/** Military rank for a percent, as a light reward. */
export function practiceRank(percent: number): PracticeRank {
  if (percent >= 90) return { stars: 3, title: "Nguyên soái", message: "Lược đồ của bạn gần như trùng khớp với bản gốc." };
  if (percent >= 70) return { stars: 2, title: "Tướng quân", message: "Bạn nắm chắc diễn biến, chỉ còn lệch vài chỗ." };
  if (percent >= 40) return { stars: 1, title: "Hiệu úy", message: "Đã có khung trận đánh. Bổ sung các ký hiệu còn thiếu để lên hạng." };
  return { stars: 0, title: "Tân binh", message: "Xem các ký hiệu màu đỏ trên lược đồ rồi vẽ tiếp nhé." };
}

/** Next rank's threshold, or null at the top. */
export function nextRankAt(percent: number): number | null {
  return [40, 70, 90].find(t => percent < t) ?? null;
}

export interface MissingHint {
  key: string;
  label: string;
  faction: string | null;
  color: string | null;
  count: number;
}

/** Missed answer symbols grouped by type and side, most frequent first: "2 × Tiến công (quân Đại Việt)". */
export function missingHints(answer: BattleMap, score: BattleMapScore): MissingHint[] {
  const missed = new Set(score.missedIds);
  const groups = new Map<string, MissingHint>();
  for (const s of answer.symbols) {
    if (!missed.has(s.id)) continue;
    const faction = answer.factions.find(f => f.id === s.factionId) ?? null;
    const key = `${s.type}:${s.factionId}`;
    const group = groups.get(key);
    if (group) group.count += 1;
    else groups.set(key, { key, label: SYMBOL_LABELS[s.type], faction: faction?.name ?? null, color: faction?.color ?? null, count: 1 });
  }
  return [...groups.values()].sort((a, b) => b.count - a.count);
}

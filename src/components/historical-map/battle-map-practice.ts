import { CORRECT_SCORE, isScoredSymbol, type BattleMapScore } from "./battle-map-scoring";
import { isLineSymbol, isNoteSymbol, type BattleFaction, type BattleMap, type BattleSymbol } from "./battle-map.types";

/** The result map draws each match status as its own "side", so the canvas colours it. */
export const COMPARE_FACTIONS: BattleFaction[] = [
  { id: "cmp-correct", name: "Đúng", color: "#2E7D32" },
  { id: "cmp-partial", name: "Gần đúng", color: "#C98A00" },
  { id: "cmp-missed", name: "Thiếu", color: "#B8321F" },
  { id: "cmp-extra", name: "Thừa / sai", color: "#6B7280" },
  { id: "cmp-answer", name: "Đáp án", color: "#9CA3AF" },
];

export const ANSWER_PREFIX = "ans:";
export const ATTEMPT_PREFIX = "you:";

/** Blank sheet for the learner: the admin's background and sides, no symbols and no phases. */
export function toPracticeMap(answer: BattleMap): BattleMap {
  return {
    version: 1,
    mode: "custom",
    imageUrl: answer.imageUrl,
    imageSource: answer.imageSource,
    factions: answer.factions,
    symbols: [],
  };
}

/** A few graded symbols for the intro animation, routes first and about half units when the map has both. */
export function pickPreviewSymbols(map: BattleMap, limit = 6): BattleSymbol[] {
  const scored = map.symbols.filter(isScoredSymbol);
  const allLines = scored.filter(s => isLineSymbol(s.type));
  const allUnits = scored.filter(s => !isLineSymbol(s.type));
  const lines = allLines.slice(0, limit - Math.min(allUnits.length, Math.floor(limit / 2)));
  return [...lines, ...allUnits.slice(0, limit - lines.length)];
}

/**
 * One map showing the result: the learner's symbols coloured by status (correct, partial, extra), the answer
 * symbols they missed in red, and the rest of the answer (matched symbols, text, steps) faded as context.
 * The learner's own text and step numbers are not graded, so they are left out. Legend notes are cleared, so
 * the legend reads "type (status)" instead of repeating the admin's notes.
 */
export function buildCompareMap(answer: BattleMap, attempt: BattleMap, score: BattleMapScore): BattleMap {
  const matchOf = new Map(score.matches.map(m => [m.attemptId, m]));
  const missed = new Set(score.missedIds);
  const withoutNote = (s: BattleSymbol) => (isNoteSymbol(s.type) ? { ...s, label: "" } : s);
  return {
    version: 1,
    mode: "custom",
    imageUrl: answer.imageUrl,
    imageSource: answer.imageSource,
    factions: COMPARE_FACTIONS,
    symbols: [
      ...answer.symbols.map(s => ({
        ...withoutNote(s),
        id: ANSWER_PREFIX + s.id,
        factionId: missed.has(s.id) ? "cmp-missed" : "cmp-answer",
        phaseId: undefined,
      })),
      ...attempt.symbols.filter(isScoredSymbol).map(s => {
        const match = matchOf.get(s.id);
        return {
          ...withoutNote(s),
          id: ATTEMPT_PREFIX + s.id,
          factionId: !match ? "cmp-extra" : match.score >= CORRECT_SCORE ? "cmp-correct" : "cmp-partial",
          phaseId: undefined,
        };
      }),
    ],
  };
}

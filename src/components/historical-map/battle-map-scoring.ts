import { controlPoints } from "./battle-path";
import { isLineSymbol, SYMBOL_GROUPS, type BattleMap, type BattleSymbol, type BattleSymbolType, type MapPoint } from "./battle-map.types";

/**
 * Scores a learner's redrawing of a battle map against the admin's map, both on the same background image.
 * Symbols are paired by kind and side, scored on position (point symbols) or route (line symbols), and the
 * total is an F1-style percentage, so missing symbols and extra ones both lower it.
 */

/** Distance, in % of the image width, at which a symbol stops counting as placed right. */
export const SCORE_TOLERANCE = 8;
/** Points a route is resampled to before two routes are compared point by point. */
export const RESAMPLE_POINTS = 20;
/** A pair at or above this score counts as "Đúng"; below it as "Gần đúng". */
export const CORRECT_SCORE = 0.8;

export interface SymbolMatch { answerId: string; attemptId: string; score: number }

export interface BattleMapScore {
  /** 0–100, one decimal. */
  percent: number;
  /** Sorted by answer order. */
  matches: SymbolMatch[];
  /** Scored answer symbols left unmatched, in answer order. */
  missedIds: string[];
  /** Scored attempt symbols left unmatched, in attempt order. */
  extraIds: string[];
  /** Scored symbols only. */
  answerCount: number;
  attemptCount: number;
}

/** Text ("label") and step numbers are context, not something to redraw. */
export const isScoredSymbol = (s: BattleSymbol) => s.type !== "label" && s.type !== "step";

/** A drawn map on an image with at least one symbol to redraw. */
export function isGradableMap(map: BattleMap | null | undefined): map is BattleMap {
  return !!map && map.mode === "custom" && !!map.imageUrl?.trim() && map.symbols.some(isScoredSymbol);
}

const distance = (a: MapPoint, b: MapPoint) => Math.hypot(a.x - b.x, a.y - b.y);

/** `n` points evenly spaced along the path by arc length, first and last kept, order kept. */
export function resamplePath(points: MapPoint[], n: number): MapPoint[] {
  const total = points.reduce((sum, p, i) => (i ? sum + distance(points[i - 1], p) : 0), 0);
  if (points.length < 2 || total === 0) return Array.from({ length: n }, () => ({ ...points[0] }));
  const out: MapPoint[] = [];
  let segment = 1;
  let before = 0; // length of the path up to points[segment - 1]
  for (let i = 0; i < n; i++) {
    const at = (total * i) / (n - 1);
    while (segment < points.length - 1 && before + distance(points[segment - 1], points[segment]) < at) {
      before += distance(points[segment - 1], points[segment]);
      segment++;
    }
    const a = points[segment - 1], b = points[segment];
    const length = distance(a, b);
    const t = length === 0 ? 0 : Math.min(1, Math.max(0, (at - before) / length));
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

const GROUP_OF = new Map<BattleSymbolType, number>(SYMBOL_GROUPS.flatMap((g, i) => g.types.map(t => [t, i] as const)));
/** Lines with no arrowhead read the same both ways. */
const UNDIRECTED: readonly BattleSymbolType[] = ["defenseLine", "stakes"];

/** Both lines or both points, and the same type or the same symbol group. */
function comparable(a: BattleSymbol, b: BattleSymbol) {
  if (isLineSymbol(a.type) !== isLineSymbol(b.type)) return false;
  return a.type === b.type || GROUP_OF.get(a.type) === GROUP_OF.get(b.type);
}

/** Geometry closeness, 0–1, in units of % image width. */
function geometry(answer: BattleSymbol, attempt: BattleSymbol, aspect: number) {
  if (!isLineSymbol(answer.type)) {
    const d = distance({ x: answer.x, y: answer.y / aspect }, { x: attempt.x, y: attempt.y / aspect });
    return Math.max(0, 1 - d / SCORE_TOLERANCE);
  }
  const route = (s: BattleSymbol) =>
    resamplePath(controlPoints(s, aspect).map(p => ({ x: p.x, y: p.y / aspect })), RESAMPLE_POINTS);
  const a = route(answer), b = route(attempt);
  const meanGap = (other: MapPoint[]) => other.reduce((sum, p, i) => sum + distance(a[i], p), 0) / other.length;
  const gap = UNDIRECTED.includes(answer.type) ? Math.min(meanGap(b), meanGap([...b].reverse())) : meanGap(b);
  return Math.max(0, 1 - gap / SCORE_TOLERANCE);
}

/** Throws when `answer` is not gradable (see isGradableMap). `aspect` is the image width / height. */
export function scoreBattleMap(answer: BattleMap, attempt: BattleMap, aspect = 1): BattleMapScore {
  if (!isGradableMap(answer)) throw new Error("Lược đồ này chưa chấm được");
  const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const answers = answer.symbols.filter(isScoredSymbol);
  const attempts = attempt.symbols.filter(isScoredSymbol);

  const candidates: { ai: number; ui: number; score: number }[] = [];
  answers.forEach((a, ai) => attempts.forEach((u, ui) => {
    if (!comparable(a, u)) return;
    const geom = geometry(a, u, ratio);
    if (geom <= 0) return;
    const score = geom * (a.type === u.type ? 1 : 0.5) * (a.factionId === u.factionId ? 1 : 0.5);
    candidates.push({ ai, ui, score });
  }));
  // Greedy: best pairs first; ties fall back to answer then attempt order so the result is stable.
  candidates.sort((x, y) => y.score - x.score || x.ai - y.ai || x.ui - y.ui);

  const usedAnswer = new Set<number>(), usedAttempt = new Set<number>();
  const pairs: { ai: number; ui: number; score: number }[] = [];
  for (const c of candidates) {
    if (usedAnswer.has(c.ai) || usedAttempt.has(c.ui)) continue;
    usedAnswer.add(c.ai);
    usedAttempt.add(c.ui);
    pairs.push(c);
  }
  pairs.sort((x, y) => x.ai - y.ai);

  const total = answers.length + attempts.length;
  const sum = pairs.reduce((s, p) => s + p.score, 0);
  return {
    percent: total ? Math.round((1000 * 2 * sum) / total) / 10 : 0,
    matches: pairs.map(p => ({ answerId: answers[p.ai].id, attemptId: attempts[p.ui].id, score: p.score })),
    missedIds: answers.filter((_, i) => !usedAnswer.has(i)).map(s => s.id),
    extraIds: attempts.filter((_, i) => !usedAttempt.has(i)).map(s => s.id),
    answerCount: answers.length,
    attemptCount: attempts.length,
  };
}

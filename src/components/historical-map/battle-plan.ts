// components/historical-map/battle-plan.ts
// Turns an AI battle plan (sides, landmarks, phases, symbols placed "at" or "from/to" landmarks) into map symbols,
// once the author has put each landmark on the image. The AI never gives coordinates: everything is placed here.

import {
  clampPercent, defaultSymbolSize, isLineSymbol, withPoints, SYMBOL_LABELS,
  type BattleFaction, type BattleMap, type BattlePhase, type BattleSymbol, type BattleSymbolType, type MapPoint,
} from "./battle-map.types";

export interface PlanFaction { id: string; name: string; side: "ally" | "enemy" | "neutral" }
export interface PlanAnchor { id: string; name: string; hint: string; kind: "point" | "area" }
export interface PlanSymbol {
  type: string;
  faction: string;
  at?: string | null;
  from?: string | null;
  to?: string | null;
  via?: string | null;
  label?: string | null;
}
export interface PlanPhase {
  title: string;
  narration: string;
  sources: string[];
  camera: "auto" | "full";
  symbols: PlanSymbol[];
}
export interface BattlePlan {
  factions: PlanFaction[];
  anchors: PlanAnchor[];
  phases: PlanPhase[];
  warnings: string[];
}

/** Landmark id → its place on the image, in %. */
export type AnchorPositions = Record<string, MapPoint>;

const MOVEMENT = new Set(["arrow", "flank", "march", "retreat"]);
const SIDE_COLORS: Record<PlanFaction["side"], string[]> = {
  ally: ["#b91c1c", "#c2410c", "#a16207"],
  enemy: ["#1d4ed8", "#4338ca", "#0f766e"],
  neutral: ["#4b5563", "#6b21a8"],
};
/** Half-length of the short line drawn across a landmark for defence lines and stakes. */
const CROSS_LINE_HALF = 7;
/** Distance between symbols sharing a landmark, so they do not cover each other. */
const SPREAD = 5;

const round = (v: number) => Math.round(v * 10) / 10;
const clampPoint = (p: MapPoint): MapPoint => ({ x: round(clampPercent(p.x)), y: round(clampPercent(p.y)) });

/** Sides of the plan matched to the map's sides by id or name; new ones get a colour from their side. */
function mergeFactions(plan: BattlePlan, current: BattleFaction[]) {
  const factions = [...current];
  const idOf: Record<string, string> = {};
  const used = new Set(current.map(f => f.color.toLowerCase()));
  for (const f of plan.factions) {
    const match = current.find(c => c.id === f.id) ?? current.find(c => c.name.trim().toLowerCase() === f.name.trim().toLowerCase());
    if (match) { idOf[f.id] = match.id; continue; }
    const color = SIDE_COLORS[f.side].find(c => !used.has(c)) ?? SIDE_COLORS[f.side][0];
    used.add(color);
    const id = crypto.randomUUID();
    factions.push({ id, name: f.name.slice(0, 80), color });
    idOf[f.id] = id;
  }
  return { factions, idOf };
}

/**
 * A slight curve from start to end, bent to one side; several routes between the same landmarks bend apart.
 * The bend is measured along `axis` (the same for both directions), so a retreat back along an attack's route
 * does not land on top of it.
 */
function route(start: MapPoint, end: MapPoint, via: MapPoint | undefined, lane: number, axis: [MapPoint, MapPoint]): MapPoint[] {
  if (via) return [start, via, end].map(clampPoint);
  const dx = axis[1].x - axis[0].x, dy = axis[1].y - axis[0].y;
  const length = Math.hypot(dx, dy) || 1;
  // Lanes 0, 1, 2, 3… bend +1, -1, +2, -2… times the base offset.
  const side = lane % 2 === 0 ? 1 : -1;
  const offset = length * .12 * (1 + Math.floor(lane / 2)) * side;
  const mid = { x: (start.x + end.x) / 2 - (dy / length) * offset, y: (start.y + end.y) / 2 + (dx / length) * offset };
  return [start, mid, end].map(clampPoint);
}

/** Around a landmark: the first symbol on it, the next ones on a ring. */
function spread(center: MapPoint, index: number): MapPoint {
  if (index === 0) return center;
  const angle = (index - 1) * (Math.PI / 3);
  return clampPoint({ x: center.x + Math.cos(angle) * SPREAD, y: center.y + Math.sin(angle) * SPREAD });
}

export interface CompiledPlan {
  map: BattleMap;
  /** Symbols left out because a landmark they need has not been placed. */
  skipped: number;
}

/**
 * Adds the plan to the map: its sides (reusing the map's own), one phase per plan phase after the existing
 * ones, and its symbols placed from the landmark positions. Nothing already on the map is changed.
 */
export function compileBattlePlan(plan: BattlePlan, positions: AnchorPositions, current: BattleMap): CompiledPlan {
  const { factions, idOf } = mergeFactions(plan, current.factions);
  const phases: BattlePhase[] = [];
  const symbols: BattleSymbol[] = [];
  const crowd: Record<string, number> = {};
  const lanes: Record<string, number> = {};
  let skipped = 0;

  for (const p of plan.phases) {
    const phase: BattlePhase = { id: crypto.randomUUID(), title: p.title.slice(0, 120), narration: p.narration, camera: p.camera === "full" ? "full" : "auto" };
    phases.push(phase);

    for (const s of p.symbols) {
      const type = s.type as BattleSymbolType;
      const factionId = idOf[s.faction];
      if (!Object.hasOwn(SYMBOL_LABELS, type) || type === "step" || !factionId) { skipped++; continue; }
      const base: BattleSymbol = {
        id: crypto.randomUUID(), type, factionId, label: (s.label ?? "").slice(0, 120),
        x: 50, y: 50, size: defaultSymbolSize(type), rotation: 0, phaseId: phase.id,
      };

      if (MOVEMENT.has(type)) {
        const start = s.from ? positions[s.from] : undefined;
        const end = s.to ? positions[s.to] : undefined;
        if (!start || !end || s.from === s.to) { skipped++; continue; }
        const forward = s.from! < s.to!;
        const pair = forward ? `${s.from}|${s.to}` : `${s.to}|${s.from}`;
        const lane = lanes[pair] ?? 0;
        lanes[pair] = lane + 1;
        const axis: [MapPoint, MapPoint] = forward ? [start, end] : [end, start];
        symbols.push(withPoints(base, route(start, end, s.via ? positions[s.via] : undefined, lane, axis)));
        continue;
      }

      const at = s.at ? positions[s.at] : undefined;
      if (!at) { skipped++; continue; }
      const index = crowd[s.at!] ?? 0;
      crowd[s.at!] = index + 1;
      const place = spread(at, index);
      if (isLineSymbol(type)) {
        symbols.push(withPoints(base, [{ x: place.x - CROSS_LINE_HALF, y: place.y }, { x: place.x + CROSS_LINE_HALF, y: place.y }]));
      } else {
        symbols.push({ ...base, x: place.x, y: place.y });
      }
    }
  }

  return {
    map: { ...current, factions, symbols: [...current.symbols, ...symbols], phases: [...(current.phases ?? []), ...phases] },
    skipped,
  };
}

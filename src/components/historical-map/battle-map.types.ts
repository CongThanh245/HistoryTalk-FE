export const SYMBOL_LABELS = {
  // Hướng hành động
  arrow: "Tiến công", flank: "Vu hồi / bao vây", march: "Cơ động", retreat: "Rút lui",
  // Lực lượng
  infantry: "Bộ binh", cavalry: "Kỵ binh", archer: "Cung nỏ", artillery: "Pháo binh",
  armor: "Thiết giáp", navy: "Thủy quân", airforce: "Không quân",
  // Trận địa
  headquarters: "Sở chỉ huy", fort: "Thành / đồn lũy", camp: "Doanh trại",
  defenseLine: "Phòng tuyến", stakes: "Bãi cọc", ambush: "Mai phục",
  // Diễn biến
  clash: "Giao tranh", victory: "Chiến thắng", destroyed: "Bị tiêu diệt",
  step: "Mốc diễn biến", label: "Chú thích",
} as const;

export type BattleSymbolType = keyof typeof SYMBOL_LABELS;

export const SYMBOL_GROUPS: { title: string; types: BattleSymbolType[] }[] = [
  { title: "Hướng hành động", types: ["arrow", "flank", "march", "retreat"] },
  { title: "Lực lượng", types: ["infantry", "cavalry", "archer", "artillery", "armor", "navy", "airforce"] },
  { title: "Trận địa", types: ["headquarters", "fort", "camp", "defenseLine", "stakes", "ambush"] },
  { title: "Diễn biến", types: ["clash", "victory", "destroyed", "step", "label"] },
];

/**
 * `label` meaning by type: "label" → text drawn on the map; "step" → number in the circle;
 * every other type → legend note (shown in the legend card and on hover, not drawn on the map).
 */
export const isNoteSymbol = (type: BattleSymbolType) => type !== "label" && type !== "step";

/** Directional / line symbols: drawn by press-and-drag from start to end point. */
export const LINE_SYMBOLS: readonly BattleSymbolType[] = ["arrow", "flank", "march", "retreat", "defenseLine", "stakes"];
export const isLineSymbol = (type: BattleSymbolType) => LINE_SYMBOLS.includes(type);

/** Default width (% of image) for a newly placed symbol. */
export const defaultSymbolSize = (type: BattleSymbolType) =>
  ["arrow", "flank", "march", "retreat"].includes(type) ? 15
    : ["defenseLine", "stakes"].includes(type) ? 14
      : type === "step" ? 5 : 7;

export const SYMBOL_SIZE_MIN = 2;
export const SYMBOL_SIZE_MAX = 60;

export interface BattleFaction { id: string; name: string; color: string }
/** Point on the image, in % of its width (x) and height (y). */
export interface MapPoint { x: number; y: number }
export interface BattleSymbol {
  id: string;
  type: BattleSymbolType;
  factionId: string;
  label: string;
  /** Coordinates and size as percentages of the original image. */
  x: number;
  y: number;
  size: number;
  rotation: number;
  /** Phase the symbol appears in; missing or unknown = always shown (background layer). */
  phaseId?: string;
  /** How the symbol appears during playback; missing = "auto" (chosen from the type). */
  effect?: SymbolEffect;
  /**
   * Line symbols: route through these points, drawn as a smooth curve. x/y/size then hold the centre and
   * width of its bounding box. Missing = a straight line from x, y, size and rotation (older maps).
   */
  points?: MapPoint[];
  /** Line symbols: stroke weight multiplier; missing = 1. */
  weight?: number;
}

/** Line symbol following `points`, with x/y/size kept on its bounding box (camera, selection, badges). */
export function withPoints(symbol: BattleSymbol, points: MapPoint[]): BattleSymbol {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const round = (v: number) => Math.round(v * 10) / 10;
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return {
    ...symbol, points: points.map(p => ({ x: round(clampPercent(p.x)), y: round(clampPercent(p.y)) })),
    x: round((x0 + x1) / 2), y: round((y0 + y1) / 2), size: round(Math.max(SYMBOL_SIZE_MIN, Math.min(SYMBOL_SIZE_MAX, x1 - x0))),
  };
}

/** Moves a symbol's centre to x, y; a route moves as a whole and stops at the image edge. */
export function moveSymbol(symbol: BattleSymbol, x: number, y: number): BattleSymbol {
  if (!symbol.points) return { ...symbol, x, y };
  const xs = symbol.points.map(p => p.x), ys = symbol.points.map(p => p.y);
  const dx = Math.max(-Math.min(...xs), Math.min(100 - Math.max(...xs), x - symbol.x));
  const dy = Math.max(-Math.min(...ys), Math.min(100 - Math.max(...ys), y - symbol.y));
  return withPoints(symbol, symbol.points.map(p => ({ x: p.x + dx, y: p.y + dy })));
}

export const SYMBOL_EFFECTS = { auto: "Tự động", draw: "Vẽ dần", fade: "Hiện dần", pop: "Bật ra", pulse: "Nhấp nháy" } as const;
export type SymbolEffect = keyof typeof SYMBOL_EFFECTS;
/** Effect used for "auto": arrows draw themselves, clashes pulse, outcomes pop in. */
export const autoEffect = (type: BattleSymbolType): Exclude<SymbolEffect, "auto"> =>
  ["arrow", "flank", "march", "retreat", "defenseLine", "stakes"].includes(type) ? "draw"
    : type === "clash" ? "pulse" : type === "victory" || type === "destroyed" ? "pop" : "fade";
export const resolveEffect = (symbol: BattleSymbol) =>
  !symbol.effect || symbol.effect === "auto" ? autoEffect(symbol.type) : symbol.effect;

/** Area of the image in % of its width (x, w) and height (y, h). */
export interface CameraRect { x: number; y: number; w: number; h: number }

/** One scene of the battle: its symbols appear while its narration is read. */
export interface BattlePhase {
  id: string;
  title: string;
  narration: string;
  /** "auto" zooms onto the phase's symbols, "full" keeps the whole map, "frame" zooms onto `focus`. */
  camera: "auto" | "full" | "frame";
  /** Area drawn by the editor for camera "frame". */
  focus?: CameraRect;
}

const isCameraRect = (r: unknown): r is CameraRect => !!r && typeof r === "object"
  && (["x", "y", "w", "h"] as const).every(k => Number.isFinite((r as CameraRect)[k]))
  && (r as CameraRect).w > 0 && (r as CameraRect).h > 0;
export const PHASE_NARRATION_MAX = 2000;

export interface BattleMap {
  version: 1;
  mode: "custom" | "image";
  imageUrl: string;
  imageSource: string;
  factions: BattleFaction[];
  symbols: BattleSymbol[];
  /** Ordered playback scenes. Maps saved before phases existed have none. */
  phases?: BattlePhase[];
}

export const emptyBattleMap = (): BattleMap => ({
  version: 1, mode: "custom", imageUrl: "", imageSource: "", factions: [], symbols: [],
});

export const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export function isBattleMap(value: unknown): value is BattleMap {
  if (!value || typeof value !== "object") return false;
  const map = value as BattleMap;
  return map.version === 1 && ["custom", "image"].includes(map.mode)
    && typeof map.imageUrl === "string" && typeof map.imageSource === "string"
    && Array.isArray(map.factions) && Array.isArray(map.symbols)
    && map.factions.every(f => f && typeof f.id === "string" && typeof f.name === "string" && /^#[0-9a-f]{6}$/i.test(f.color))
    && map.symbols.every(s => s && typeof s.id === "string" && Object.hasOwn(SYMBOL_LABELS, s.type)
      && typeof s.label === "string" && map.factions.some(f => f.id === s.factionId)
      && [s.x, s.y, s.size, s.rotation].every(Number.isFinite)
      && s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100 && s.size >= SYMBOL_SIZE_MIN && s.size <= SYMBOL_SIZE_MAX
      && (s.phaseId === undefined || typeof s.phaseId === "string")
      && (s.effect === undefined || Object.hasOwn(SYMBOL_EFFECTS, s.effect))
      && (s.points === undefined || (Array.isArray(s.points) && s.points.length >= 2
        && s.points.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100)))
      && (s.weight === undefined || (Number.isFinite(s.weight) && s.weight > 0)))
    && (map.phases === undefined || (Array.isArray(map.phases) && map.phases.every(p => p && typeof p.id === "string"
      && typeof p.title === "string" && typeof p.narration === "string" && ["auto", "full", "frame"].includes(p.camera)
      && (p.focus === undefined || isCameraRect(p.focus)))));
}

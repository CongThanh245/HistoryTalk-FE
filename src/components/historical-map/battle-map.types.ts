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
}
export interface BattleMap {
  version: 1;
  mode: "custom" | "image";
  imageUrl: string;
  imageSource: string;
  factions: BattleFaction[];
  symbols: BattleSymbol[];
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
      && s.x >= 0 && s.x <= 100 && s.y >= 0 && s.y <= 100 && s.size >= SYMBOL_SIZE_MIN && s.size <= SYMBOL_SIZE_MAX);
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Expand, Map, Minus, MoveHorizontal, Plus, RotateCcw, RotateCw } from "lucide-react";
import { clampPercent, isLineSymbol, isNoteSymbol, resolveEffect, SYMBOL_LABELS, SYMBOL_SIZE_MAX, SYMBOL_SIZE_MIN, type BattleMap, type BattleSymbol, type BattleSymbolType, type CameraRect, type MapPoint } from "./battle-map.types";
import { controlPoints, lineGeometry, pointsRect, simplify } from "./battle-path";
import styles from "./battle-map-editor.module.css";

const UNIT_BOX = <rect x="14" y="9" width="72" height="32" fill="white" />;

/** Military-style glyphs drawn in a 100×50 box; arrows point right at rotation 0. */
export function SymbolGlyph({ type, text }: { type: BattleSymbolType; text?: string }) {
  return <svg viewBox="0 0 100 50" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
    {type === "arrow" && <path d="M4 18H68V5L96 25 68 45V32H4Z" fill="currentColor" fillOpacity=".3" />}
    {type === "flank" && <><path d="M6 44C18 10 60 4 82 26" strokeWidth="6" /><path d="M94 38 73 34 88 19Z" fill="currentColor" /></>}
    {type === "march" && <><path d="M4 25H88" /><path d="M74 13 94 25 74 37" /></>}
    {type === "retreat" && <><path d="M4 25H76" strokeWidth="6" strokeDasharray="10 7" /><path d="M72 11 96 25 72 39Z" fill="currentColor" /></>}
    {type === "infantry" && <>{UNIT_BOX}<path d="m14 9 72 32M86 9 14 41" /></>}
    {type === "cavalry" && <>{UNIT_BOX}<path d="M14 41 86 9" /></>}
    {type === "archer" && <>{UNIT_BOX}<path d="M36 35Q50 8 64 35M36 35H64M50 35V16" /></>}
    {type === "artillery" && <>{UNIT_BOX}<circle cx="50" cy="25" r="7" fill="currentColor" /></>}
    {type === "armor" && <>{UNIT_BOX}<rect x="28" y="17" width="44" height="16" rx="8" /></>}
    {type === "navy" && <><path d="M8 28H92L78 45H22Z" fill="white" /><path d="M50 28V4M50 6 72 22H50" /></>}
    {type === "airforce" && <>{UNIT_BOX}<path d="M30 25Q40 13 50 25Q60 37 70 25Q60 13 50 25Q40 37 30 25Z" /></>}
    {type === "headquarters" && <><path d="M25 47V5H82L66 18 82 31H25" /><path d="m40 8 12 20m0-20L40 28" /></>}
    {type === "fort" && <path d="M14 45V9H26V17H38V9H50V17H62V9H74V17H86V9V45Z" fill="white" />}
    {type === "camp" && <><path d="M18 45 50 7 82 45Z" fill="white" /><path d="M50 7V45M40 45 50 31 60 45" /></>}
    {type === "defenseLine" && <><path d="M2 34H98" strokeWidth="4" /><path d="M8 34 15 18 22 34ZM32 34 39 18 46 34ZM56 34 63 18 70 34ZM80 34 87 18 94 34Z" fill="currentColor" /></>}
    {type === "stakes" && <><path d="M2 40Q10 34 18 40T34 40T50 40T66 40T82 40T98 40" strokeWidth="2" /><path d="M10 42 16 6 22 42M30 42 36 6 42 42M50 42 56 6 62 42M70 42 76 6 82 42" fill="currentColor" fillOpacity=".25" /></>}
    {type === "ambush" && <><path d="M8 44Q50 -8 92 44" strokeWidth="4" strokeDasharray="8 5" /><path d="M50 20V36M30 28 37 38M70 28 63 38" /></>}
    {type === "clash" && <path d="M50 2 57 16 74 6 69 22 92 25 72 32 82 47 61 39 50 49 39 39 18 47 28 32 8 25 31 22 26 6 43 16Z" fill="currentColor" fillOpacity=".35" />}
    {type === "victory" && <><path d="M32 48V3" strokeWidth="4" /><path d="M32 5H80L68 17 80 29H32" fill="currentColor" /></>}
    {type === "destroyed" && <><circle cx="50" cy="25" r="21" fill="white" /><path d="M37 12 63 38M63 12 37 38" strokeWidth="5" /></>}
    {type === "step" && <><circle cx="50" cy="25" r="22" fill="currentColor" stroke="white" strokeWidth="3" />
      <text x="50" y="26" fill="white" stroke="none" fontSize="24" fontWeight="800" textAnchor="middle" dominantBaseline="central">{text || "1"}</text></>}
    {type === "label" && <path d="M30 9H70M50 9V41M39 41H61" />}
  </svg>;
}

/** How one symbol is drawn right now (phase editing / playback). */
export interface SymbolView {
  hidden?: boolean;
  /** Belongs to an earlier phase: kept faintly for context. */
  dim?: boolean;
  /** Plays the appear effect; a new `key` replays it. */
  enter?: { delay: number; key: string };
}

/** Area around `symbols` (with a margin), in the same % units as a drawn camera frame. */
function symbolsRect(symbols: BattleSymbol[], aspect: number): CameraRect | null {
  if (!symbols.length) return null;
  let x0 = 100, x1 = 0, y0 = 100, y1 = 0;
  for (const s of symbols) {
    if (isLineSymbol(s.type)) {
      const r = pointsRect(controlPoints(s, aspect));
      x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x + r.w);
      y0 = Math.min(y0, r.y); y1 = Math.max(y1, r.y + r.h);
      continue;
    }
    // Glyphs are 2:1 boxes measured in % of the image width; y extents convert to % of the height.
    const a = s.rotation * Math.PI / 180, w = s.size / 2, h = s.size / 4;
    const ex = Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a));
    const ey = (Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))) * aspect;
    x0 = Math.min(x0, s.x - ex); x1 = Math.max(x1, s.x + ex);
    y0 = Math.min(y0, s.y - ey); y1 = Math.max(y1, s.y + ey);
  }
  const pad = 10;
  return { x: x0 - pad, y: y0 - pad * aspect, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad * aspect };
}

/** A line symbol drawn as an SVG path (in the plane's width-% units). */
function LinePath({ symbol, aspect, color, selected, enterKey }: { symbol: BattleSymbol; aspect: number; color: string; selected?: boolean; enterKey?: string }) {
  const g = lineGeometry(symbol, aspect);
  const dashed = !!g.dash;
  const maskId = enterKey && `trace-${symbol.id}-${enterKey}`;
  return <>
    {maskId && <mask id={maskId} maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height={100 / aspect + 20}>
      <path d={g.route} className={styles.traceMask} pathLength={1} fill="none" stroke="#fff" strokeWidth={6 + g.width * 3} strokeLinecap="round" strokeLinejoin="round" />
    </mask>}
    {selected && <path d={g.route} className={styles.pathSelected} strokeWidth={g.width + 1.6} />}
    <g mask={maskId ? `url(#${maskId})` : undefined} strokeLinejoin="round">
      {/* Light casing under the ink keeps every line readable on dark or busy images. */}
      <path d={g.line} fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth={g.width + .55} strokeDasharray={g.dash} strokeLinecap={dashed ? "butt" : "round"} />
      {g.teeth && <path d={g.teeth} fill={color} stroke="#fff" strokeOpacity=".85" strokeWidth=".25" paintOrder="stroke" />}
      <path d={g.line} fill="none" stroke={color} strokeWidth={g.width} strokeDasharray={g.dash} strokeLinecap={dashed ? "butt" : "round"} />
    </g>
    {g.head && <path d={g.head} className={styles.pathHead} fill={g.headOpen ? "none" : color} stroke={g.headOpen ? color : "#fff"}
      strokeOpacity={g.headOpen ? 1 : .85} strokeWidth={g.headOpen ? g.width : .3} strokeLinecap="round" strokeLinejoin="round" paintOrder="stroke" />}
    <path d={g.route} className={styles.pathHit} strokeWidth={Math.max(2.4, g.width + 1.6)} />
  </>;
}

/** Zoom/offset (CSS transform, origin top-left) that fits `rect` inside the plane. */
function cameraTransform(rect: CameraRect) {
  const scale = Math.max(1, Math.min(4, 100 / rect.w, 100 / rect.h));
  const clamp = (v: number) => Math.max(100 - 100 * scale, Math.min(0, v));
  const tx = clamp(50 - (rect.x + rect.w / 2) * scale), ty = clamp(50 - (rect.y + rect.h / 2) * scale);
  return `translate(${tx}%, ${ty}%) scale(${scale})`;
}

const rectBetween = (a: { x: number; y: number }, b: { x: number; y: number }): CameraRect =>
  ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });
const rectStyle = (r: CameraRect) => ({ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` });

export function BattleMapCanvas({ value, title, selectedId, selectedIds, placingType, placingColor, onSelect, onMove, onTransform, onAdd, onPointsChange, onDelete, legendTitle, symbolView, focus, spotlight, cameraFrame, onDrawFrame, onMarquee, phaseBadge, quickLabel }: {
  value: BattleMap; title: string;
  /** Symbol with rotate/resize handles (single selection). */
  selectedId?: string | null;
  /** Every selected symbol (outlined); defaults to `selectedId`. */
  selectedIds?: string[];
  /** When set, the next click on the map places this symbol. */
  placingType?: BattleSymbolType | null;
  /** Colour of the side being drawn, used for the live drawing preview. */
  placingColor?: string;
  /** `additive` (Shift/Ctrl click) toggles the symbol in a multi-selection. */
  onSelect?: (id: string | null, additive?: boolean) => void;
  onMove?: (id: string, x: number, y: number) => void;
  /** Enables the rotate / resize handles on the selected symbol. */
  onTransform?: (id: string, patch: Pick<Partial<BattleSymbol>, "rotation" | "size">) => void;
  /** `points`: route of a line symbol drawn by dragging. */
  onAdd?: (type: BattleSymbolType, x: number, y: number, shape?: { points: MapPoint[] }) => void;
  /** Editor: the route of a line symbol was reshaped (vertex dragged, added or removed). */
  onPointsChange?: (id: string, points: MapPoint[]) => void;
  onDelete?: (id: string) => void;
  /** Heading of the legend card, e.g. "Trận Bạch Đằng – 1288". */
  legendTitle?: string;
  /** Per-symbol state for phases; omit to draw every symbol normally. */
  symbolView?: (symbol: BattleSymbol) => SymbolView;
  /** Playback camera: zooms onto these symbols or this area (null = whole map). Leave undefined outside playback. */
  focus?: BattleSymbol[] | CameraRect | null;
  /** Playback: darkens everything outside this area. */
  spotlight?: CameraRect | null;
  /** Editor: camera frame of the phase being edited (dashed outline). */
  cameraFrame?: CameraRect | null;
  /** Editor: set while a camera frame is being drawn; receives the dragged area. */
  onDrawFrame?: (rect: CameraRect) => void;
  /** Editor: dragging on empty map selects the symbols inside the box. */
  onMarquee?: (ids: string[], additive: boolean) => void;
  /** Editor: note box shown on the map right after a symbol is placed. */
  quickLabel?: { id: string; onChange: (label: string) => void; onDone: () => void };
  /** Editor: small tag next to each symbol, e.g. its phase number. */
  phaseBadge?: (symbol: BattleSymbol) => string | undefined;
}) {
  const [zoom, setZoom] = useState(1);
  const [imageState, setImageState] = useState({ src: "", status: "loading" });
  const plane = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState<{ w: number; h: number } | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  const [legendOpen, setLegendOpen] = useState(!onAdd);
  /** Hover note: symbol id + pointer position in px relative to the plane. */
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);
  /** Symbol drag: moves every symbol of `group` by the pointer delta since `start`. */
  const drag = useRef<{ id: string; start: { x: number; y: number }; group: { id: string; x: number; y: number }[]; moved: boolean } | null>(null);
  /** Box selection on empty map. */
  const marqueeStart = useRef<{ x: number; y: number; additive: boolean } | null>(null);
  const [marquee, setMarquee] = useState<CameraRect | null>(null);
  const isSelected = (id: string) => selectedIds ? selectedIds.includes(id) : selectedId === id;
  const handle = useRef<{ id: string; kind: "rotate" | "resize" } | null>(null);
  /** Press-and-drag drawing of a line symbol: the pointer's route (in %) and its length in px. */
  const drawStart = useRef<{ points: MapPoint[]; last: { x: number; y: number }; length: number } | null>(null);
  const suppressClick = useRef(false);
  const [drawPreview, setDrawPreview] = useState<MapPoint[] | null>(null);
  /** Vertex of a route being dragged (index into its control points). */
  const vertexDrag = useRef<{ id: string; index: number } | null>(null);
  /** Camera frame being dragged (start point and live area, in %). */
  const frameStart = useRef<{ x: number; y: number } | null>(null);
  const [framePreview, setFramePreview] = useState<CameraRect | null>(null);
  /** Extends the route being drawn with the pointer position (ignores sub-pixel jitter). */
  const extendDraw = (clientX: number, clientY: number) => {
    const d = drawStart.current!;
    const step = Math.hypot(clientX - d.last.x, clientY - d.last.y);
    if (step < 3) return d;
    drawStart.current = { points: [...d.points, point(clientX, clientY)], last: { x: clientX, y: clientY }, length: d.length + step };
    return drawStart.current;
  };
  const ready = imageState.src === value.imageUrl && imageState.status === "ready";
  const failed = imageState.src === value.imageUrl && imageState.status === "error";
  const showSymbols = ready && value.mode === "custom";
  // At 100% the whole image fits the frame (width and height); zooming in past that scrolls.
  const fitWidth = viewportSize && aspect ? Math.floor(Math.min(viewportSize.w, viewportSize.h * aspect)) - 1 : null;
  /** Learner view (nothing editable): blurred backdrop, "Lấp đầy" and drag-to-pan. */
  const viewer = !onAdd && !onSelect;
  // "Lấp đầy" fills the frame's width; the rest of the image stays reachable by dragging, never cropped away.
  const fillZoom = viewportSize && fitWidth ? Math.max(1, Math.floor((viewportSize.w - 1) / fitWidth * 100) / 100) : 1;
  const maxZoom = Math.max(3, fillZoom);
  const pan = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const fill = () => {
    setZoom(fillZoom);
    // Centre the image vertically once the larger frame is laid out.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = viewport.current;
      if (el) el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
    }));
  };

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setViewportSize({ w: el.clientWidth, h: el.clientHeight }));
    observer.observe(el);
    return () => observer.disconnect();
  }, [value.imageUrl]);
  const factionOf = (symbol: BattleSymbol) => value.factions.find(f => f.id === symbol.factionId);
  /** One legend row per (type, side, note); unnamed symbols fall back to "type (side)". */
  const legendEntries = [...new globalThis.Map(value.symbols.filter(s => isNoteSymbol(s.type) && !symbolView?.(s).hidden).map(s => {
    const faction = factionOf(s);
    const note = s.label.trim();
    return [`${s.type}|${s.factionId}|${note}`, { type: s.type, color: faction?.color, text: note || `${SYMBOL_LABELS[s.type]}${faction ? ` (${faction.name})` : ""}` }] as const;
  })).values()];
  const tipSymbol = tip && !drag.current && !handle.current ? value.symbols.find(s => s.id === tip.id) : undefined;
  const tipFaction = tipSymbol && factionOf(tipSymbol);
  const showTip = (symbol: BattleSymbol, e: React.PointerEvent<Element>) => {
    if (symbol.type === "label" || drag.current || handle.current) return;
    const rect = plane.current!.getBoundingClientRect();
    setTip({ id: symbol.id, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const point = (clientX: number, clientY: number) => {
    const rect = plane.current!.getBoundingClientRect();
    const pct = (v: number) => Math.round(clampPercent(v) * 10) / 10;
    return { x: pct((clientX - rect.left) / rect.width * 100), y: pct((clientY - rect.top) / rect.height * 100) };
  };
  /** Rotate: angle from the symbol centre to the pointer (Shift snaps to 15°). Resize: twice the pointer's distance along the symbol's own x-axis. */
  const transformTo = (symbol: BattleSymbol, kind: "rotate" | "resize", clientX: number, clientY: number, snap: boolean) => {
    const rect = plane.current!.getBoundingClientRect();
    const dx = clientX - (rect.left + symbol.x / 100 * rect.width);
    const dy = clientY - (rect.top + symbol.y / 100 * rect.height);
    if (kind === "rotate") {
      let deg = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      if (snap) deg = Math.round(deg / 15) * 15;
      onTransform?.(symbol.id, { rotation: ((Math.round(deg) % 360) + 360) % 360 });
    } else {
      const r = symbol.rotation * Math.PI / 180;
      const along = dx * Math.cos(r) + dy * Math.sin(r);
      const size = Math.round(Math.max(SYMBOL_SIZE_MIN, Math.min(SYMBOL_SIZE_MAX, 2 * along / rect.width * 100)));
      onTransform?.(symbol.id, { size });
    }
  };
  const handleProps = (symbol: BattleSymbol, kind: "rotate" | "resize") => ({
    "aria-hidden": true,
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.preventDefault(); e.stopPropagation();
      handle.current = { id: symbol.id, kind };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (handle.current?.id !== symbol.id || handle.current.kind !== kind) return;
      e.stopPropagation();
      transformTo(symbol, kind, e.clientX, e.clientY, e.shiftKey);
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.stopPropagation(); handle.current = null; },
    onPointerCancel: () => { handle.current = null; },
  });
  const moveByKey = (symbol: BattleSymbol, key: string, step: number) => {
    const delta: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (!delta[key] || !onMove) return false;
    onMove(symbol.id, clampPercent(symbol.x + delta[key][0]), clampPercent(symbol.y + delta[key][1]));
    return true;
  };
  /** Select, drag, keyboard and hover behaviour shared by glyph buttons and line paths. */
  const symbolProps = (symbol: BattleSymbol) => {
    const faction = factionOf(symbol);
    return {
      "aria-label": `${SYMBOL_LABELS[symbol.type]}: ${symbol.label || faction?.name || "Chưa đặt tên"}`,
      "aria-pressed": onSelect ? isSelected(symbol.id) : undefined,
      tabIndex: onSelect ? 0 : -1,
      // Pointer selection happens on press; a click only selects from the keyboard (Enter/Space).
      onClick: (e: React.MouseEvent) => { e.stopPropagation(); if (!onMove || e.detail === 0) onSelect?.(symbol.id); },
      onPointerDown: (e: React.PointerEvent<HTMLElement | SVGElement>) => {
        if (!onMove) return;
        e.preventDefault(); e.currentTarget.focus(); setTip(null);
        if (e.shiftKey || e.ctrlKey || e.metaKey) { onSelect?.(symbol.id, true); return; }
        // Pressing a symbol of a multi-selection drags the whole group.
        const ids = selectedIds && selectedIds.length > 1 && selectedIds.includes(symbol.id) ? selectedIds : [symbol.id];
        if (ids.length === 1) onSelect?.(symbol.id);
        drag.current = {
          id: symbol.id, start: point(e.clientX, e.clientY), moved: false,
          group: value.symbols.filter(s => ids.includes(s.id)).map(s => ({ id: s.id, x: s.x, y: s.y })),
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      onPointerEnter: (e: React.PointerEvent<Element>) => showTip(symbol, e),
      onPointerLeave: () => setTip(t => (t?.id === symbol.id ? null : t)),
      onPointerMove: (e: React.PointerEvent<Element>) => {
        if (drag.current?.id !== symbol.id || !onMove) { showTip(symbol, e); return; }
        const p = point(e.clientX, e.clientY), d = drag.current;
        const dx = p.x - d.start.x, dy = p.y - d.start.y;
        if (!d.moved && Math.abs(dx) + Math.abs(dy) < .3) return;
        d.moved = true;
        for (const g of d.group) onMove(g.id, Math.round(clampPercent(g.x + dx) * 10) / 10, Math.round(clampPercent(g.y + dy) * 10) / 10);
      },
      onPointerUp: () => {
        // A press without moving on a grouped symbol narrows the selection to it.
        if (drag.current && !drag.current.moved && drag.current.group.length > 1) onSelect?.(symbol.id);
        drag.current = null;
      },
      onPointerCancel: () => { drag.current = null; },
      onKeyDown: (e: React.KeyboardEvent) => {
        if ((e.key === "Delete" || e.key === "Backspace") && onDelete) { e.preventDefault(); onDelete(symbol.id); return; }
        if (moveByKey(symbol, e.key, e.shiftKey ? 5 : 1)) e.preventDefault();
      },
    };
  };
  /** Route vertex handle; `insert` (midpoint handle) first adds a vertex at `index`, then drags it. */
  const vertexProps = (symbol: BattleSymbol, index: number, insert: boolean) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0 || !aspect) return;
      e.preventDefault(); e.stopPropagation(); setTip(null);
      const pts = controlPoints(symbol, aspect);
      if (insert) onPointsChange?.(symbol.id, [...pts.slice(0, index), point(e.clientX, e.clientY), ...pts.slice(index)]);
      vertexDrag.current = { id: symbol.id, index };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const v = vertexDrag.current;
      if (!v || v.id !== symbol.id || !aspect) return;
      e.stopPropagation();
      onPointsChange?.(symbol.id, controlPoints(symbol, aspect).map((p, i) => i === v.index ? point(e.clientX, e.clientY) : p));
    },
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => { e.stopPropagation(); vertexDrag.current = null; },
    onPointerCancel: () => { vertexDrag.current = null; },
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  });
  return <div className={styles.canvas}>
    <div className={styles.zoomTools} aria-label="Thu phóng lược đồ">
      <button type="button" aria-label="Thu nhỏ lược đồ" disabled={zoom === 1} onClick={() => setZoom(z => Math.max(1, z - .25))}><Minus size={16} /></button>
      <output>{Math.round(zoom * 100)}%</output>
      <button type="button" aria-label="Phóng to lược đồ" disabled={zoom >= maxZoom} onClick={() => setZoom(z => Math.min(maxZoom, z + .25))}><Plus size={16} /></button>
      {viewer && fillZoom > 1.05 && <button type="button" aria-label="Lấp đầy khung" title="Lấp đầy khung (kéo để xem phần còn lại)" aria-pressed={zoom === fillZoom} onClick={fill}><Expand size={15} /></button>}
      <button type="button" aria-label="Xem toàn bộ lược đồ" title="Xem toàn bộ lược đồ" onClick={() => setZoom(1)}><RotateCcw size={16} /></button>
    </div>
    <div className={styles.stage}>
    {/* The sides the image does not cover show a blurred copy of it instead of empty bands. */}
    {viewer && ready && <div className={styles.ambient} aria-hidden="true" style={{ backgroundImage: `url("${value.imageUrl.replace(/"/g, "%22")}")` }} />}
    <div ref={viewport} className={styles.viewport} data-ambient={viewer && ready} data-pan={viewer && zoom > 1}
      onPointerDown={e => {
        if (!viewer || zoom <= 1 || e.button !== 0) return;
        pan.current = { x: e.clientX, y: e.clientY, left: e.currentTarget.scrollLeft, top: e.currentTarget.scrollTop };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={e => {
        if (!pan.current) return;
        e.currentTarget.scrollLeft = pan.current.left - (e.clientX - pan.current.x);
        e.currentTarget.scrollTop = pan.current.top - (e.clientY - pan.current.y);
      }}
      onPointerUp={() => { pan.current = null; }} onPointerCancel={() => { pan.current = null; }}>
      {!value.imageUrl ? <div className={styles.empty}><Map size={32} /><p>Chưa có lược đồ trận đánh</p>{onAdd && <span>Thêm ảnh ở mục «Ảnh nền» bên trái.</span>}</div> : <>
        {!ready && <p className={styles.imageStatus} role={failed ? "alert" : "status"}>{failed ? "Không tải được ảnh. Kiểm tra đường dẫn hoặc chọn ảnh khác." : "Đang tải lược đồ…"}</p>}
        <div className={styles.frame} data-camera={focus !== undefined} style={{ width: fitWidth ? `${fitWidth * zoom}px` : `${zoom * 100}%` }}>
        <div ref={plane} className={styles.plane} data-placing={!!placingType && showSymbols} data-drawing={!!onDrawFrame && ready}
          style={{ transform: (() => {
            if (!focus || !aspect || !ready) return undefined;
            const rect = Array.isArray(focus) ? symbolsRect(focus, aspect) : focus;
            return rect ? cameraTransform(rect) : undefined;
          })() }}
          onPointerDown={e => {
            if (onDrawFrame && ready && e.button === 0) {
              e.preventDefault();
              frameStart.current = point(e.clientX, e.clientY);
              setFramePreview({ ...frameStart.current, w: 0, h: 0 });
              e.currentTarget.setPointerCapture(e.pointerId);
              return;
            }
            if (onMarquee && !placingType && showSymbols && e.button === 0 && (e.target === e.currentTarget || e.target instanceof HTMLImageElement)) {
              const p = point(e.clientX, e.clientY);
              marqueeStart.current = { ...p, additive: e.shiftKey || e.ctrlKey || e.metaKey };
              e.currentTarget.setPointerCapture(e.pointerId);
              return;
            }
            if (!placingType || !onAdd || !showSymbols || !isLineSymbol(placingType) || e.button !== 0) return;
            e.preventDefault();
            drawStart.current = { points: [point(e.clientX, e.clientY)], last: { x: e.clientX, y: e.clientY }, length: 0 };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={e => {
            if (frameStart.current) { setFramePreview(rectBetween(frameStart.current, point(e.clientX, e.clientY))); return; }
            if (marqueeStart.current) { setMarquee(rectBetween(marqueeStart.current, point(e.clientX, e.clientY))); return; }
            if (!drawStart.current) return;
            const d = extendDraw(e.clientX, e.clientY);
            setDrawPreview(d.length >= 8 && d.points.length >= 2 ? d.points : null);
          }}
          onPointerUp={e => {
            if (frameStart.current) {
              const rect = rectBetween(frameStart.current, point(e.clientX, e.clientY));
              frameStart.current = null; setFramePreview(null); suppressClick.current = true;
              if (rect.w >= 3 && rect.h >= 3) onDrawFrame?.(rect);
              return;
            }
            if (marqueeStart.current) {
              const start = marqueeStart.current;
              const rect = rectBetween(start, point(e.clientX, e.clientY));
              marqueeStart.current = null; setMarquee(null);
              // A plain click falls through to onClick (deselect); a real box selects what is inside.
              if (rect.w >= 1 || rect.h >= 1) {
                suppressClick.current = true;
                onMarquee?.(value.symbols.filter(s => !symbolView?.(s).hidden
                  && s.x >= rect.x && s.x <= rect.x + rect.w && s.y >= rect.y && s.y <= rect.y + rect.h).map(s => s.id), start.additive);
              }
              return;
            }
            if (!drawStart.current || !placingType || !onAdd) return;
            const d = extendDraw(e.clientX, e.clientY);
            drawStart.current = null; setDrawPreview(null);
            // A real drag draws the route (freehand, smoothed); a plain click falls through to onClick placement.
            if (d.length >= 8 && d.points.length >= 2 && aspect) {
              suppressClick.current = true;
              const points = simplify(d.points, aspect);
              const r = pointsRect(points);
              onAdd(placingType, r.x + r.w / 2, r.y + r.h / 2, { points });
            }
          }}
          onPointerCancel={() => { drawStart.current = null; setDrawPreview(null); frameStart.current = null; setFramePreview(null); marqueeStart.current = null; setMarquee(null); }}
          onClick={e => {
            if (suppressClick.current) { suppressClick.current = false; return; }
            if (!onAdd && !onSelect) return;
            const p = point(e.clientX, e.clientY);
            if (placingType && onAdd && showSymbols) onAdd(placingType, p.x, p.y);
            else if (e.target === e.currentTarget || e.target instanceof HTMLImageElement) onSelect?.(null);
          }}
          onDragOver={e => { if (onAdd && showSymbols) e.preventDefault(); }}
          onDrop={e => {
            e.preventDefault();
            const type = e.dataTransfer.getData("application/x-battle-symbol") as BattleSymbolType;
            if (onAdd && showSymbols && Object.hasOwn(SYMBOL_LABELS, type)) { const p = point(e.clientX, e.clientY); onAdd(type, p.x, p.y); }
          }}>
          {/* A native image preserves its intrinsic ratio and supports arbitrary admin URLs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.imageUrl} alt={title} draggable={false} onLoad={e => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
            if (w && h) setAspect(w / h);
            setImageState({ src: value.imageUrl, status: "ready" });
          }} onError={() => setImageState({ src: value.imageUrl, status: "error" })} />
          {showSymbols && aspect && <svg className={styles.lines} viewBox={`0 0 100 ${100 / aspect}`}>
            {value.symbols.map(symbol => {
              if (!isLineSymbol(symbol.type)) return null;
              const view = symbolView?.(symbol) ?? {};
              if (view.hidden) return null;
              const fx = view.enter ? resolveEffect(symbol) : undefined;
              return <g key={view.enter ? `${symbol.id}:${view.enter.key}` : symbol.id} className={styles.pathSymbol} role="button"
                data-dim={view.dim || undefined} data-fx={fx} style={{ "--fx-delay": `${view.enter?.delay ?? 0}ms` } as React.CSSProperties}
                {...symbolProps(symbol)}>
                <LinePath symbol={symbol} aspect={aspect} color={factionOf(symbol)?.color ?? "#b91c1c"} selected={isSelected(symbol.id)}
                  enterKey={fx === "draw" ? view.enter!.key : undefined} />
              </g>;
            })}
            {drawPreview && placingType && <g className={styles.pathPreview} aria-hidden="true">
              <LinePath symbol={{ id: "preview", type: placingType, factionId: "", label: "", x: 0, y: 0, size: SYMBOL_SIZE_MIN, rotation: 0, points: drawPreview }}
                aspect={aspect} color={placingColor ?? "#b91c1c"} />
            </g>}
          </svg>}
          {showSymbols && value.symbols.map(symbol => {
            if (isLineSymbol(symbol.type)) return null;
            const view = symbolView?.(symbol) ?? {};
            if (view.hidden) return null;
            return <button type="button" key={view.enter ? `${symbol.id}:${view.enter.key}` : symbol.id} className={styles.symbol} data-selected={isSelected(symbol.id)}
              data-dim={view.dim || undefined} data-fx={view.enter ? resolveEffect(symbol) : undefined}
              style={{ left: `${symbol.x}%`, top: `${symbol.y}%`, width: `${symbol.size}%`, color: factionOf(symbol)?.color ?? "#b91c1c", transform: `translate(-50%, -50%) rotate(${symbol.rotation}deg)`, "--fx-delay": `${view.enter?.delay ?? 0}ms` } as React.CSSProperties}
              {...symbolProps(symbol)}>
              {symbol.type === "step" ? <SymbolGlyph type="step" text={symbol.label} />
                : symbol.type === "label" ? <span>{symbol.label}</span> : <SymbolGlyph type={symbol.type} />}
              {onTransform && selectedId === symbol.id && <>
                <i className={styles.rotateHandle} title="Kéo để xoay (giữ Shift để xoay theo bước 15°)" {...handleProps(symbol, "rotate")}><RotateCw /></i>
                <i className={styles.resizeHandle} title="Kéo để đổi kích thước" {...handleProps(symbol, "resize")}><MoveHorizontal /></i>
              </>}
            </button>;
          })}
          {/* Route editing: drag a vertex to bend the line, drag a midpoint to add one, double-click a vertex to remove it. */}
          {showSymbols && aspect && onPointsChange && (() => {
            const symbol = selectedId ? value.symbols.find(s => s.id === selectedId && isLineSymbol(s.type)) : undefined;
            if (!symbol || symbolView?.(symbol).hidden) return null;
            const pts = controlPoints(symbol, aspect);
            return <>
              {pts.slice(1).map((p, i) => <i key={`mid:${i}`} className={styles.vertexAdd} title="Kéo để thêm điểm uốn" aria-hidden="true"
                style={{ left: `${(pts[i].x + p.x) / 2}%`, top: `${(pts[i].y + p.y) / 2}%` }}
                {...vertexProps(symbol, i + 1, true)} />)}
              {pts.map((p, i) => <i key={`v:${i}`} className={styles.vertex} aria-hidden="true"
                title={pts.length > 2 ? "Kéo để uốn · nhấp đúp để xóa điểm" : i ? "Kéo để đổi điểm cuối" : "Kéo để đổi điểm đầu"}
                style={{ left: `${p.x}%`, top: `${p.y}%` }} {...vertexProps(symbol, i, false)}
                onDoubleClick={e => { e.stopPropagation(); if (pts.length > 2) onPointsChange(symbol.id, pts.filter((_, j) => j !== i)); }} />)}
            </>;
          })()}
          {showSymbols && phaseBadge && value.symbols.map(s => {
            const badge = !symbolView?.(s).hidden && phaseBadge(s);
            return badge ? <span key={`badge:${s.id}`} className={styles.phaseBadge} aria-hidden="true"
              style={{ left: `${Math.min(99, s.x + s.size * .4)}%`, top: `${s.y}%` }}>{badge}</span> : null;
          })}
          {showSymbols && quickLabel && (() => {
            const symbol = value.symbols.find(s => s.id === quickLabel.id);
            if (!symbol) return null;
            return <input key={symbol.id} className={styles.quickLabel} autoFocus defaultValue={symbol.label}
              maxLength={symbol.type === "step" ? 3 : 120} aria-label={`Ghi chú cho ${SYMBOL_LABELS[symbol.type].toLowerCase()}`}
              placeholder={symbol.type === "label" ? "Chữ trên lược đồ · Enter" : symbol.type === "step" ? "Số" : "Ghi chú, vd: Thủy quân Ô Mã Nhi · Enter"}
              style={{ left: `${symbol.x}%`, top: `${symbol.y}%` }}
              onFocus={e => e.currentTarget.select()} onChange={e => quickLabel.onChange(e.target.value)} onBlur={quickLabel.onDone}
              // Keys stay in the box: Enter / Esc close it without reaching the editor shortcuts.
              onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); quickLabel.onDone(); } }}
              onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} />;
          })()}
          {marquee && <div className={styles.marquee} style={rectStyle(marquee)} aria-hidden="true" />}
          {ready && spotlight && <div className={styles.spotlight} style={rectStyle(spotlight)} aria-hidden="true" />}
          {ready && (framePreview ?? cameraFrame) && <div className={styles.cameraFrame} style={rectStyle((framePreview ?? cameraFrame)!)} aria-hidden="true">
            <span>Khung camera</span>
          </div>}
          {tipSymbol && tip && <div className={styles.tip} role="tooltip" style={{ left: tip.x, top: tip.y }}>
            <strong>{tipSymbol.type === "step" ? `${SYMBOL_LABELS.step} ${tipSymbol.label}` : tipSymbol.label.trim() || SYMBOL_LABELS[tipSymbol.type]}</strong>
            <span>{tipSymbol.label.trim() && tipSymbol.type !== "step" ? `${SYMBOL_LABELS[tipSymbol.type]} · ` : ""}{tipFaction?.name}</span>
          </div>}
        </div>
        </div>
      </>}
    </div>
    {showSymbols && legendEntries.length > 0 && <section className={styles.legendCard} data-open={legendOpen} aria-label="Chú giải">
      <header>
        <h3>{legendTitle || "Chú giải"}</h3>
        <button type="button" onClick={() => setLegendOpen(o => !o)} aria-expanded={legendOpen} aria-label={legendOpen ? "Thu gọn chú giải" : "Mở chú giải"}>
          {legendOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </header>
      {legendOpen && <ul aria-label="Chú giải ký hiệu">
        {legendEntries.map(entry => <li key={`${entry.type}|${entry.color}|${entry.text}`}>
          <b className={styles.legendGlyph} style={{ color: entry.color }}><SymbolGlyph type={entry.type} /></b>{entry.text}
        </li>)}
      </ul>}
    </section>}
    </div>
    {value.imageSource && <p className={styles.source}>Nguồn ảnh: {value.imageSource}</p>}
  </div>;
}

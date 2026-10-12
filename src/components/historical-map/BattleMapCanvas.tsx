"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Map, Minus, MoveHorizontal, Plus, RotateCcw, RotateCw } from "lucide-react";
import { clampPercent, isLineSymbol, isNoteSymbol, resolveEffect, SYMBOL_LABELS, SYMBOL_SIZE_MAX, SYMBOL_SIZE_MIN, type BattleMap, type BattleSymbol, type BattleSymbolType, type CameraRect } from "./battle-map.types";
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

export function BattleMapCanvas({ value, title, selectedId, selectedIds, placingType, placingColor, onSelect, onMove, onTransform, onAdd, onDelete, legendTitle, symbolView, focus, spotlight, cameraFrame, onDrawFrame, onMarquee, phaseBadge }: {
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
  onAdd?: (type: BattleSymbolType, x: number, y: number, shape?: { size: number; rotation: number }) => void;
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
  /** Press-and-drag drawing of a line symbol (start point in px relative to the plane). */
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const [drawPreview, setDrawPreview] = useState<{ x: number; y: number; size: number; rotation: number } | null>(null);
  /** Camera frame being dragged (start point and live area, in %). */
  const frameStart = useRef<{ x: number; y: number } | null>(null);
  const [framePreview, setFramePreview] = useState<CameraRect | null>(null);
  /** Centre, length and angle of the segment start→end, in the symbol's % units. */
  const segment = (clientX: number, clientY: number) => {
    const rect = plane.current!.getBoundingClientRect();
    const s = drawStart.current!;
    const ex = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ey = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const length = Math.hypot(ex - s.x, ey - s.y);
    return {
      length,
      x: Math.round((s.x + ex) / 2 / rect.width * 1000) / 10,
      y: Math.round((s.y + ey) / 2 / rect.height * 1000) / 10,
      size: Math.round(Math.max(SYMBOL_SIZE_MIN, Math.min(SYMBOL_SIZE_MAX, length / rect.width * 100)) * 10) / 10,
      rotation: ((Math.round(Math.atan2(ey - s.y, ex - s.x) * 180 / Math.PI) % 360) + 360) % 360,
    };
  };
  const ready = imageState.src === value.imageUrl && imageState.status === "ready";
  const failed = imageState.src === value.imageUrl && imageState.status === "error";
  const showSymbols = ready && value.mode === "custom";
  // At 100% the whole image fits the frame (width and height); zooming in past that scrolls.
  const fitWidth = viewportSize && aspect ? Math.floor(Math.min(viewportSize.w, viewportSize.h * aspect)) - 1 : null;

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
  const showTip = (symbol: BattleSymbol, e: React.PointerEvent) => {
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
  return <div className={styles.canvas}>
    <div className={styles.zoomTools} aria-label="Thu phóng lược đồ">
      <button type="button" aria-label="Thu nhỏ lược đồ" disabled={zoom === 1} onClick={() => setZoom(z => Math.max(1, z - .25))}><Minus size={16} /></button>
      <output>{Math.round(zoom * 100)}%</output>
      <button type="button" aria-label="Phóng to lược đồ" disabled={zoom === 3} onClick={() => setZoom(z => Math.min(3, z + .25))}><Plus size={16} /></button>
      <button type="button" aria-label="Khôi phục mức thu phóng" onClick={() => setZoom(1)}><RotateCcw size={16} /></button>
    </div>
    <div className={styles.stage}>
    <div ref={viewport} className={styles.viewport}>
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
            const rect = plane.current!.getBoundingClientRect();
            drawStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={e => {
            if (frameStart.current) { setFramePreview(rectBetween(frameStart.current, point(e.clientX, e.clientY))); return; }
            if (marqueeStart.current) { setMarquee(rectBetween(marqueeStart.current, point(e.clientX, e.clientY))); return; }
            if (!drawStart.current) return;
            const seg = segment(e.clientX, e.clientY);
            setDrawPreview(seg.length >= 8 ? seg : null);
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
            const seg = segment(e.clientX, e.clientY);
            drawStart.current = null; setDrawPreview(null);
            // A real drag draws the symbol; a plain click falls through to onClick placement.
            if (seg.length >= 8) { suppressClick.current = true; onAdd(placingType, seg.x, seg.y, { size: seg.size, rotation: seg.rotation }); }
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
          {drawPreview && placingType && <div className={styles.symbol} data-preview aria-hidden="true"
            style={{ left: `${drawPreview.x}%`, top: `${drawPreview.y}%`, width: `${drawPreview.size}%`, color: placingColor, transform: `translate(-50%, -50%) rotate(${drawPreview.rotation}deg)` }}>
            <SymbolGlyph type={placingType} />
          </div>}
          {showSymbols && value.symbols.map(symbol => {
            const view = symbolView?.(symbol) ?? {};
            if (view.hidden) return null;
            const faction = value.factions.find(f => f.id === symbol.factionId);
            return <button type="button" key={view.enter ? `${symbol.id}:${view.enter.key}` : symbol.id} className={styles.symbol} data-selected={isSelected(symbol.id)}
              data-dim={view.dim || undefined} data-fx={view.enter ? resolveEffect(symbol) : undefined}
              style={{ left: `${symbol.x}%`, top: `${symbol.y}%`, width: `${symbol.size}%`, color: faction?.color ?? "#b91c1c", transform: `translate(-50%, -50%) rotate(${symbol.rotation}deg)`, "--fx-delay": `${view.enter?.delay ?? 0}ms` } as React.CSSProperties}
              aria-label={`${SYMBOL_LABELS[symbol.type]}: ${symbol.label || faction?.name || "Chưa đặt tên"}`} aria-pressed={onSelect ? isSelected(symbol.id) : undefined}
              tabIndex={onSelect ? 0 : -1}
              // Pointer selection happens on press; a click only selects from the keyboard (Enter/Space).
              onClick={e => { e.stopPropagation(); if (!onMove || e.detail === 0) onSelect?.(symbol.id); }}
              onPointerDown={e => {
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
              }}
              onPointerEnter={e => showTip(symbol, e)}
              onPointerLeave={() => setTip(t => (t?.id === symbol.id ? null : t))}
              onPointerMove={e => {
                if (drag.current?.id !== symbol.id || !onMove) { showTip(symbol, e); return; }
                const p = point(e.clientX, e.clientY), d = drag.current;
                const dx = p.x - d.start.x, dy = p.y - d.start.y;
                if (!d.moved && Math.abs(dx) + Math.abs(dy) < .3) return;
                d.moved = true;
                for (const g of d.group) onMove(g.id, Math.round(clampPercent(g.x + dx) * 10) / 10, Math.round(clampPercent(g.y + dy) * 10) / 10);
              }}
              onPointerUp={() => {
                // A press without moving on a grouped symbol narrows the selection to it.
                if (drag.current && !drag.current.moved && drag.current.group.length > 1) onSelect?.(symbol.id);
                drag.current = null;
              }} onPointerCancel={() => { drag.current = null; }}
              onKeyDown={e => {
                if ((e.key === "Delete" || e.key === "Backspace") && onDelete) { e.preventDefault(); onDelete(symbol.id); return; }
                if (moveByKey(symbol, e.key, e.shiftKey ? 5 : 1)) e.preventDefault();
              }}>
              {symbol.type === "step" ? <SymbolGlyph type="step" text={symbol.label} />
                : symbol.type === "label" ? <span>{symbol.label}</span> : <SymbolGlyph type={symbol.type} />}
              {onTransform && selectedId === symbol.id && <>
                <i className={styles.rotateHandle} title="Kéo để xoay (giữ Shift để xoay theo bước 15°)" {...handleProps(symbol, "rotate")}><RotateCw /></i>
                <i className={styles.resizeHandle} title="Kéo để đổi kích thước" {...handleProps(symbol, "resize")}><MoveHorizontal /></i>
              </>}
            </button>;
          })}
          {showSymbols && phaseBadge && value.symbols.map(s => {
            const badge = !symbolView?.(s).hidden && phaseBadge(s);
            return badge ? <span key={`badge:${s.id}`} className={styles.phaseBadge} aria-hidden="true"
              style={{ left: `${Math.min(99, s.x + s.size * .4)}%`, top: `${s.y}%` }}>{badge}</span> : null;
          })}
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

// components/historical-map/battle-path.ts
// Geometry of line symbols (arrows, defence lines). They are drawn as real SVG paths in a plane where
// 1 unit = 1% of the image width on both axes (an image y% maps to y / aspect), so stroke weight and
// arrowheads stay the same whatever the length of the line, and the line can follow a curved route.

import type { BattleSymbol, BattleSymbolType, MapPoint } from "./battle-map.types";

interface LineStyle {
  width: number;
  head?: { length: number; half: number; open?: boolean };
  /** Dash and gap lengths. */
  dash?: [number, number];
  /** Marks along the left side of the line: triangles (defence line) or thin spikes (stakes). */
  teeth?: { every: number; size: number; base: number };
}

const LINE_STYLES: Partial<Record<BattleSymbolType, LineStyle>> = {
  arrow: { width: .65, head: { length: 2.2, half: 1.25 } },
  flank: { width: .5, head: { length: 1.9, half: 1.05 } },
  march: { width: .3, head: { length: 1.4, half: .8, open: true } },
  retreat: { width: .45, dash: [1.2, .8], head: { length: 1.8, half: 1 } },
  defenseLine: { width: .35, teeth: { every: 1.9, size: .9, base: .9 } },
  stakes: { width: .25, teeth: { every: 1.1, size: 1.3, base: .38 } },
};

export const LINE_WEIGHT_MIN = .5;
export const LINE_WEIGHT_MAX = 2.5;

type Pt = { x: number; y: number };
const fmt = (n: number) => Math.round(n * 100) / 100;
const polyline = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${fmt(p.x)} ${fmt(p.y)}`).join("");

/**
 * Control points of a line symbol in image %. Symbols saved before paths existed derive them from
 * centre, length (size, % of width) and angle, matching the stretched glyph they used to be drawn with.
 */
export function controlPoints(s: BattleSymbol, aspect: number): MapPoint[] {
  if (s.points && s.points.length >= 2) return s.points;
  const a = s.rotation * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
  // Along (u) and across (v, + = down at rotation 0) the line, in fractions of its length.
  const local: [number, number][] = s.type === "flank" ? [[-.44, .19], [-.02, -.12], [.44, .13]] : [[-.46, 0], [.46, 0]];
  return local.map(([u, v]) => ({
    x: s.x + (u * cos - v * sin) * s.size,
    y: s.y + (u * sin + v * cos) * s.size * aspect,
  }));
}

/** Catmull-Rom curve through the control points, as a dense polyline. */
function smooth(points: Pt[]): Pt[] {
  if (points.length < 3) return points;
  const out: Pt[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] ?? p2;
    const at = (t: number, k: "x" | "y") => .5 * (2 * p1[k] + (p2[k] - p0[k]) * t
      + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t);
    for (let step = 1; step <= 12; step++) out.push({ x: at(step / 12, "x"), y: at(step / 12, "y") });
  }
  return out;
}

const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const lengthOf = (pts: Pt[]) => pts.reduce((sum, p, i) => i ? sum + dist(pts[i - 1], p) : 0, 0);

/** Point and unit direction at distance `d` along the polyline. */
function along(pts: Pt[], d: number): { p: Pt; t: Pt } {
  let left = Math.max(0, d);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], seg = dist(a, b);
    if (seg === 0) continue;
    const t = { x: (b.x - a.x) / seg, y: (b.y - a.y) / seg };
    if (left <= seg || i === pts.length - 1) {
      const k = Math.min(left, seg);
      return { p: { x: a.x + t.x * k, y: a.y + t.y * k }, t };
    }
    left -= seg;
  }
  return { p: pts[0], t: { x: 1, y: 0 } };
}

/** The polyline cut `cut` units before its end. */
function trimEnd(pts: Pt[], cut: number): Pt[] {
  const total = lengthOf(pts);
  if (cut <= 0 || total <= cut) return pts;
  const keep = total - cut, out: Pt[] = [pts[0]];
  let run = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i - 1], pts[i]);
    if (run + seg >= keep) { out.push(along(pts, keep).p); break; }
    run += seg; out.push(pts[i]);
  }
  return out;
}

export interface LineGeometry {
  /** Whole route (selection outline, hit area, draw-in mask). */
  route: string;
  /** Stroked body, ending inside the arrowhead. */
  line: string;
  width: number;
  dash?: string;
  head?: string;
  headOpen?: boolean;
  teeth?: string;
}

export function lineGeometry(s: BattleSymbol, aspect: number): LineGeometry {
  const style = LINE_STYLES[s.type] ?? LINE_STYLES.arrow!;
  const k = s.weight ?? 1;
  const pts = smooth(controlPoints(s, aspect).map(p => ({ x: p.x, y: p.y / aspect })));
  const total = lengthOf(pts);
  const geometry: LineGeometry = { route: polyline(pts), line: polyline(pts), width: style.width * k };
  if (style.dash) geometry.dash = `${fmt(style.dash[0] * k)} ${fmt(style.dash[1] * k)}`;
  if (style.head) {
    // Short lines get a proportionally smaller head so the shaft never disappears.
    const length = Math.min(style.head.length * k, total * .45), half = style.head.half * k * length / (style.head.length * k);
    const tip = pts[pts.length - 1];
    const { p: base, t } = along(pts, total - length);
    const dir = dist(base, tip) > 0 ? { x: (tip.x - base.x) / dist(base, tip), y: (tip.y - base.y) / dist(base, tip) } : t;
    const n = { x: -dir.y, y: dir.x };
    const left = { x: tip.x - dir.x * length + n.x * half, y: tip.y - dir.y * length + n.y * half };
    const right = { x: tip.x - dir.x * length - n.x * half, y: tip.y - dir.y * length - n.y * half };
    geometry.headOpen = style.head.open;
    geometry.head = style.head.open ? polyline([left, tip, right]) : `${polyline([left, tip, right])}Z`;
    if (!style.head.open) geometry.line = polyline(trimEnd(pts, length * .7));
  }
  if (style.teeth) {
    const every = style.teeth.every * k, size = style.teeth.size * k, base = style.teeth.base * k / 2;
    let d = "";
    for (let at = every / 2; at < total; at += every) {
      const { p, t } = along(pts, at);
      // Left of the direction of drawing (y grows downwards).
      const n = { x: t.y, y: -t.x };
      d += `${polyline([{ x: p.x - t.x * base, y: p.y - t.y * base }, { x: p.x + n.x * size, y: p.y + n.y * size }, { x: p.x + t.x * base, y: p.y + t.y * base }])}Z`;
    }
    geometry.teeth = d;
  }
  return geometry;
}

/** Bounding box of a line symbol in image %. */
export function pointsRect(points: MapPoint[]) {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** Ramer–Douglas–Peucker: keeps the corners of a freehand stroke, drops the jitter. */
export function simplify(points: MapPoint[], aspect: number, epsilon = .7): MapPoint[] {
  if (points.length < 3) return points;
  const plane = points.map(p => ({ x: p.x, y: p.y / aspect }));
  const keep = new Set([0, points.length - 1]);
  const visit = (from: number, to: number) => {
    const a = plane[from], b = plane[to], len = dist(a, b);
    let worst = -1, worstDist = epsilon;
    for (let i = from + 1; i < to; i++) {
      const p = plane[i];
      const d = len === 0 ? dist(a, p) : Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / len;
      if (d > worstDist) { worst = i; worstDist = d; }
    }
    if (worst !== -1) { keep.add(worst); visit(from, worst); visit(worst, to); }
  };
  visit(0, points.length - 1);
  return points.filter((_, i) => keep.has(i));
}

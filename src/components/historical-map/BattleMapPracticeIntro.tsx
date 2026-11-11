"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, Eye, PenLine, Star, Target, Trophy, X } from "lucide-react";
import { SymbolGlyph } from "./BattleMapCanvas";
import { COMPARE_FACTIONS, pickPreviewSymbols } from "./battle-map-practice";
import { PRACTICE_RANK_FLOORS, practiceRank, type PracticeRecord } from "./battle-map-practice-progress";
import { controlPoints, lineGeometry } from "./battle-path";
import { isLineSymbol, type BattleMap, type BattleSymbol } from "./battle-map.types";
import styles from "./battle-map-practice-intro.module.css";

type Scene = "watch" | "hide" | "draw" | "score";

const TICK_MS = 650;
const WATCH_TICKS = 5;
const HIDE_TICKS = 3;
const SCORE_TICKS = 8;

const CAPTIONS: Record<Scene, string> = {
  watch: "Xem kỹ vị trí các cánh quân",
  hide: "Lược đồ gốc tạm ẩn đi",
  draw: "Bạn vẽ lại theo trí nhớ",
  score: "Chấm ngay: đúng, gần đúng, còn thiếu",
};
const STEP_OF_SCENE: Record<Scene, number> = { watch: 0, hide: 1, draw: 1, score: 2 };

const STEPS = [
  { icon: Eye, title: "Xem kỹ", text: "Nhớ vị trí các cánh quân và hướng tiến công." },
  { icon: PenLine, title: "Vẽ lại theo trí nhớ", text: "Đặt ký hiệu, kéo mũi tên lên bản đồ trống." },
  { icon: Target, title: "So sánh và nhận hạng", text: "Thấy ngay chỗ đúng, chỗ thiếu và điểm của bạn." },
];

const colorOf = (id: string) => COMPARE_FACTIONS.find(f => f.id === id)?.color;
const formatPercent = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });

/** Which part of the looping demo a tick falls on, and how many symbols have been redrawn. */
function frameAt(tick: number, count: number): { scene: Scene; drawn: number } {
  const t = tick % (WATCH_TICKS + HIDE_TICKS + count + SCORE_TICKS);
  // While watching, symbols come in one per tick; the last ones arrive together so the short scene shows them all.
  if (t < WATCH_TICKS) return { scene: "watch", drawn: t >= WATCH_TICKS - 2 ? count : t + 1 };
  if (t < WATCH_TICKS + HIDE_TICKS) return { scene: "hide", drawn: 0 };
  if (t < WATCH_TICKS + HIDE_TICKS + count) return { scene: "draw", drawn: t - WATCH_TICKS - HIDE_TICKS + 1 };
  return { scene: "score", drawn: count };
}

/** The demo's result: the last symbol is missed and the one before it is close, so every colour gets shown. */
function demoStatus(index: number, count: number) {
  if (count >= 3 && index === count - 1) return "cmp-missed";
  if (count >= 4 && index === count - 2) return "cmp-partial";
  return "cmp-correct";
}

function demoPercent(count: number) {
  const statuses = Array.from({ length: count }, (_, i) => demoStatus(i, count));
  const earned = statuses.reduce((sum, s) => sum + (s === "cmp-correct" ? 1 : s === "cmp-partial" ? .6 : 0), 0);
  return Math.round((earned / count) * 100);
}

/** Where the pen rests once a symbol is done: the arrow tip, or the centre of a unit. */
function penAnchor(symbol: BattleSymbol, aspect: number) {
  if (!isLineSymbol(symbol.type)) return { x: symbol.x, y: symbol.y / aspect };
  const points = controlPoints(symbol, aspect);
  const end = points[points.length - 1];
  return { x: end.x, y: end.y / aspect };
}

function PreviewSymbol({ symbol, aspect, visible, color }: { symbol: BattleSymbol; aspect: number; visible: boolean; color: string | undefined }) {
  if (isLineSymbol(symbol.type)) {
    const geometry = lineGeometry(symbol, aspect);
    return <g className={styles.symbol} data-visible={visible} style={{ color }}>
      <path className={styles.route} d={geometry.route} pathLength={1} strokeWidth={Math.max(geometry.width * 1.6, .9)} />
      {geometry.head && <path className={styles.tip} d={geometry.head} fill={geometry.headOpen ? "none" : "currentColor"}
        stroke={geometry.headOpen ? "currentColor" : "none"} strokeWidth={.6} />}
      {geometry.teeth && <path className={styles.tip} d={geometry.teeth} fill="currentColor" />}
    </g>;
  }
  const width = Math.max(symbol.size, 8) * 1.2;
  const height = width / 2;
  return <g className={styles.symbol} data-visible={visible} style={{ color }}>
    <g className={styles.unit}>
      <svg x={symbol.x - width / 2} y={symbol.y / aspect - height / 2} width={width} height={height} overflow="visible">
        <SymbolGlyph type={symbol.type} />
      </svg>
    </g>
  </g>;
}

/** Looping demo played with this battle's own background and symbols. */
function PracticeDemo({ map, onScene }: { map: BattleMap; onScene: (scene: Scene) => void }) {
  const symbols = useMemo(() => pickPreviewSymbols(map), [map]);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [aspect, setAspect] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const image = new window.Image();
    const done = (value: number) => { if (!cancelled) setAspect(value); };
    image.onload = () => done(image.naturalWidth > 0 && image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : 1);
    image.onerror = () => done(1.6);
    image.src = map.imageUrl;
    return () => { cancelled = true; };
  }, [map.imageUrl]);

  useEffect(() => {
    if (reduced || aspect === null) return;
    const id = window.setInterval(() => setTick(t => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [reduced, aspect]);

  // With reduced motion the demo rests on its last scene, which explains the outcome in one still picture.
  const { scene, drawn } = reduced
    ? { scene: "score" as Scene, drawn: symbols.length }
    : frameAt(tick, symbols.length);

  useEffect(() => { onScene(scene); }, [scene, onScene]);

  const percent = demoPercent(symbols.length);
  const rank = practiceRank(percent);
  // The pen keeps its last place while hidden, so it never slides in from the corner of the map.
  const penAt = aspect !== null ? penAnchor(symbols[Math.max(drawn, 1) - 1], aspect) : null;

  // The stage takes the shape of the image, within limits so a very tall or wide map cannot push the buttons away.
  return <div className={styles.stage} data-scene={scene}
    style={{ backgroundImage: `url(${JSON.stringify(map.imageUrl)})`, aspectRatio: aspect !== null ? Math.min(2, Math.max(1.1, aspect)) : undefined }}
    role="img" aria-label="Minh họa: xem lược đồ, lược đồ ẩn đi, vẽ lại theo trí nhớ, rồi chấm điểm.">
    {aspect !== null && <svg className={styles.plane} viewBox={`0 0 100 ${100 / aspect}`} aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {symbols.map((symbol, i) => {
        const visible = i < drawn;
        const color = scene === "score" ? colorOf(demoStatus(i, symbols.length)) : map.factions.find(f => f.id === symbol.factionId)?.color;
        return <PreviewSymbol key={symbol.id} symbol={symbol} aspect={aspect} visible={visible} color={color} />;
      })}
      <g className={styles.pen} data-show={scene === "draw"} style={penAt ? { transform: `translate(${penAt.x}px, ${penAt.y}px)` } : undefined}>
        <PenLine x={0} y={-6} width={6} height={6} strokeWidth={2.2} />
      </g>
    </svg>}

    <span key={scene} className={styles.caption}>{CAPTIONS[scene]}</span>

    {scene === "score" && <div className={styles.scoreBadge}>
      <small>Ví dụ</small>
      <strong>{percent}%</strong>
      <span className={styles.scoreStars} aria-hidden="true">
        {[0, 1, 2].map(i => <Star key={i} size={13} className={i < rank.stars ? styles.scoreStarOn : undefined} style={{ animationDelay: `${200 + i * 140}ms` }} />)}
      </span>
      <b>{rank.title}</b>
    </div>}
  </div>;
}

/** Explains "Thử thách trí nhớ" before the learner starts drawing: what happens, why, and what they can earn. */
export function BattleMapPracticeIntro({ title, map, symbolCount, record, hasDraft, canReplay, onStart, onReplay, onClose }: {
  /** Event title. */
  title: string;
  map: BattleMap;
  /** Graded symbols in the original map. */
  symbolCount: number;
  record: PracticeRecord | null;
  /** An unfinished drawing is waiting in this browser. */
  hasDraft: boolean;
  /** The battle has a story to play again. */
  canReplay: boolean;
  onStart: () => void;
  onReplay: () => void;
  onClose: () => void;
}) {
  const [scene, setScene] = useState<Scene>("watch");
  const activeStep = STEP_OF_SCENE[scene];
  const currentRank = record ? practiceRank(record.best).title : null;
  const startLabel = hasDraft ? "Vẽ tiếp bài đang dở" : record ? "Phá kỷ lục" : "Bắt đầu thử thách";

  return <div className={styles.backdrop}>
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="practice-intro-title">
      <button type="button" className={styles.close} onClick={onClose} aria-label="Đóng"><X size={18} /></button>

      <header className={styles.head}>
        <p className={styles.eyebrow}><Brain size={15} aria-hidden="true" />Thử thách trí nhớ</p>
        <h1 id="practice-intro-title">Bạn nhớ được bao nhiêu về {title}?</h1>
        <p className={styles.lead}>Lược đồ gốc sẽ tạm ẩn đi. Hãy vẽ lại các cánh quân và mũi tiến công lên bản đồ trống, rồi xem mình nhớ đúng bao nhiêu phần trăm.</p>
      </header>

      <div className={styles.visual}>
        <PracticeDemo map={map} onScene={setScene} />
        <ul className={styles.ranks} aria-label="Các hạng có thể đạt">
          {PRACTICE_RANK_FLOORS.map(floor => {
            const rank = practiceRank(floor);
            return <li key={floor} data-current={rank.title === currentRank || undefined}>
              <span className={styles.rankStars} aria-label={`${rank.stars} sao`}>
                {rank.stars === 0 ? <span className={styles.rankDot} /> : Array.from({ length: rank.stars }, (_, i) => <Star key={i} size={11} aria-hidden="true" />)}
              </span>
              <b>{rank.title}</b>
              <small>{floor === 0 ? "Khởi đầu" : `Từ ${floor}%`}</small>
            </li>;
          })}
        </ul>
      </div>

      <div className={styles.body}>
        <ol className={styles.steps}>
          {STEPS.map((step, i) => <li key={step.title} data-active={activeStep === i || undefined}>
            <span className={styles.stepIcon}><step.icon size={18} aria-hidden="true" /></span>
            <span><b>{step.title}</b><small>{step.text}</small></span>
          </li>)}
        </ol>

        {record && <p className={styles.record}>
          <Trophy size={15} aria-hidden="true" />
          <span>Kỷ lục của bạn <b>{formatPercent(record.best)}%</b>, hạng <b>{currentRank}</b>, sau {record.attempts} lần thử.</span>
        </p>}

        <p className={styles.rules}>
          Có <b>{symbolCount} ký hiệu</b> cần nhớ. Vẽ thiếu hay vẽ thừa đều giảm điểm, mũi tên phải đúng chiều.
          Lược đồ gốc không bị xóa, bạn làm lại bao nhiêu lần cũng được.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} autoFocus onClick={onStart}><PenLine size={17} aria-hidden="true" />{startLabel}</button>
          <button type="button" onClick={canReplay ? onReplay : onClose}>{canReplay ? "Xem lại trận đánh" : "Để sau"}</button>
        </div>
      </div>
    </section>
  </div>;
}

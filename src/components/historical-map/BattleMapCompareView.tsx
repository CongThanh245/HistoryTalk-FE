"use client";

import { useEffect, useMemo, useState } from "react";
import { Flag, PenLine, RotateCcw, Star, Trophy, TrendingDown, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { BattleMapCanvas } from "./BattleMapCanvas";
import { buildCompareMap, COMPARE_FACTIONS } from "./battle-map-practice";
import { missingHints, nextRankAt, practiceRank, type PracticeRecord } from "./battle-map-practice-progress";
import { CORRECT_SCORE, type BattleMapScore } from "./battle-map-scoring";
import type { BattleMap } from "./battle-map.types";
import styles from "./battle-map-compare.module.css";

const colorOf = (id: string) => COMPARE_FACTIONS.find(f => f.id === id)?.color;
const formatPercent = (n: number) => n.toLocaleString("vi-VN", { maximumFractionDigits: 1 });

type View = "overlay" | "yours" | "answer";
const VIEWS: { id: View; label: string }[] = [
  { id: "overlay", label: "Chồng lên" },
  { id: "yours", label: "Bài của bạn" },
  { id: "answer", label: "Lược đồ gốc" },
];

/** Counts up to `target` once; jumps straight there when the person prefers less motion. */
function useCountUp(target: number, durationMs = 900) {
  const [reduced] = useState(() => typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [value, setValue] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduced]);
  return value;
}

const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** "Kết quả so sánh": score and rank, progress against earlier tries, what is missing, and the maps side by side. */
export function BattleMapCompareView({ title, answer, attempt, score, progress, onContinue, onRestart, onClose }: {
  /** Event title. */
  title: string;
  answer: BattleMap;
  attempt: BattleMap;
  score: BattleMapScore;
  /** This browser's record before and after this comparison. */
  progress?: { previous: PracticeRecord | null; record: PracticeRecord };
  /** "Vẽ tiếp": back to the drawing. */
  onContinue: () => void;
  /** "Làm lại": a blank sheet. */
  onRestart: () => void;
  /** "Đóng": back to the battle page. */
  onClose: () => void;
}) {
  const [view, setView] = useState<View>("overlay");
  const compareMap = useMemo(() => buildCompareMap(answer, attempt, score), [answer, attempt, score]);
  const hints = useMemo(() => missingHints(answer, score), [answer, score]);
  const correct = score.matches.filter(m => m.score >= CORRECT_SCORE).length;
  const partial = score.matches.length - correct;
  const rank = practiceRank(score.percent);
  const nextAt = nextRankAt(score.percent);
  const shown = useCountUp(score.percent);

  const previous = progress?.previous ?? null;
  const isNewBest = !!progress && score.percent > 0 && (!previous || score.percent > previous.best);
  const delta = previous ? Math.round((score.percent - previous.last) * 10) / 10 : null;

  // Esc goes back to the drawing; captured so the editor underneath does not close as well.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopImmediatePropagation();
      onContinue();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onContinue]);

  const stats = [
    { id: "cmp-correct", label: "Đúng", value: correct, hint: "Đúng loại, đúng phe, đúng chỗ." },
    { id: "cmp-partial", label: "Gần đúng", value: partial, hint: "Lệch vị trí, khác loại cùng nhóm hoặc khác phe." },
    { id: "cmp-missed", label: "Thiếu", value: score.missedIds.length, hint: "Có trong lược đồ gốc, bạn chưa vẽ." },
    { id: "cmp-extra", label: "Thừa / sai", value: score.extraIds.length, hint: "Bạn vẽ nhưng lược đồ gốc không có ở đó." },
  ];

  const canvas = view === "answer"
    ? <BattleMapCanvas key="answer" value={answer} title={`Lược đồ gốc ${title}`} />
    : view === "yours"
      ? <BattleMapCanvas key="yours" value={attempt} title={`Bài vẽ của bạn ${title}`} />
      : <BattleMapCanvas key="overlay" value={compareMap} title={`So sánh lược đồ ${title}`} legendTitle="Chú giải so sánh" legendDefaultOpen={false}
        symbolView={s => ({ dim: s.factionId === "cmp-answer" })} />;

  return <section className={styles.compare} role="dialog" aria-modal="true" aria-labelledby="battle-compare-title">
    <header className={styles.header}>
      <div className={styles.headerTitle}>
        <h1 id="battle-compare-title">Kết quả so sánh</h1>
        <p>{title}</p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} autoFocus onClick={onContinue}><PenLine size={15} />Vẽ tiếp</button>
        <button type="button" onClick={onRestart}><RotateCcw size={15} />Làm lại</button>
        <button type="button" onClick={onClose}><X size={15} />Đóng</button>
      </div>
    </header>

    <div className={styles.layout}>
      <aside className={styles.summary}>
        <div className={cn(styles.hero, styles[`tier${rank.stars}`])}>
          <div className={styles.ring} role="img" aria-label={`${formatPercent(score.percent)}% chính xác`}>
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle className={styles.ringTrack} cx="60" cy="60" r={RING_RADIUS} />
              <circle className={styles.ringValue} cx="60" cy="60" r={RING_RADIUS}
                strokeDasharray={RING_LENGTH} strokeDashoffset={RING_LENGTH * (1 - shown / 100)} />
            </svg>
            <span className={styles.ringLabel} aria-hidden="true">
              <span><strong>{Math.round(shown)}</strong><small>%</small></span>
            </span>
          </div>

          <div className={styles.rank}>
            <span className={styles.stars} aria-label={`${rank.stars} trên 3 sao`}>
              {[0, 1, 2].map(i => <Star key={i} size={20} aria-hidden="true"
                className={cn(styles.star, i < rank.stars && styles.starOn)} style={{ animationDelay: `${700 + i * 160}ms` }} />)}
            </span>
            <p className={styles.rankTitle}>{rank.title}</p>
            <p className={styles.rankMessage}>{rank.message}</p>
          </div>

          {isNewBest && <span className={styles.newBest}><Trophy size={14} aria-hidden="true" />Kỷ lục mới!</span>}
        </div>

        <div className={styles.progressRow}>
          {delta !== null && delta !== 0 && <span className={cn(styles.chip, delta > 0 ? styles.chipUp : styles.chipDown)}>
            {delta > 0 ? <TrendingUp size={13} aria-hidden="true" /> : <TrendingDown size={13} aria-hidden="true" />}
            {delta > 0 ? "+" : ""}{formatPercent(delta)}% so với lần trước
          </span>}
          {progress && <span className={styles.chip}><Trophy size={13} aria-hidden="true" />Kỷ lục {formatPercent(progress.record.best)}%</span>}
          {progress && <span className={styles.chip}>Lần thử {progress.record.attempts}</span>}
        </div>

        {nextAt !== null && <div className={styles.next}>
          <div className={styles.nextBar}><span style={{ width: `${Math.min(100, (score.percent / nextAt) * 100)}%` }} /></div>
          <p>Còn <b>{formatPercent(Math.max(0.1, nextAt - score.percent))}%</b> nữa để lên hạng <b>{practiceRank(nextAt).title}</b>.</p>
        </div>}

        <ul className={styles.stats}>
          {stats.map(s => <li key={s.id} className={styles.stat} style={{ "--dot": colorOf(s.id) } as React.CSSProperties} title={s.hint}>
            <b>{s.value}</b><span><i aria-hidden="true" />{s.label}</span>
          </li>)}
        </ul>

        {hints.length > 0 && <div className={styles.hints}>
          <h2><Flag size={14} aria-hidden="true" />Lược đồ gốc còn có</h2>
          <ul>
            {hints.slice(0, 5).map(h => <li key={h.key}>
              <span className={styles.hintCount}>{h.count}×</span>
              <span>{h.label}{h.faction && <> <em style={{ color: h.color ?? undefined }}>· {h.faction}</em></>}</span>
            </li>)}
            {hints.length > 5 && <li className={styles.hintMore}>và {hints.length - 5} nhóm khác, xem các ký hiệu đỏ trên lược đồ.</li>}
          </ul>
        </div>}

        <p className={styles.note}>
          Điểm tính trên {score.answerCount} ký hiệu của lược đồ gốc và {score.attemptCount} ký hiệu bạn vẽ: vẽ thiếu hay vẽ thừa
          đều làm giảm điểm. Chữ và số thứ tự bước không được chấm. Mũi tên phải vẽ đúng chiều.
        </p>
      </aside>

      <div className={styles.canvasWrap}>
        <div className={styles.viewSwitch} role="group" aria-label="Xem lược đồ">
          {VIEWS.map(v => <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)}>{v.label}</button>)}
        </div>
        <div className={styles.canvas}>{canvas}</div>
      </div>
    </div>
  </section>;
}

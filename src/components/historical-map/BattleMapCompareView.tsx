"use client";

import { useEffect, useMemo } from "react";
import { PenLine, RotateCcw, X } from "lucide-react";
import { BattleMapCanvas } from "./BattleMapCanvas";
import { buildCompareMap, COMPARE_FACTIONS } from "./battle-map-practice";
import { CORRECT_SCORE, type BattleMapScore } from "./battle-map-scoring";
import type { BattleMap } from "./battle-map.types";
import styles from "./battle-map-compare.module.css";

const colorOf = (id: string) => COMPARE_FACTIONS.find(f => f.id === id)?.color;

function verdict(percent: number) {
  if (percent >= 90) return "Rất sát lược đồ gốc.";
  if (percent >= 70) return "Khá đúng, còn vài chỗ lệch.";
  if (percent >= 40) return "Đúng một phần. Xem các ký hiệu đỏ để biết còn thiếu gì.";
  return "Còn khác nhiều so với lược đồ gốc. Thử vẽ tiếp theo các ký hiệu đỏ.";
}

/** "Kết quả so sánh": score, counts by status and the two maps drawn on top of each other. */
export function BattleMapCompareView({ title, answer, attempt, score, onContinue, onRestart, onClose }: {
  /** Event title. */
  title: string;
  answer: BattleMap;
  attempt: BattleMap;
  score: BattleMapScore;
  /** "Vẽ tiếp": back to the drawing. */
  onContinue: () => void;
  /** "Làm lại": a blank sheet. */
  onRestart: () => void;
  /** "Đóng": back to the battle page. */
  onClose: () => void;
}) {
  const compareMap = useMemo(() => buildCompareMap(answer, attempt, score), [answer, attempt, score]);
  const correct = score.matches.filter(m => m.score >= CORRECT_SCORE).length;
  const partial = score.matches.length - correct;

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
        <p className={styles.score}><strong>{score.percent.toLocaleString("vi-VN")}</strong><span>% chính xác</span></p>
        <p className={styles.verdict}>{verdict(score.percent)}</p>
        <ul className={styles.stats}>
          {stats.map(s => <li key={s.id} className={styles.stat} style={{ "--dot": colorOf(s.id) } as React.CSSProperties}>
            <i aria-hidden="true" /><span>{s.label}</span><b>{s.value}</b><small>{s.hint}</small>
          </li>)}
          <li className={styles.stat} style={{ "--dot": colorOf("cmp-answer") } as React.CSSProperties}>
            <i aria-hidden="true" /><span>Đáp án (mờ)</span><b>{score.matches.length}</b>
            <small>Ký hiệu gốc bạn đã vẽ trúng, hiện mờ bên dưới để đối chiếu.</small>
          </li>
        </ul>
        <p className={styles.note}>
          Điểm tính trên {score.answerCount} ký hiệu của lược đồ gốc và {score.attemptCount} ký hiệu bạn vẽ: vẽ thiếu hay vẽ thừa
          đều làm giảm điểm. Chữ và số thứ tự bước không được chấm. Mũi tên phải vẽ đúng chiều.
        </p>
      </aside>

      <div className={styles.canvas}>
        <BattleMapCanvas value={compareMap} title={`So sánh lược đồ ${title}`} legendTitle="Chú giải so sánh"
          symbolView={s => ({ dim: s.factionId === "cmp-answer" })} />
      </div>
    </div>
  </section>;
}

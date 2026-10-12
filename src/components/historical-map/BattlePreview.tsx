"use client";

// components/historical-map/BattlePreview.tsx
// Plays the map being edited, as learners will see it, without saving it.

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { BattleMapCanvas } from "./BattleMapCanvas";
import type { BattleMap } from "./battle-map.types";
import { useBattleStory } from "./useBattlePlayback";
import styles from "./battle-experience.module.css";

export function BattlePreview({ value, title, legacyNarration, startScene = 0, onClose }: {
  value: BattleMap;
  title: string;
  legacyNarration: string;
  /** Phase to start from (the one being edited). */
  startScene?: number;
  onClose: () => void;
}) {
  const [muted, setMuted] = useState(false);
  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const story = useBattleStory(value, legacyNarration, { voice: !muted && speechSupported });
  const { narration, phases, scenes, scene, sentences } = story;

  // Opened from a click: start playing right away from the phase being edited.
  const { seek, play } = narration;
  useEffect(() => { seek(startScene); play(); }, [seek, play, startScene]);

  // Esc closes the preview only; the editor underneath must not see it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault(); e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return <div className={styles.preview} role="dialog" aria-modal="true" aria-label="Xem trước lược đồ">
    <header className={styles.previewBar}>
      <span className={styles.previewBadge}>Xem trước · chưa lưu</span>
      <strong>{title}</strong>
      <button type="button" className={styles.audioIconBtn} onClick={onClose} aria-label="Đóng xem trước" title="Đóng (Esc)"><X size={16} /></button>
    </header>

    <div className={styles.previewScene}>
      <BattleMapCanvas value={value} title={title} legendTitle={title}
        symbolView={story.symbolView} focus={story.focus} spotlight={story.spotlight} />
      {narration.started && phases.length > 0 && scene && <section className={styles.sceneCaption} aria-live="polite">
        <span className={styles.sceneEyebrow}>Giai đoạn {narration.scene + 1} / {phases.length}</span>
        <h2>{scene.title}</h2>
        {sentences.length > 0 && <p>{sentences.map((text, i) => <span key={i} data-state={i < narration.sentence || narration.finished ? "done" : i === narration.sentence ? "now" : undefined}>{text} </span>)}</p>}
      </section>}
    </div>

    <div className={styles.immersiveAudio}>
      <div className={styles.audioControls}>
        <button type="button" onClick={narration.restart} className={styles.audioIconBtn} title="Phát lại từ đầu" aria-label="Phát lại từ đầu"><RotateCcw size={14} /></button>
        <button type="button" onClick={narration.toggle} disabled={!story.hasStory} className={styles.audioPlayBtn} aria-label={narration.playing ? "Dừng" : "Phát"}>
          {narration.playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        <button type="button" onClick={() => setMuted(m => !m)} className={styles.audioIconBtn} title={muted ? "Bật âm thanh" : "Tắt âm thanh"} aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}>
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>
      <div className={styles.audioContent}>
        <div className={styles.audioSegments}>
          {scenes.map((sc, i) => <button key={sc.id} type="button" className={styles.audioSegment} style={{ flexGrow: story.sceneWeights[i] }}
            aria-current={narration.started && i === narration.scene ? "step" : undefined}
            aria-label={scenes.length > 1 ? `Giai đoạn ${i + 1}: ${sc.title}` : "Từ đầu"} title={sc.title}
            disabled={!story.hasStory} onClick={() => narration.seek(i)}>
            <span className={styles.audioTrack}><span className={styles.audioFill} style={{ width: `${story.sceneProgress(i) * 100}%` }} /></span>
            {scenes.length > 1 && <small>{sc.title}</small>}
          </button>)}
        </div>
        {!story.hasStory && <span className={styles.audioHint}>Chưa có lời thuyết minh: thêm ở cột phải của editor.</span>}
        {narration.started && phases.length === 0 && sentences[narration.sentence] && (
          <p className={styles.audioCaption} aria-live="polite">{sentences[narration.sentence]}</p>
        )}
      </div>
    </div>
  </div>;
}

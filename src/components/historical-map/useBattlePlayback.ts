"use client";

// components/historical-map/useBattlePlayback.ts
// Plays a battle scene by scene. Each narration sentence is spoken as its own utterance and the
// next one starts on its real `onend`, so captions and map phases follow the voice exactly
// instead of an estimated duration. Without a voice (muted, unsupported) sentences advance on a timer.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SymbolView } from "./BattleMapCanvas";
import type { BattleMap, BattleSymbol } from "./battle-map.types";

export interface PlaybackScene { id: string; text: string }

/** Sentences are the unit of speech, caption highlight and progress. */
export function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?…;])\s+|\n+/).map(s => s.trim()).filter(Boolean);
}

/** Reading time for the silent mode and the progress estimate (~70 ms per character in Vietnamese). */
export const estimateMs = (sentence: string) => Math.max(1800, sentence.length * 70);
/** A scene without narration still holds long enough for its symbols to appear. */
const SILENT_SCENE_MS = 3500;

export const sceneDurationMs = (text: string) => {
  const sentences = splitSentences(text);
  return sentences.length ? sentences.reduce((sum, s) => sum + estimateMs(s), 0) : SILENT_SCENE_MS;
};

interface PlaybackState { scene: number; sentence: number; playing: boolean; started: boolean; finished: boolean }
const INITIAL: PlaybackState = { scene: 0, sentence: 0, playing: false, started: false, finished: false };

export function useBattlePlayback(scenes: PlaybackScene[], { voice }: { voice: boolean }) {
  const [state, setState] = useState(INITIAL);
  /** Estimated progress through the current sentence (0–1), for the progress bar only. */
  const [fraction, setFraction] = useState(0);
  const scenesRef = useRef(scenes);
  useEffect(() => { scenesRef.current = scenes; });
  const textsKey = scenes.map(s => s.text).join("\u0000");
  // Edits that remove scenes must not leave the cursor past the end.
  const scene = Math.min(state.scene, Math.max(0, scenes.length - 1));

  const advance = useCallback(() => setState(s => {
    const count = splitSentences(scenesRef.current[s.scene]?.text ?? "").length;
    if (s.sentence + 1 < count) return { ...s, sentence: s.sentence + 1 };
    if (s.scene + 1 < scenesRef.current.length) return { ...s, scene: s.scene + 1, sentence: 0 };
    return { ...s, playing: false, finished: true };
  }), []);

  // Speaks (or times) the current sentence while playing; any change of position cancels it.
  useEffect(() => {
    if (!state.playing) return;
    const sentence = splitSentences(scenesRef.current[scene]?.text ?? "")[state.sentence];
    const duration = sentence ? estimateMs(sentence) : SILENT_SCENE_MS;
    const start = performance.now();
    let done = false;
    let timer: number | undefined;
    const finish = () => { if (!done) { done = true; advance(); } };

    let raf = 0;
    const tick = () => {
      setFraction(Math.min(.97, (performance.now() - start) / duration));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (voice && sentence && synth) {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = "vi-VN";
      utterance.rate = .9;
      utterance.onend = finish;
      // A voice that fails mid-way falls back to the timer instead of stalling the battle.
      utterance.onerror = e => {
        if (e.error !== "interrupted" && e.error !== "canceled") timer = window.setTimeout(finish, Math.max(0, duration - (performance.now() - start)));
      };
      synth.cancel();
      synth.speak(utterance);
      // Some browsers drop `onend`; never wait much longer than the sentence could take.
      timer = window.setTimeout(finish, duration * 2.5 + 4000);
    } else {
      timer = window.setTimeout(finish, duration);
    }

    return () => {
      done = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      synth?.cancel();
    };
  }, [state.playing, scene, state.sentence, voice, textsKey, advance]);

  const play = useCallback(() => {
    setFraction(0);
    setState(s => s.finished ? { ...INITIAL, playing: true, started: true } : { ...s, playing: true, started: true });
  }, []);
  const pause = useCallback(() => setState(s => ({ ...s, playing: false })), []);
  const toggle = useCallback(() => (state.playing ? pause() : play()), [state.playing, pause, play]);
  const restart = useCallback(() => { setFraction(0); setState({ ...INITIAL, playing: true, started: true }); }, []);
  /** Jumps to the start of a scene, keeping the play/pause state. */
  const seek = useCallback((scene: number) => {
    setFraction(0);
    setState(s => ({ ...s, scene, sentence: 0, started: true, finished: false }));
  }, []);

  return { ...state, scene, fraction, play, pause, toggle, restart, seek };
}

/**
 * Everything a playback screen needs for one battle map: scenes, the playback cursor and how the
 * map should look right now (symbol states, camera). Shared by the battle page and the editor preview.
 */
export function useBattleStory(battleMap: BattleMap, legacyNarration: string, { voice }: { voice: boolean }) {
  const phases = useMemo(() => battleMap.phases ?? [], [battleMap.phases]);
  const legacy = legacyNarration.trim();
  // One scene per phase, or the whole map with the old narration for maps without phases.
  const scenes = useMemo(() => phases.length
    ? phases.map(p => ({ id: p.id, title: p.title, text: p.narration }))
    : [{ id: "all", title: "Diễn biến trận đánh", text: legacy }], [phases, legacy]);
  const narration = useBattlePlayback(scenes, { voice });
  const scene = scenes[narration.scene];
  const sentences = splitSentences(scene?.text ?? "");
  const phaseOf = (symbol: BattleSymbol) => symbol.phaseId ? phases.findIndex(p => p.id === symbol.phaseId) : -1;
  const sceneSymbols = phases.length ? battleMap.symbols.filter(s => phaseOf(s) === narration.scene) : [];
  // Before the first play the whole map shows, so the page is complete at rest.
  const symbolView = phases.length && narration.started ? (s: BattleSymbol): SymbolView => {
    const i = phaseOf(s);
    if (i === -1) return {};
    if (i < narration.scene) return { dim: true };
    if (i > narration.scene) return { hidden: true };
    return { enter: { delay: 500 + sceneSymbols.indexOf(s) * 450, key: String(narration.scene) } };
  } : undefined;
  const currentPhase = narration.started ? phases[narration.scene] : undefined;
  const spotlight = currentPhase?.camera === "frame" ? currentPhase.focus ?? null : null;
  const focus = !phases.length ? undefined : spotlight ?? (currentPhase?.camera === "auto" ? sceneSymbols : null);
  const sceneWeights = scenes.map(sc => sceneDurationMs(sc.text));
  const sceneProgress = (i: number) => i < narration.scene || narration.finished ? 1 : i > narration.scene ? 0
    : Math.min(1, (narration.sentence + narration.fraction) / Math.max(1, sentences.length));
  return {
    phases, scenes, narration, scene, sentences, symbolView, focus, spotlight, sceneWeights, sceneProgress,
    hasStory: phases.length > 0 || !!legacy,
  };
}

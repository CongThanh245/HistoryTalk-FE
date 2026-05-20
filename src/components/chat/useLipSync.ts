"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

/**
 * useLipSync
 *
 * Reads volume from a Web Audio AnalyserNode and maps it to a set of
 * blendshape morph targets on a THREE.SkinnedMesh (or any Mesh with
 * morphTargetDictionary / morphTargetInfluences).
 *
 * Returns a ref holding the AnalyserNode so the caller can connect any
 * AudioNode to it (e.g. a MediaStreamSource from the microphone, or an
 * AudioBufferSourceNode from TTS audio).
 */
export function useLipSync(
  meshRef: React.RefObject<THREE.Mesh | null>,
  /** Names of morph targets to drive, in priority order */
  targetNames: string[] = ["jawOpen", "mouthOpen", "viseme_aa", "Mouth_Open"],
) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Create audio context + analyser once
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;
    analyserRef.current = analyser;
    audioCtxRef.current = ctx;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      const mesh = meshRef.current;
      if (
        !mesh ||
        !mesh.morphTargetDictionary ||
        !mesh.morphTargetInfluences
      ) {
        return;
      }

      analyser.getByteFrequencyData(data);
      // Average of lower bins → voice energy
      const slice = data.slice(0, 16);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      const influence = Math.min(avg / 80, 1); // normalise 0-1

      // Apply to first matching morph target
      for (const name of targetNames) {
        const idx = mesh.morphTargetDictionary[name];
        if (idx !== undefined) {
          mesh.morphTargetInfluences[idx] = influence;
          break;
        }
      }
    };

    tick();

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      ctx.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { analyserRef, audioCtxRef };
}

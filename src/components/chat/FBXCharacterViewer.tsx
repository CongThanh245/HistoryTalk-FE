"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useAnimations, useFBX, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DiagnosticInfo = {
  blendshapes: Record<string, number>;
  bones: string[];
  meshCount: number;
  animCount: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared lip-sync scanner
// ─────────────────────────────────────────────────────────────────────────────

const LIP_PRIORITY = [
  "jawOpen", "mouthOpen", "viseme_aa", "Mouth_Open",
  "Fcl_MTH_Open", "mouth_open", "mouth", "open",
];

function scanForLipTargets(root: THREE.Object3D) {
  let blendshapes: Record<string, number> = {};
  const bones: string[] = [];
  let meshCount = 0;
  let lipMesh: THREE.Mesh | null = null;
  let lipMorphIdx = -1;
  let jawBone: THREE.Bone | null = null;
  let jawRest: THREE.Quaternion | null = null;

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    const bone = obj as THREE.Bone;

    if (mesh.isMesh) {
      meshCount++;
      if (mesh.morphTargetDictionary) {
        blendshapes = { ...blendshapes, ...mesh.morphTargetDictionary };
        if (!lipMesh) {
          for (const name of LIP_PRIORITY) {
            const idx = mesh.morphTargetDictionary[name];
            if (idx !== undefined) {
              lipMesh = mesh;
              lipMorphIdx = idx;
              break;
            }
          }
          if (!lipMesh && Object.keys(mesh.morphTargetDictionary).length > 0) {
            lipMesh = mesh;
            lipMorphIdx = 0;
          }
        }
      }
    }

    if (bone.isBone) {
      bones.push(bone.name);
      if (!jawBone && /jaw|chin|mouth|mandible/i.test(bone.name)) {
        jawBone = bone;
        jawRest = bone.quaternion.clone();
      }
    }
  });

  return { blendshapes, bones, meshCount, lipMesh, lipMorphIdx, jawBone, jawRest };
}

// ─────────────────────────────────────────────────────────────────────────────
// Volume reader — reads from an external AnalyserNode (TTS audio)
// ─────────────────────────────────────────────────────────────────────────────

// Type that matches both AnalyserNode and SimulatedAnalyserNode
export type AnalyserLike = {
  frequencyBinCount: number;
  getByteFrequencyData(dataArray: Uint8Array): void;
};

function ExternalAudioLipDriver({
  analyserRef,
  onVolume,
}: {
  analyserRef: React.RefObject<AnalyserLike | null>;
  onVolume: (v: number) => void;
}) {
  const dataRef = useRef<Uint8Array | null>(null);

  useFrame(() => {
    const analyser = analyserRef.current;
    if (!analyser) {
      onVolume(0);
      return;
    }
    if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    analyser.getByteFrequencyData(dataRef.current);
    const slice = dataRef.current.slice(0, 16);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    onVolume(Math.min(avg / 80, 1));
  });

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Thinking animation — subtle head nod / breathing when processing
// ─────────────────────────────────────────────────────────────────────────────

function ThinkingAnimation({
  rootRef,
  isProcessing,
}: {
  rootRef: React.RefObject<THREE.Group | null>;
  isProcessing: boolean;
}) {
  const timeRef = useRef(0);
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const baseRotationRef = useRef<number | null>(null);

  // Find head bone once on mount
  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.traverse((obj) => {
      const bone = obj as THREE.Bone;
      if (bone.isBone && /head|neck/i.test(obj.name) && !headBoneRef.current) {
        headBoneRef.current = bone;
        baseRotationRef.current = bone.rotation.x;
      }
    });
  }, []);

  useFrame((_, delta) => {
    if (!isProcessing) {
      // Reset head rotation when not processing
      if (headBoneRef.current && baseRotationRef.current !== null) {
        headBoneRef.current.rotation.x = THREE.MathUtils.lerp(
          headBoneRef.current.rotation.x,
          baseRotationRef.current,
          delta * 5
        );
      }
      return;
    }

    timeRef.current += delta;
    const t = timeRef.current;

    // Subtle head nod (rotate x slightly)
    if (headBoneRef.current && baseRotationRef.current !== null) {
      const nod = baseRotationRef.current + Math.sin(t * 2.5) * 0.02;
      headBoneRef.current.rotation.x = THREE.MathUtils.lerp(
        headBoneRef.current.rotation.x,
        nod,
        delta * 8
      );
    }
  });

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared lip-sync frame logic
// ─────────────────────────────────────────────────────────────────────────────

function useLipSyncFrame(
  lipMeshRef: React.RefObject<THREE.Mesh | null>,
  lipMorphIdxRef: React.RefObject<number>,
  jawBoneRef: React.RefObject<THREE.Bone | null>,
  jawRestRef: React.RefObject<THREE.Quaternion | null>,
  volumeRef: React.RefObject<number>,
  isSpeaking: boolean,
  testVolumeRef: React.RefObject<number>,
) {
  const timeRef = useRef(0);
  const smoothedVolumeRef = useRef(0);
  const mouthValueRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;

    const liveVol = isSpeaking ? volumeRef.current : 0;
    const testVol = testVolumeRef.current ?? 0;
    const rawVolume = Math.max(liveVol, testVol);
    const silenceGate = rawVolume < 0.16 ? 0 : rawVolume;

    smoothedVolumeRef.current = THREE.MathUtils.lerp(
      smoothedVolumeRef.current,
      silenceGate,
      Math.min(delta * (silenceGate > smoothedVolumeRef.current ? 14 : 22), 1),
    );

    const voice = smoothedVolumeRef.current;
    const t = timeRef.current;
    const syllablePulse =
      Math.max(0, Math.sin(t * 38)) * 0.42 +
      Math.max(0, Math.sin(t * 23 + 0.8)) * 0.22;
    const target =
      voice <= 0.02
        ? 0
        : THREE.MathUtils.clamp(voice * 0.48 + syllablePulse * voice, 0.02, 0.72);

    mouthValueRef.current = THREE.MathUtils.lerp(
      mouthValueRef.current,
      target,
      Math.min(delta * (target > mouthValueRef.current ? 20 : 28), 1),
    );

    const mesh = lipMeshRef.current;
    if (mesh?.morphTargetInfluences && lipMorphIdxRef.current >= 0) {
      const cur = mesh.morphTargetInfluences[lipMorphIdxRef.current] ?? 0;
      mesh.morphTargetInfluences[lipMorphIdxRef.current] = THREE.MathUtils.lerp(
        cur, mouthValueRef.current, Math.min(delta * 24, 1),
      );
      return;
    }
    const jaw = jawBoneRef.current;
    if (jaw && jawRestRef.current) {
      jaw.quaternion.slerp(
        jawRestRef.current.clone().multiply(
          new THREE.Quaternion().setFromEuler(new THREE.Euler(mouthValueRef.current * 0.3, 0, 0)),
        ),
        Math.min(delta * 18, 1),
      );
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GLB model component
// ─────────────────────────────────────────────────────────────────────────────

function GLBCharacterModel({
  url,
  isSpeaking,
  isListening,
  isRecording,
  isProcessing,
  testVolumeRef,
  ttsAnalyserRef,
  onDiagnostic,
  onVoiceVolume,
}: {
  url: string;
  isSpeaking: boolean;
  isListening: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  testVolumeRef: React.RefObject<number>;
  ttsAnalyserRef: React.RefObject<AnalyserLike | null>;
  onDiagnostic: (d: DiagnosticInfo) => void;
  onVoiceVolume?: (volume: number) => void;
}) {
  const gltf = useGLTF(url) as unknown as GLTF & { scene: THREE.Group };

  // Clone scene + animations so each mount has its own independent objects.
  // useGLTF returns cached shared objects — attaching them directly causes
  // the scene to be "stolen" from any previous render, making every 2nd open fail.
  const clonedScene = React.useMemo(
    () => SkeletonUtils.clone(gltf.scene) as THREE.Group,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gltf.scene],
  );
  const clonedAnimations = React.useMemo(
    () => gltf.animations.map((clip) => clip.clone()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gltf.animations],
  );

  const { actions, names } = useAnimations(clonedAnimations, clonedScene);
  const reported = useRef(false);
  const sceneRef = useRef<THREE.Group>(clonedScene);
  const [motionReady, setMotionReady] = useState(false);

  const lipMeshRef = useRef<THREE.Mesh | null>(null);
  const lipMorphIdxRef = useRef(-1);
  const jawBoneRef = useRef<THREE.Bone | null>(null);
  const jawRestRef = useRef<THREE.Quaternion | null>(null);
  const volumeRef = useRef(0);

  useEffect(() => {
    if (names.length > 0) actions[names[0]]?.reset().fadeIn(0.3).play();
  }, [actions, names]);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;

    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const s = size.y > 0 ? 4.5 / size.y : 1;
    clonedScene.scale.setScalar(s);
    const box2 = new THREE.Box3().setFromObject(clonedScene);
    const center2 = box2.getCenter(new THREE.Vector3());
    clonedScene.position.sub(center2);
    clonedScene.position.y += (box2.max.y - box2.min.y) / 2 - 0.8;

    const { blendshapes, bones, meshCount, lipMesh, lipMorphIdx, jawBone, jawRest } =
      scanForLipTargets(clonedScene);

    lipMeshRef.current = lipMesh;
    lipMorphIdxRef.current = lipMorphIdx;
    jawBoneRef.current = jawBone;
    jawRestRef.current = jawRest;

    onDiagnostic({ blendshapes, bones, meshCount, animCount: names.length });
    setMotionReady(true);
  }, [clonedScene, names, onDiagnostic]);

  useLipSyncFrame(lipMeshRef, lipMorphIdxRef, jawBoneRef, jawRestRef, volumeRef, isSpeaking, testVolumeRef);

  return (
    <>
      <ExternalAudioLipDriver analyserRef={ttsAnalyserRef} onVolume={(v) => {
        volumeRef.current = v;
        onVoiceVolume?.(v);
      }} />
      <ThinkingAnimation rootRef={sceneRef} isProcessing={isProcessing} />
      <CinematicModelMotion
        rootRef={sceneRef}
        enabled={motionReady}
        isSpeaking={isSpeaking}
        isListening={isListening}
        isRecording={isRecording}
        isProcessing={isProcessing}
        volumeRef={volumeRef}
      />
      <primitive object={clonedScene} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FBX model component
// ─────────────────────────────────────────────────────────────────────────────

function FBXCharacterModel({
  url,
  isSpeaking,
  isListening,
  isRecording,
  isProcessing,
  testVolumeRef,
  ttsAnalyserRef,
  onDiagnostic,
  onVoiceVolume,
}: {
  url: string;
  isSpeaking: boolean;
  isListening: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  testVolumeRef: React.RefObject<number>;
  ttsAnalyserRef: React.RefObject<AnalyserLike | null>;
  onDiagnostic: (d: DiagnosticInfo) => void;
  onVoiceVolume?: (volume: number) => void;
}) {
  const fbx = useFBX(url);
  const clonedFbx = React.useMemo(
    () => SkeletonUtils.clone(fbx) as THREE.Group,
    [fbx],
  );
  const clonedAnimations = React.useMemo(
    () => fbx.animations.map((clip) => clip.clone()),
    [fbx.animations],
  );
  const { actions, names } = useAnimations(clonedAnimations, clonedFbx);
  const reported = useRef(false);
  const fbxRef = useRef<THREE.Group>(clonedFbx);
  const [motionReady, setMotionReady] = useState(false);

  const lipMeshRef = useRef<THREE.Mesh | null>(null);
  const lipMorphIdxRef = useRef(-1);
  const jawBoneRef = useRef<THREE.Bone | null>(null);
  const jawRestRef = useRef<THREE.Quaternion | null>(null);
  const volumeRef = useRef(0);

  useEffect(() => {
    if (names.length > 0) actions[names[0]]?.reset().fadeIn(0.3).play();
  }, [actions, names]);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;

    const box = new THREE.Box3().setFromObject(clonedFbx);
    const size = box.getSize(new THREE.Vector3());
    const s = size.y > 0 ? 4.5 / size.y : 0.012;
    clonedFbx.scale.setScalar(s);
    const box2 = new THREE.Box3().setFromObject(clonedFbx);
    const center2 = box2.getCenter(new THREE.Vector3());
    clonedFbx.position.sub(center2);
    clonedFbx.position.y += (box2.max.y - box2.min.y) / 2;

    const { blendshapes, bones, meshCount, lipMesh, lipMorphIdx, jawBone, jawRest } =
      scanForLipTargets(clonedFbx);

    lipMeshRef.current = lipMesh;
    lipMorphIdxRef.current = lipMorphIdx;
    jawBoneRef.current = jawBone;
    jawRestRef.current = jawRest;

    onDiagnostic({ blendshapes, bones, meshCount, animCount: names.length });
    setMotionReady(true);
  }, [clonedFbx, names, onDiagnostic]);

  useLipSyncFrame(lipMeshRef, lipMorphIdxRef, jawBoneRef, jawRestRef, volumeRef, isSpeaking, testVolumeRef);

  return (
    <>
      <ExternalAudioLipDriver analyserRef={ttsAnalyserRef} onVolume={(v) => {
        volumeRef.current = v;
        onVoiceVolume?.(v);
      }} />
      <ThinkingAnimation rootRef={fbxRef} isProcessing={isProcessing} />
      <CinematicModelMotion
        rootRef={fbxRef}
        enabled={motionReady}
        isSpeaking={isSpeaking}
        isListening={isListening}
        isRecording={isRecording}
        isProcessing={isProcessing}
        volumeRef={volumeRef}
      />
      <primitive object={clonedFbx} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-routing model
// ─────────────────────────────────────────────────────────────────────────────

function AutoModel(props: {
  url: string;
  isSpeaking: boolean;
  isListening: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  testVolumeRef: React.RefObject<number>;
  ttsAnalyserRef: React.RefObject<AnalyserLike | null>;
  onDiagnostic: (d: DiagnosticInfo) => void;
  onVoiceVolume?: (volume: number) => void;
}) {
  const ext = props.url.split(".").pop()?.toLowerCase();
  if (ext === "glb" || ext === "gltf") return <GLBCharacterModel {...props} />;
  return <FBXCharacterModel {...props} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas loader
// ─────────────────────────────────────────────────────────────────────────────

function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="#c9a84c" wireframe />
    </mesh>
  );
}

function CameraRig() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 2.15, 6.2);
    camera.lookAt(0, 2.05, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function CinematicModelMotion({
  rootRef,
  enabled,
  isSpeaking,
  isListening,
  isRecording,
  isProcessing,
  volumeRef,
}: {
  rootRef: React.RefObject<THREE.Group | null>;
  enabled: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  volumeRef: React.RefObject<number>;
}) {
  const timeRef = useRef(0);
  const restRef = useRef<{
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  } | null>(null);

  useFrame((_, delta) => {
    const root = rootRef.current;
    if (!root) return;
    if (!enabled) {
      restRef.current = null;
      return;
    }
    if (!restRef.current) {
      restRef.current = {
        position: root.position.clone(),
        rotation: root.rotation.clone(),
        scale: root.scale.clone(),
      };
    }
    const rest = restRef.current;

    timeRef.current += delta;
    const speed = isSpeaking || isListening || isRecording || isProcessing ? 8 : 5;
    const alpha = Math.min(delta * speed, 1);

    root.scale.x = THREE.MathUtils.lerp(root.scale.x, rest.scale.x, alpha);
    root.scale.y = THREE.MathUtils.lerp(root.scale.y, rest.scale.y, alpha);
    root.scale.z = THREE.MathUtils.lerp(root.scale.z, rest.scale.z, alpha);
    root.position.lerp(rest.position, alpha);
    root.rotation.x = THREE.MathUtils.lerp(root.rotation.x, rest.rotation.x, alpha);
    root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, rest.rotation.y, alpha);
    root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, rest.rotation.z, alpha);
  });

  return null;
}

function AnimatedSceneLights({
  isSpeaking,
  isListening,
  isRecording,
  isProcessing,
}: {
  isSpeaking: boolean;
  isListening: boolean;
  isRecording: boolean;
  isProcessing: boolean;
}) {
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    const key = keyLightRef.current;
    const rim = rimLightRef.current;
    if (!key || !rim) return;

    const speakingPulse = isSpeaking ? (Math.sin(t * 8) + 1) * 0.18 : 0;
    const listeningPulse = isListening || isRecording ? (Math.sin(t * 3.5) + 1) * 0.12 : 0;
    const processingPulse = isProcessing ? (Math.sin(t * 2.2) + 1) * 0.16 : 0;

    key.intensity = THREE.MathUtils.lerp(
      key.intensity,
      1.15 + speakingPulse + processingPulse,
      Math.min(delta * 4, 1),
    );
    rim.intensity = THREE.MathUtils.lerp(
      rim.intensity,
      0.42 + speakingPulse + listeningPulse + processingPulse,
      Math.min(delta * 4, 1),
    );
    rim.position.x = -2 + Math.sin(t * 0.8) * 0.35;
    rim.position.z = -1 + Math.cos(t * 0.7) * 0.35;
  });

  return (
    <>
      <ambientLight intensity={0.68} />
      <directionalLight ref={keyLightRef} position={[2, 6, 4]} intensity={1.15} />
      <pointLight ref={rimLightRef} position={[-2, 3, -1]} intensity={0.45} color="#c9a84c" />
    </>
  );
}

class ModelErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    onError: (error: Error) => void;
  },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported component
// ─────────────────────────────────────────────────────────────────────────────

export type FBXCharacterViewerProps = {
  modelUrl?: string;
  isSpeaking?: boolean;
  isListening?: boolean;
  isRecording?: boolean;
  isProcessing?: boolean;
  statusText?: string;
  /** AnalyserNode hoặc SimulatedAnalyserNode phân tích audio TTS */
  ttsAnalyserRef?: React.RefObject<AnalyserLike | null>;
  onDiagnostic?: (d: DiagnosticInfo) => void;
  onVoiceVolume?: (volume: number) => void;
};

// Fallback analyser ref (rỗng) khi không truyền từ ngoài
const EMPTY_ANALYSER_REF: React.RefObject<AnalyserLike | null> = { current: null };

// Check if model URL is valid (not null/undefined/empty and not the non-existent default)
function isValidModelUrl(url?: string | null): boolean {
  if (!url || url.trim() === "") return false;
  // Exclude the default fallback path that doesn't exist
  if (url === "/models/character.glb") return false;
  return true;
}

// Placeholder when no 3D model is available
function NoModelPlaceholder({ statusLabel, dotColor, shouldAnimate }: {
  statusLabel: string;
  dotColor: string;
  shouldAnimate: boolean;
}) {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "rgba(201,168,76,0.6)",
    }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <p style={{ marginTop: 12, fontSize: 13, opacity: 0.7 }}>
        Hiện tại nhân vật này chưa có mô hình 3D. Chúng tôi đang bổ sung...
      </p>

      {/* Status dot - same styling as in main component */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 14px",
          borderRadius: 20,
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(201,168,76,0.3)",
          color: "#c9a84c",
          fontSize: 12,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            flexShrink: 0,
            background: dotColor,
            animation: shouldAnimate ? "pulse 1s ease-in-out infinite" : "none",
          }}
        />
        {statusLabel}
      </div>
    </div>
  );
}

export function FBXCharacterViewer({
  modelUrl = "/models/character.glb",
  isSpeaking = false,
  isListening = false,
  isRecording = false,
  isProcessing = false,
  statusText,
  ttsAnalyserRef = EMPTY_ANALYSER_REF,
  onDiagnostic,
  onVoiceVolume,
}: FBXCharacterViewerProps) {
  const testVolumeRef = useRef(0);
  const diagnosticRef = useRef<DiagnosticInfo | null>(null);
  const [modelLoadError, setModelLoadError] = useState<{
    url: string;
    error: Error;
  } | null>(null);

  const handleDiagnostic = (d: DiagnosticInfo) => {
    diagnosticRef.current = d;
    onDiagnostic?.(d);
  };

  const effectiveSpeaking = isSpeaking;

  // Status label + dot color
  const dotColor = effectiveSpeaking
    ? "#c9a84c"
    : isRecording
    ? "#ef5350"
    : isListening
    ? "#4caf50"
    : isProcessing
    ? "#2196f3"
    : "#555";

  const statusLabel = effectiveSpeaking
    ? "Đang nói..."
    : isRecording
    ? " Đang ghi âm..."
    : isListening
    ? "Đang nghe..."
    : isProcessing
    ? statusText ?? "Đang lần theo dấu vết lịch sử..."
    : "Chờ...";

  const shouldAnimate = effectiveSpeaking || isRecording || isListening || isProcessing;

  const hasValidModel = isValidModelUrl(modelUrl);

  // Show placeholder if no valid model URL
  if (!hasValidModel || modelLoadError?.url === modelUrl) {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <NoModelPlaceholder
          statusLabel={statusLabel}
          dotColor={dotColor}
          shouldAnimate={shouldAnimate}
        />
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Status dot */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 14px",
          borderRadius: 20,
          background: "rgba(0,0,0,0.6)",
          border: "1px solid rgba(201,168,76,0.3)",
          color: "#c9a84c",
          fontSize: 12,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            flexShrink: 0,
            background: dotColor,
            animation: shouldAnimate ? "pulse 1s ease-in-out infinite" : "none",
          }}
        />
        {statusLabel}
      </div>

      <Canvas
        camera={{ position: [0, 2.15, 6.2], fov: 32 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        performance={{ min: 0.5 }}
        style={{ background: "transparent" }}
      >
        <CameraRig />
        <AnimatedSceneLights
          isSpeaking={effectiveSpeaking}
          isListening={isListening}
          isRecording={isRecording}
          isProcessing={isProcessing}
        />

        <ModelErrorBoundary
          key={modelUrl}
          onError={(error) => setModelLoadError({ url: modelUrl, error })}
        >
          <Suspense fallback={<Loader />}>
            <AutoModel
              url={modelUrl}
              isSpeaking={effectiveSpeaking}
              isListening={isListening}
              isRecording={isRecording}
              isProcessing={isProcessing}
              testVolumeRef={testVolumeRef}
              ttsAnalyserRef={ttsAnalyserRef}
              onDiagnostic={handleDiagnostic}
              onVoiceVolume={onVoiceVolume}
            />
          </Suspense>
        </ModelErrorBoundary>

        <OrbitControls
          enablePan={false}
          autoRotate={false}
          autoRotateSpeed={0.28}
          minDistance={2}
          maxDistance={10}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 2}
          target={[0, 2.05, 0]}
        />
      </Canvas>
    </div>
  );
}

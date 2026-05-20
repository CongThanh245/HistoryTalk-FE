"use client";

import React, { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useAnimations, useFBX, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

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

function ExternalAudioLipDriver({
  analyserRef,
  onVolume,
}: {
  analyserRef: React.RefObject<AnalyserNode | null>;
  onVolume: (v: number) => void;
}) {
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useFrame(() => {
    const analyser = analyserRef.current;
    if (!analyser) {
      onVolume(0);
      return;
    }
    if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
      dataRef.current = new Uint8Array(analyser.frequencyBinCount) as unknown as Uint8Array<ArrayBuffer>;
    }
    analyser.getByteFrequencyData(dataRef.current);
    const slice = dataRef.current.slice(0, 16);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    onVolume(Math.min(avg / 80, 1));
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
  useFrame((_, delta) => {
    const liveVol = isSpeaking ? volumeRef.current : 0;
    const testVol = testVolumeRef.current ?? 0;
    const target = Math.max(liveVol, testVol);

    const mesh = lipMeshRef.current;
    if (mesh?.morphTargetInfluences && lipMorphIdxRef.current >= 0) {
      const cur = mesh.morphTargetInfluences[lipMorphIdxRef.current] ?? 0;
      mesh.morphTargetInfluences[lipMorphIdxRef.current] = THREE.MathUtils.lerp(
        cur, target, Math.min(delta * 12, 1),
      );
      return;
    }
    const jaw = jawBoneRef.current;
    if (jaw && jawRestRef.current) {
      jaw.quaternion.slerp(
        jawRestRef.current.clone().multiply(
          new THREE.Quaternion().setFromEuler(new THREE.Euler(target * 0.3, 0, 0)),
        ),
        Math.min(delta * 10, 1),
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
  testVolumeRef,
  ttsAnalyserRef,
  onDiagnostic,
}: {
  url: string;
  isSpeaking: boolean;
  testVolumeRef: React.RefObject<number>;
  ttsAnalyserRef: React.RefObject<AnalyserNode | null>;
  onDiagnostic: (d: DiagnosticInfo) => void;
}) {
  const gltf = useGLTF(url) as unknown as GLTF & { scene: THREE.Group };
  const { actions, names } = useAnimations(gltf.animations, gltf.scene);
  const reported = useRef(false);

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

    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const s = size.y > 0 ? 4.5 / size.y : 1;
    gltf.scene.scale.setScalar(s);
    const box2 = new THREE.Box3().setFromObject(gltf.scene);
    const center2 = box2.getCenter(new THREE.Vector3());
    gltf.scene.position.sub(center2);
    gltf.scene.position.y += (box2.max.y - box2.min.y) / 2;

    const { blendshapes, bones, meshCount, lipMesh, lipMorphIdx, jawBone, jawRest } =
      scanForLipTargets(gltf.scene);

    lipMeshRef.current = lipMesh;
    lipMorphIdxRef.current = lipMorphIdx;
    jawBoneRef.current = jawBone;
    jawRestRef.current = jawRest;

    onDiagnostic({ blendshapes, bones, meshCount, animCount: names.length });
  }, [gltf.scene, names, onDiagnostic]);

  useLipSyncFrame(lipMeshRef, lipMorphIdxRef, jawBoneRef, jawRestRef, volumeRef, isSpeaking, testVolumeRef);

  return (
    <>
      <ExternalAudioLipDriver analyserRef={ttsAnalyserRef} onVolume={(v) => { volumeRef.current = v; }} />
      <primitive object={gltf.scene} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FBX model component
// ─────────────────────────────────────────────────────────────────────────────

function FBXCharacterModel({
  url,
  isSpeaking,
  testVolumeRef,
  ttsAnalyserRef,
  onDiagnostic,
}: {
  url: string;
  isSpeaking: boolean;
  testVolumeRef: React.RefObject<number>;
  ttsAnalyserRef: React.RefObject<AnalyserNode | null>;
  onDiagnostic: (d: DiagnosticInfo) => void;
}) {
  const fbx = useFBX(url);
  const { actions, names } = useAnimations(fbx.animations, fbx);
  const reported = useRef(false);

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

    const box = new THREE.Box3().setFromObject(fbx);
    const size = box.getSize(new THREE.Vector3());
    const s = size.y > 0 ? 4.5 / size.y : 0.012;
    fbx.scale.setScalar(s);
    const box2 = new THREE.Box3().setFromObject(fbx);
    const center2 = box2.getCenter(new THREE.Vector3());
    fbx.position.sub(center2);
    fbx.position.y += (box2.max.y - box2.min.y) / 2;

    const { blendshapes, bones, meshCount, lipMesh, lipMorphIdx, jawBone, jawRest } =
      scanForLipTargets(fbx);

    lipMeshRef.current = lipMesh;
    lipMorphIdxRef.current = lipMorphIdx;
    jawBoneRef.current = jawBone;
    jawRestRef.current = jawRest;

    onDiagnostic({ blendshapes, bones, meshCount, animCount: names.length });
  }, [fbx, names, onDiagnostic]);

  useLipSyncFrame(lipMeshRef, lipMorphIdxRef, jawBoneRef, jawRestRef, volumeRef, isSpeaking, testVolumeRef);

  return (
    <>
      <ExternalAudioLipDriver analyserRef={ttsAnalyserRef} onVolume={(v) => { volumeRef.current = v; }} />
      <primitive object={fbx} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-routing model
// ─────────────────────────────────────────────────────────────────────────────

function AutoModel(props: {
  url: string;
  isSpeaking: boolean;
  testVolumeRef: React.RefObject<number>;
  ttsAnalyserRef: React.RefObject<AnalyserNode | null>;
  onDiagnostic: (d: DiagnosticInfo) => void;
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

// ─────────────────────────────────────────────────────────────────────────────
// Exported component
// ─────────────────────────────────────────────────────────────────────────────

export type FBXCharacterViewerProps = {
  modelUrl?: string;
  isSpeaking?: boolean;
  isListening?: boolean;
  isRecording?: boolean;
  /** AnalyserNode phân tích audio TTS — truyền từ useVoiceChatRest */
  ttsAnalyserRef?: React.RefObject<AnalyserNode | null>;
  onDiagnostic?: (d: DiagnosticInfo) => void;
};

// Fallback analyser ref (rỗng) khi không truyền từ ngoài
const EMPTY_ANALYSER_REF: React.RefObject<AnalyserNode | null> = { current: null };

export function FBXCharacterViewer({
  modelUrl = "/models/character.glb",
  isSpeaking = false,
  isListening = false,
  isRecording = false,
  ttsAnalyserRef = EMPTY_ANALYSER_REF,
  onDiagnostic,
}: FBXCharacterViewerProps) {
  const testVolumeRef = useRef(0);
  const diagnosticRef = useRef<DiagnosticInfo | null>(null);

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
    : "#555";

  const statusLabel = effectiveSpeaking
    ? "Đang nói..."
    : isRecording
    ? "🔴 Đang ghi âm..."
    : isListening
    ? "Đang nghe..."
    : "Chờ...";

  const shouldAnimate = effectiveSpeaking || isRecording || isListening;

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
        camera={{ position: [0, 2.5, 5.0], fov: 35 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 6, 4]} intensity={1.3} castShadow />
        <pointLight position={[-2, 3, -1]} intensity={0.5} color="#c9a84c" />

        <Suspense fallback={<Loader />}>
          <AutoModel
            url={modelUrl}
            isSpeaking={effectiveSpeaking}
            testVolumeRef={testVolumeRef}
            ttsAnalyserRef={ttsAnalyserRef}
            onDiagnostic={handleDiagnostic}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={10}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={(Math.PI * 2) / 3}
          target={[0, 2.2, 0]}
        />
      </Canvas>
    </div>
  );
}

import * as THREE from "three";

const SLICES = 64;
/** Share of the model height searched for the head, measured from the top. */
const HEAD_SEARCH_RATIO = 0.45;
/** Mouth height above the chin, as a share of the chin-to-top distance. */
const MOUTH_RATIO = 0.24;
/** Chin drop at full influence, as a share of the chin-to-top distance. */
const JAW_DROP_RATIO = 0.13;

/** Per source geometry, so each mount reuses the estimate (null = no mouth found). */
const mouthMorphs = new WeakMap<THREE.BufferGeometry, THREE.BufferAttribute | null>();

type MouthEstimate = {
  centerX: number;
  mouthY: number;
  frontZ: number;
  headHeight: number;
  headWidth: number;
  headDepth: number;
};

function spread(values: number[]) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
}

/**
 * Finds the neck as the narrowest slice between head and shoulders, then places
 * the mouth from it. Spread rather than extent, so thin parts such as hanging
 * ribbons don't count as width. Expects a Y-up model facing +Z.
 */
function estimateMouth(position: THREE.BufferAttribute): MouthEstimate | null {
  const box = new THREE.Box3().setFromBufferAttribute(position);
  const height = box.max.y - box.min.y;
  if (height <= 0) return null;

  const searchHeight = height * HEAD_SEARCH_RATIO;
  const sliceHeight = searchHeight / SLICES;
  const slices: number[][] = Array.from({ length: SLICES }, () => []);
  for (let i = 0; i < position.count; i++) {
    const index = Math.floor((box.max.y - position.getY(i)) / sliceHeight);
    if (index >= 0 && index < SLICES) slices[index].push(position.getX(i));
  }
  const widths = slices.map(spread);

  const skip = Math.ceil(SLICES * 0.1);
  let headIndex = skip;
  for (let i = skip; i < SLICES / 2; i++) {
    if (widths[i] > widths[headIndex]) headIndex = i;
  }
  let shoulderIndex = SLICES - 1;
  for (let i = headIndex + 1; i < SLICES; i++) {
    if (widths[i] > widths[headIndex] * 1.5) {
      shoulderIndex = i;
      break;
    }
  }
  let neckIndex = headIndex + 1;
  for (let i = headIndex + 1; i < shoulderIndex; i++) {
    if (widths[i] > 0 && widths[i] < widths[neckIndex]) neckIndex = i;
  }
  if (neckIndex >= shoulderIndex) return null;

  const chinY = box.max.y - neckIndex * sliceHeight;
  const headHeight = box.max.y - chinY;
  const mouthY = chinY + headHeight * MOUTH_RATIO;

  const xs: number[] = [];
  const zs: number[] = [];
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    if (y >= chinY && y <= box.max.y) {
      xs.push(position.getX(i));
      zs.push(position.getZ(i));
    }
  }
  if (xs.length === 0) return null;
  xs.sort((a, b) => a - b);
  const centerX = xs[Math.floor(xs.length / 2)];

  // Percentiles, so a stray vertex doesn't move the face plane.
  zs.sort((a, b) => a - b);
  const frontZ = zs[Math.floor(zs.length * 0.98)];
  const backZ = zs[Math.floor(zs.length * 0.02)];

  return {
    centerX,
    mouthY,
    frontZ,
    headHeight,
    headWidth: widths[headIndex] * 4,
    headDepth: frontZ - backZ,
  };
}

function buildMouthDeltas(position: THREE.BufferAttribute, mouth: MouthEstimate) {
  const deltas = new Float32Array(position.count * 3);
  const radiusX = mouth.headWidth * 0.42;
  const radiusY = mouth.headHeight * 0.3;
  const drop = mouth.headHeight * JAW_DROP_RATIO;
  const lipGap = mouth.headHeight * 0.03;

  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    // Face side only, so the back of the head and the hat stay put.
    if (position.getZ(i) < mouth.frontZ - mouth.headDepth * 0.5) continue;

    const dx = (position.getX(i) - mouth.centerX) / radiusX;
    const dy = (y - mouth.mouthY) / radiusY;
    const falloff = 1 - THREE.MathUtils.smoothstep(Math.sqrt(dx * dx + dy * dy), 0.45, 1);
    if (falloff <= 0) continue;

    const below = THREE.MathUtils.smoothstep(mouth.mouthY - y, 0, lipGap);
    const above = THREE.MathUtils.smoothstep(y - mouth.mouthY, 0, lipGap);
    deltas[i * 3 + 1] = falloff * (above * drop * 0.12 - below * drop);
  }
  return deltas;
}

/**
 * Generated models have no jaw bone or blendshape to lip-sync with. This adds a
 * "mouthOpen" morph target that drops the chin, which the existing lip-sync loop
 * picks up by name. The mouth is only painted on, so it reads as a moving jaw,
 * not parting lips. Models that are already rigged are left alone.
 */
export function addEstimatedMouthMorph(root: THREE.Object3D) {
  let target: THREE.Mesh | null = null;
  let hasFacialRig = false;

  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if ((object as THREE.Bone).isBone) hasFacialRig = true;
    if (!mesh.isMesh) return;
    if (Object.keys(mesh.morphTargetDictionary ?? {}).length > 0) hasFacialRig = true;
    const count = mesh.geometry.attributes.position?.count ?? 0;
    if (!target || count > target.geometry.attributes.position.count) target = mesh;
  });

  const mesh = target as THREE.Mesh | null;
  if (hasFacialRig || !mesh) return;

  const source = mesh.geometry;
  let morph = mouthMorphs.get(source);
  if (morph === undefined) {
    const position = source.attributes.position as THREE.BufferAttribute;
    const estimate = estimateMouth(position);
    morph = estimate ? new THREE.BufferAttribute(buildMouthDeltas(position, estimate), 3) : null;
    if (morph) morph.name = "mouthOpen";
    mouthMorphs.set(source, morph);
  }
  if (!morph) return;

  // useGLTF shares geometry between mounts. Adding the morph to the shared copy
  // would reach other clones that have no morphTargetInfluences and crash
  // three.js, so this mesh gets its own geometry.
  const geometry = source.clone();
  geometry.morphAttributes.position = [morph];
  geometry.morphTargetsRelative = true;
  mesh.geometry = geometry;
  mesh.updateMorphTargets();
}

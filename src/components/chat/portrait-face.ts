import type { PortraitPoints } from "@/services/media.service";

/**
 * Face layout of a portrait image, found with MediaPipe Face Landmarker in the
 * browser. Points are in image pixels, y down.
 */
export type PortraitFace = {
  imageWidth: number;
  imageHeight: number;
  /** Unit vector from the left mouth corner to the right one. */
  axis: [number, number];
  mouth: [number, number];
  mouthHalfWidth: number;
  /** Distance from the mouth line down to the chin, along the face axis. */
  chinDistance: number;
  /** How far the jaw reaches left and right of the mouth center. */
  jawExtent: [number, number];
  chin: [number, number];
  /** Forehead to chin. */
  faceHeight: number;
  faceCenter: [number, number];
  eyes: [Eye, Eye];
};

type Eye = { center: [number, number]; upperLid: [number, number]; halfWidth: number; height: number };

const VISION_VERSION = "0.10.17";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// MediaPipe face mesh indices.
const FOREHEAD = 10;
const CHIN = 152;
const UPPER_LIP = 13;
const LOWER_LIP = 14;
const MOUTH_LEFT = 61;
const MOUTH_RIGHT = 291;
const FACE_LEFT = 234;
const FACE_RIGHT = 454;
const EYES = [
  { inner: 133, outer: 33, upper: 159, lower: 145 },
  { inner: 362, outer: 263, upper: 386, lower: 374 },
];

type Landmarker = { detect(image: HTMLImageElement): { faceLandmarks: { x: number; y: number }[][] } };

let landmarkerPromise: Promise<Landmarker> | null = null;
const faces = new Map<string, Promise<PortraitFace | null>>();

/**
 * MediaPipe's wasm prints status lines such as "INFO: Created TensorFlow Lite
 * XNNPACK delegate" through console.error, which the Next.js dev overlay then
 * reports as an error. Those lines are dropped; real errors still go through.
 */
async function withoutInfoLogs<T>(run: () => Promise<T>): Promise<T> {
  const original = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("INFO:")) return;
    original(...args);
  };
  try {
    return await run();
  } finally {
    console.error = original;
  }
}

function getLandmarker() {
  landmarkerPromise ??= (async () => {
    const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
    return FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: "IMAGE",
      numFaces: 1,
    });
  })();
  // A failed load (offline, blocked CDN) should be retried next time.
  landmarkerPromise.catch(() => {
    landmarkerPromise = null;
  });
  return landmarkerPromise;
}

export function loadPortraitImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    // Needed both for MediaPipe and for uploading the image as a WebGL texture.
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không tải được ảnh nhân vật"));
    image.src = url;
  });
}

function layoutFrom(points: { x: number; y: number }[], width: number, height: number): PortraitFace {
  const at = (i: number): [number, number] => [points[i].x * width, points[i].y * height];
  const sub = (a: [number, number], b: [number, number]): [number, number] => [a[0] - b[0], a[1] - b[1]];
  const dot = (a: [number, number], b: [number, number]) => a[0] * b[0] + a[1] * b[1];
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  const left = at(MOUTH_LEFT);
  const right = at(MOUTH_RIGHT);
  const across = sub(right, left);
  const length = Math.hypot(across[0], across[1]) || 1;
  const axis: [number, number] = [across[0] / length, across[1] / length];
  const down: [number, number] = [-axis[1], axis[0]];

  const mouth = mid(at(UPPER_LIP), at(LOWER_LIP));
  const chin = at(CHIN);
  const forehead = at(FOREHEAD);

  const eyes = EYES.map(({ inner, outer, upper, lower }) => {
    const corners = sub(at(inner), at(outer));
    return {
      center: mid(at(inner), at(outer)),
      upperLid: at(upper),
      halfWidth: Math.abs(dot(corners, axis)) / 2,
      height: Math.max(dot(sub(at(lower), at(upper)), down), 1.5),
    };
  }) as [Eye, Eye];

  return {
    imageWidth: width,
    imageHeight: height,
    axis,
    mouth,
    mouthHalfWidth: length / 2,
    chinDistance: Math.max(dot(sub(chin, mouth), down), 1),
    jawExtent: [
      Math.max(-dot(sub(at(FACE_LEFT), mouth), axis), 0),
      Math.max(dot(sub(at(FACE_RIGHT), mouth), axis), 0),
    ],
    chin,
    faceHeight: Math.hypot(chin[0] - forehead[0], chin[1] - forehead[1]),
    faceCenter: mid(mid(forehead, chin), mid(at(FACE_LEFT), at(FACE_RIGHT))),
    eyes,
  };
}

/** Detects the face once per image URL. Resolves null when no face is found. */
export function detectPortraitFace(url: string, image: HTMLImageElement) {
  let face = faces.get(url);
  if (!face) {
    face = withoutInfoLogs(async () => {
      const landmarker = await getLandmarker();
      const points = landmarker.detect(image).faceLandmarks[0];
      return points ? layoutFrom(points, image.naturalWidth, image.naturalHeight) : null;
    });
    faces.set(url, face);
    face.catch(() => faces.delete(url));
  }
  return face;
}

/** The face points a person can place by hand, as shares of the image size. */
export type FacePoints = PortraitPoints;

/** Detected points, to start the hand editor from. */
export function pointsFromLayout(face: PortraitFace): FacePoints {
  const share = ([x, y]: [number, number]): [number, number] => [x / face.imageWidth, y / face.imageHeight];
  const [first, second] = [...face.eyes].sort((a, b) => a.center[0] - b.center[0]);
  return {
    eyeLeft: share(first.center),
    eyeRight: share(second.center),
    mouth: share(face.mouth),
    chin: share(face.chin),
  };
}

/**
 * A layout from four hand-placed points. Mouth width, eye size and face height
 * are estimated from the eye distance with typical face proportions.
 */
export function layoutFromPoints(points: FacePoints, width: number, height: number): PortraitFace {
  const px = ([x, y]: [number, number]): [number, number] => [x * width, y * height];
  const eyeLeft = px(points.eyeLeft);
  const eyeRight = px(points.eyeRight);
  const mouth = px(points.mouth);
  const chin = px(points.chin);

  const across: [number, number] = [eyeRight[0] - eyeLeft[0], eyeRight[1] - eyeLeft[1]];
  const eyeDistance = Math.hypot(across[0], across[1]) || 1;
  const axis: [number, number] = [across[0] / eyeDistance, across[1] / eyeDistance];
  const down: [number, number] = [-axis[1], axis[0]];
  const along = (a: [number, number], b: [number, number], v: [number, number]) =>
    (a[0] - b[0]) * v[0] + (a[1] - b[1]) * v[1];

  const eyesMiddle: [number, number] = [(eyeLeft[0] + eyeRight[0]) / 2, (eyeLeft[1] + eyeRight[1]) / 2];
  const eyeToChin = Math.max(along(chin, eyesMiddle, down), 1);
  const faceHeight = eyeToChin * 1.45;
  const forehead: [number, number] = [
    eyesMiddle[0] - down[0] * (faceHeight - eyeToChin),
    eyesMiddle[1] - down[1] * (faceHeight - eyeToChin),
  ];

  const eye = (center: [number, number]): Eye => {
    const lidGap = Math.max(eyeDistance * 0.16, 1.5);
    return {
      center,
      upperLid: [center[0] - down[0] * lidGap * 0.5, center[1] - down[1] * lidGap * 0.5],
      halfWidth: eyeDistance * 0.26,
      height: lidGap,
    };
  };

  return {
    imageWidth: width,
    imageHeight: height,
    axis,
    mouth,
    mouthHalfWidth: eyeDistance * 0.44,
    chinDistance: Math.max(along(chin, mouth, down), 1),
    jawExtent: [
      Math.max(eyeDistance * 0.6, -along(eyeLeft, mouth, axis) + eyeDistance * 0.5),
      Math.max(eyeDistance * 0.6, along(eyeRight, mouth, axis) + eyeDistance * 0.5),
    ],
    chin,
    faceHeight,
    faceCenter: [(forehead[0] + chin[0]) / 2, (forehead[1] + chin[1]) / 2],
    eyes: [eye(eyeLeft), eye(eyeRight)],
  };
}

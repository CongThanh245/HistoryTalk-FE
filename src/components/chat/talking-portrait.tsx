"use client";

import React, { useEffect, useRef } from "react";
import type { AnalyserLike } from "./FBXCharacterViewer";
import type { PortraitSettings } from "@/services/media.service";
import { detectPortraitFace, layoutFromPoints, loadPortraitImage, type PortraitFace } from "./portrait-face";

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

// Works backwards: for each screen pixel, finds which image pixel to show.
// Image coordinates are in pixels with y down.
const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uImage;
uniform vec2 uImageSize;
uniform vec2 uCanvasSize;
uniform vec2 uViewOrigin;
uniform float uViewScale;

uniform vec2 uAxis;
uniform vec2 uMouth;
uniform float uMouthHalfWidth;
uniform float uChinDistance;
uniform vec2 uJawExtent;
uniform float uOpen;

uniform vec2 uChin;
uniform float uFaceHeight;
uniform float uHeadTilt;
uniform float uHeadNod;

uniform vec4 uEyeL;
uniform vec4 uEyeR;
uniform vec2 uLidL;
uniform vec2 uLidR;
uniform float uBlink;

vec2 rotate(vec2 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

// The upper lid slides down over the eye; the skin above it stretches.
vec2 blink(vec2 p, vec2 down, vec4 eye, vec2 lid) {
  float across = dot(p - eye.xy, uAxis) / eye.z;
  float amount = uBlink * (1.0 - smoothstep(0.6, 1.0, abs(across)));
  float e = dot(p - lid, down) / eye.w;
  float s = e;
  if (e >= -1.5 && e < 0.0) s = e - amount * (e + 1.5) / 1.5;
  else if (e >= 0.0 && e < amount) s = e - amount;
  return p + down * (s - e) * eye.w;
}

void main() {
  vec2 down = vec2(-uAxis.y, uAxis.x);
  vec2 p = uViewOrigin + vec2(gl_FragCoord.x, uCanvasSize.y - gl_FragCoord.y) * uViewScale;

  // Head sway: everything above the neck turns around a point under the chin.
  float headWeight = 1.0 - smoothstep(0.1, 0.6, dot(p - uChin, down) / uFaceHeight);
  vec2 pivot = uChin + down * 0.35 * uFaceHeight;
  p = pivot + rotate(p - pivot, -uHeadTilt * headWeight) - down * uHeadNod * headWeight;

  p = blink(p, down, uEyeL, uLidL);
  p = blink(p, down, uEyeR, uLidR);

  // Mouth: the jaw drops, the upper lip lifts a little, and the gap between
  // them is filled with a dark mouth.
  vec2 d = p - uMouth;
  float x = dot(d, uAxis);
  float y = dot(d, down);
  // Elliptical, so the opening is lens-shaped rather than a slot.
  float across = abs(x) / (uMouthHalfWidth * 0.95);
  float lips = clamp(1.0 - across * across, 0.0, 1.0);
  float reach = x < 0.0 ? uJawExtent.x : uJawExtent.y;
  float inner = uMouthHalfWidth * 1.05;
  float jaw = 1.0 - smoothstep(inner, max(reach, inner + uMouthHalfWidth * 0.6), abs(x));

  float drop = uOpen * uChinDistance * 0.24;
  float sourceY;
  float gap;
  // 0 at the upper lip, 1 at the lower lip.
  float depth;
  if (y >= 0.0) {
    float fade = 1.0 - smoothstep(uChinDistance * 0.95, uChinDistance * 1.8, y);
    // Next to the lips the skin stretches instead of tearing open.
    float ramp = mix(smoothstep(0.0, uChinDistance * 0.6, y), 1.0, lips);
    sourceY = y - drop * jaw * fade * ramp;
    gap = clamp(-sourceY / 1.2, 0.0, 1.0);
    depth = 1.0 + sourceY / max(drop * lips, 0.001);
    sourceY = max(sourceY, 0.0);
  } else {
    float lift = uOpen * uChinDistance * 0.05 * lips * (1.0 - smoothstep(0.0, uChinDistance * 0.4, -y));
    sourceY = y + lift;
    gap = clamp(sourceY / 1.2, 0.0, 1.0);
    depth = 0.0;
    sourceY = min(sourceY, 0.0);
  }
  p = uMouth + uAxis * x + down * sourceY;

  vec2 uv = p / uImageSize;
  vec4 color = vec4(0.0);
  if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) color = texture2D(uImage, uv);

  // Upper teeth just under the lip, a dark throat, and the tongue toward the lower lip.
  float open = smoothstep(0.15, 0.6, uOpen);
  vec3 throat = vec3(0.07, 0.02, 0.02);
  vec3 tongue = vec3(0.36, 0.13, 0.12);
  vec3 teeth = vec3(0.6, 0.53, 0.44) * (0.55 + 0.45 * lips);
  vec3 mouthColor = mix(throat, tongue, smoothstep(0.55, 1.0, depth) * 0.7);
  mouthColor = mix(mouthColor, teeth, (1.0 - smoothstep(0.1, 0.28, depth)) * open);
  // Shade toward the corners.
  mouthColor *= 0.6 + 0.4 * lips;
  gl_FragColor = mix(color, vec4(mouthColor, 1.0), gap);
}
`;

/** Volume above which the voice counts as loud, as in the 3D lip-sync. */
const VOLUME_FULL = 80;

export type TalkingPortraitProps = {
  imageUrl: string;
  isSpeaking: boolean;
  isProcessing?: boolean;
  ttsAnalyserRef: React.RefObject<AnalyserLike | null>;
  onVoiceVolume?: (volume: number) => void;
  /** No usable face or no WebGL: the caller shows something else. */
  onUnavailable?: () => void;
  /** The first frame was drawn. */
  onReady?: () => void;
  /** Hand-placed face points, mouth strength and framing set by content staff. */
  settings?: PortraitSettings | null;
};

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "Shader compile failed");
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Shader link failed");
  }
  return program;
}

/** Head and shoulders, with the face a little above the middle. */
function frameView(face: PortraitFace, width: number, height: number, zoom: number) {
  const scale = Math.max((face.faceHeight * 3.8) / height, (face.faceHeight * 2.8) / width) / zoom;
  return {
    scale,
    origin: [face.faceCenter[0] - (width * scale) / 2, face.faceCenter[1] - height * scale * 0.36] as const,
  };
}

/**
 * A portrait that talks: the character's own image, with the jaw, lips, eyes and
 * head moved by a shader. Keeps the face exactly as drawn, which image-to-3D
 * models don't.
 */
export function TalkingPortrait({
  imageUrl,
  isSpeaking,
  isProcessing = false,
  ttsAnalyserRef,
  onVoiceVolume,
  onUnavailable,
  onReady,
  settings,
}: TalkingPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The draw loop reads the latest props through refs instead of restarting.
  const stateRef = useRef({ isSpeaking, isProcessing });
  const onVoiceVolumeRef = useRef(onVoiceVolume);
  const onUnavailableRef = useRef(onUnavailable);
  const onReadyRef = useRef(onReady);
  const mouthOpen = settings?.mouthOpen ?? 1;
  const zoom = settings?.zoom ?? 1;
  const tuningRef = useRef({ mouthOpen, zoom });
  const resizeRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    stateRef.current = { isSpeaking, isProcessing };
    onVoiceVolumeRef.current = onVoiceVolume;
    onUnavailableRef.current = onUnavailable;
    onReadyRef.current = onReady;
  });
  useEffect(() => {
    tuningRef.current = { mouthOpen, zoom };
    resizeRef.current?.();
  }, [mouthOpen, zoom]);

  // Hand-placed points only fit the image they were placed on.
  const manualPoints = settings?.points && settings.imageUrl === imageUrl ? settings.points : undefined;
  const pointsKey = manualPoints ? JSON.stringify(manualPoints) : "";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let frame = 0;
    let cleanupGl: (() => void) | undefined;

    (async () => {
      const image = await loadPortraitImage(imageUrl);
      const points = pointsKey ? (JSON.parse(pointsKey) as PortraitSettings["points"]) : undefined;
      const face = points
        ? layoutFromPoints(points, image.naturalWidth, image.naturalHeight)
        : await detectPortraitFace(imageUrl, image);
      if (disposed) return;
      if (!face) throw new Error("Không tìm thấy khuôn mặt trong ảnh");

      const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
      if (!gl) throw new Error("Trình duyệt không hỗ trợ WebGL");
      const program = createProgram(gl);
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "aPosition");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const u = (name: string) => gl.getUniformLocation(program, name);
      gl.uniform2f(u("uImageSize"), face.imageWidth, face.imageHeight);
      gl.uniform2f(u("uAxis"), ...face.axis);
      gl.uniform2f(u("uMouth"), ...face.mouth);
      gl.uniform1f(u("uMouthHalfWidth"), face.mouthHalfWidth);
      gl.uniform1f(u("uChinDistance"), face.chinDistance);
      gl.uniform2f(u("uJawExtent"), ...face.jawExtent);
      gl.uniform2f(u("uChin"), ...face.chin);
      gl.uniform1f(u("uFaceHeight"), face.faceHeight);
      const [left, right] = face.eyes;
      gl.uniform4f(u("uEyeL"), ...left.center, left.halfWidth, left.height);
      gl.uniform4f(u("uEyeR"), ...right.center, right.halfWidth, right.height);
      gl.uniform2f(u("uLidL"), ...left.upperLid);
      gl.uniform2f(u("uLidR"), ...right.upperLid);

      const uniforms = {
        canvasSize: u("uCanvasSize"),
        viewOrigin: u("uViewOrigin"),
        viewScale: u("uViewScale"),
        open: u("uOpen"),
        tilt: u("uHeadTilt"),
        nod: u("uHeadNod"),
        blink: u("uBlink"),
      };

      const resize = () => {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
        const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        gl.viewport(0, 0, width, height);
        const view = frameView(face, width, height, tuningRef.current.zoom);
        gl.uniform2f(uniforms.canvasSize, width, height);
        gl.uniform2f(uniforms.viewOrigin, ...view.origin);
        gl.uniform1f(uniforms.viewScale, view.scale);
      };
      resize();
      resizeRef.current = resize;
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);

      let bins = new Uint8Array(0);
      let open = 0;
      let speech = 0;
      let nextBlink = performance.now() + 1500;
      const start = performance.now();
      let drawn = false;

      const draw = (now: number) => {
        const t = (now - start) / 1000;
        const { isSpeaking: speaking, isProcessing: thinking } = stateRef.current;

        let volume = 0;
        const analyser = ttsAnalyserRef.current;
        if (analyser && speaking) {
          if (bins.length !== analyser.frequencyBinCount) bins = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(bins);
          let sum = 0;
          for (let i = 0; i < 16; i++) sum += bins[i] ?? 0;
          volume = Math.min(sum / 16 / VOLUME_FULL, 1);
        } else if (speaking) {
          // No audio to read (browser speech): move the mouth in a speech-like rhythm.
          volume = Math.max(0, Math.sin(t * 11) * 0.5 + Math.sin(t * 7.3) * 0.35);
        }
        onVoiceVolumeRef.current?.(volume);
        // Opens fast, closes a little slower, like a jaw.
        const target = Math.min(volume * tuningRef.current.mouthOpen, 1.6);
        open += (target - open) * (target > open ? 0.55 : 0.3);
        speech += ((speaking ? 1 : 0) - speech) * 0.05;

        let blink = 0;
        if (now >= nextBlink) {
          const phase = (now - nextBlink) / 160;
          if (phase >= 1) nextBlink = now + 2500 + Math.random() * 3000;
          else blink = Math.sin(phase * Math.PI);
        }

        const tilt = Math.sin(t * 0.6) * 0.012 + Math.sin(t * 2.7) * 0.018 * speech + (thinking ? Math.sin(t * 1.4) * 0.02 : 0);
        const nod = face.faceHeight * (Math.sin(t * 0.9) * 0.004 + open * 0.02 * speech);

        gl.uniform1f(uniforms.open, open);
        gl.uniform1f(uniforms.tilt, tilt);
        gl.uniform1f(uniforms.nod, nod);
        gl.uniform1f(uniforms.blink, blink);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (!drawn) {
          drawn = true;
          onReadyRef.current?.();
        }
        frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);

      cleanupGl = () => {
        resizeRef.current = null;
        observer.disconnect();
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      };
      if (disposed) cleanupGl();
    })().catch((error) => {
      if (disposed) return;
      console.warn("[TalkingPortrait]", error);
      onUnavailableRef.current?.();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cleanupGl?.();
    };
  }, [imageUrl, ttsAnalyserRef, pointsKey]);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}

import { axiosClient, refreshAccessToken } from "@/configs/axios.client";
import { useAuthStore } from "@/store/auth.store";

/**
 * Giọng đọc của nhân vật do BE tạo (VieNeu-TTS tự host), nên mọi thiết bị nghe cùng một giọng.
 * Không còn dùng giọng của trình duyệt hay Azure.
 */

const DEFAULT_SAMPLE_RATE = 24000;
/** Gom tối thiểu ngần này âm thanh trước khi bắt đầu một câu, để không bị ngắt khi mạng chậm. */
const PREBUFFER_SECONDS = 0.3;
/** Sau khi đã phát, mỗi đoạn lên lịch ít nhất ngần này để không tạo quá nhiều node âm thanh. */
const MIN_CHUNK_SECONDS = 0.1;
const START_DELAY_SECONDS = 0.05;

/** Tải cả câu dạng WAV, dùng cho nghe thử giọng. */
export async function synthesizeCharacterSpeech(
  characterId: string,
  text: string,
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  const res = await axiosClient.post<ArrayBuffer>(
    "/chat/tts",
    { characterId, text },
    { responseType: "arraybuffer", timeout: 60000, signal },
  );
  if (!res.data || res.data.byteLength === 0) {
    throw new Error("Không nhận được âm thanh giọng đọc");
  }
  return res.data;
}

/** Mở luồng PCM 16-bit mono của một câu. Âm thanh về dần trong lúc BE đang tạo. */
export async function openCharacterSpeechStream(
  characterId: string,
  text: string,
  signal?: AbortSignal,
): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const basePath = process.env.NEXT_PUBLIC_API_BASE_PATH || "/Historical-tell/api/v1";
  const send = (accessToken?: string) =>
    fetch(`${baseUrl}${basePath}/chat/tts/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ characterId, text }),
      signal,
    });

  let response = await send(useAuthStore.getState().tokens?.accessToken);
  // fetch() không đi qua axios interceptor nên phải tự làm mới token khi 401
  if (response.status === 401) {
    response = await send(await refreshAccessToken());
  }
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || `Giọng đọc lỗi: ${response.status}`);
  }
  return response;
}

const MIN_SEGMENT_LENGTH = 12;
const MAX_SEGMENT_LENGTH = 400;
const EARLY_BREAK_MIN_LENGTH = 35;
const EARLY_BREAK_MIN_INDEX = 20;

/**
 * Vị trí ngay sau dấu phẩy đầu tiên đủ xa đầu câu, để đọc cụm đầu trước khi có dấu chấm.
 * Trả về -1 nếu chưa nên ngắt.
 */
export function findEarlyBreak(text: string): number {
  if (text.length < EARLY_BREAK_MIN_LENGTH) return -1;
  const match = /[,;:]\s/.exec(text.slice(EARLY_BREAK_MIN_INDEX));
  return match ? EARLY_BREAK_MIN_INDEX + match.index + 1 : -1;
}

/**
 * Tách câu trả lời thành từng câu để câu đầu được đọc sớm.
 * Bỏ dấu "---" (BE dùng để tách bong bóng chat), gộp câu quá ngắn, cắt câu quá dài.
 * Với earlyFirst, câu đầu được ngắt tiếp ở dấu phẩy để bắt đầu đọc sớm hơn nữa.
 */
export function splitSpeechSegments(text: string, options: { earlyFirst?: boolean } = {}): string[] {
  const sentences = text
    .replace(/^\s*-{3,}\s*$/gm, "\n")
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1);

  const segments: string[] = [];
  for (const sentence of sentences) {
    const last = segments[segments.length - 1];
    if (last !== undefined && last.length < MIN_SEGMENT_LENGTH) {
      segments[segments.length - 1] = `${last} ${sentence}`;
    } else {
      segments.push(sentence);
    }
  }

  if (options.earlyFirst && segments.length > 0) {
    const cut = findEarlyBreak(segments[0]);
    if (cut > 0) {
      segments.splice(0, 1, segments[0].slice(0, cut).trim(), segments[0].slice(cut).trim());
    }
  }

  return segments.flatMap((segment) => {
    if (segment.length <= MAX_SEGMENT_LENGTH) return [segment];
    const pieces: string[] = [];
    let rest = segment;
    while (rest.length > MAX_SEGMENT_LENGTH) {
      const cut = Math.max(rest.lastIndexOf(",", MAX_SEGMENT_LENGTH), rest.lastIndexOf(" ", MAX_SEGMENT_LENGTH));
      const index = cut > 0 ? cut + 1 : MAX_SEGMENT_LENGTH;
      pieces.push(rest.slice(0, index).trim());
      rest = rest.slice(index).trim();
    }
    if (rest) pieces.push(rest);
    return pieces;
  });
}

function parseSampleRate(format: string | null): number {
  const rate = format ? /rate=(\d+)/.exec(format)?.[1] : undefined;
  return rate ? Number(rate) : DEFAULT_SAMPLE_RATE;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const merged = new Uint8Array(a.length + b.length);
  merged.set(a, 0);
  merged.set(b, a.length);
  return merged;
}

function pcm16ToFloat32(bytes: Uint8Array): Float32Array<ArrayBuffer> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const samples = new Float32Array(bytes.byteLength / 2);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = view.getInt16(i * 2, true) / 32768;
  }
  return samples;
}

export interface StreamingSpeechPlayer {
  /** Đọc một câu sau các câu đã xếp hàng. Resolve khi câu đó phát xong hoặc bị dừng. */
  enqueue(text: string): Promise<void>;
  /** Dừng ngay: hủy các câu đang tải và đang phát. */
  stop(): void;
  isPlaying(): boolean;
}

/**
 * Phát âm thanh ngay khi từng phần về tới, không chờ cả câu.
 * Câu sau được tải trong lúc câu trước đang phát, và được nối liền vào cùng một dòng thời gian.
 */
export function createStreamingSpeechPlayer(options: {
  getContext: () => Promise<AudioContext>;
  getDestination: (context: AudioContext) => AudioNode;
  open: (text: string, signal: AbortSignal) => Promise<Response>;
}): StreamingSpeechPlayer {
  let generation = 0;
  let downloadChain: Promise<unknown> = Promise.resolve();
  let nextStartTime = 0;
  let context: AudioContext | null = null;
  const sources = new Set<AudioBufferSourceNode>();
  const controllers = new Set<AbortController>();

  const schedule = (ctx: AudioContext, destination: AudioNode, samples: Float32Array<ArrayBuffer>, rate: number) => {
    const buffer = ctx.createBuffer(1, samples.length, rate);
    buffer.copyToChannel(samples, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(destination);
    const startAt = Math.max(nextStartTime, ctx.currentTime + START_DELAY_SECONDS);
    source.start(startAt);
    nextStartTime = startAt + buffer.duration;
    sources.add(source);
    source.onended = () => sources.delete(source);
  };

  /** Tải và lên lịch phát một câu. Trả về thời điểm câu đó phát xong. */
  const download = async (text: string, currentGeneration: number): Promise<number> => {
    const controller = new AbortController();
    controllers.add(controller);
    try {
      const ctx = await options.getContext();
      context = ctx;
      const response = await options.open(text, controller.signal);
      const rate = parseSampleRate(response.headers.get("X-Audio-Format"));
      const destination = options.getDestination(ctx);
      const reader = response.body!.getReader();
      let pending: Uint8Array = new Uint8Array(0);

      for (;;) {
        const { done, value } = await reader.read();
        if (currentGeneration !== generation) {
          await reader.cancel().catch(() => {});
          return 0;
        }
        if (value) pending = concatBytes(pending, value);

        const idle = nextStartTime <= ctx.currentTime + START_DELAY_SECONDS;
        const minBytes = Math.round(rate * (idle ? PREBUFFER_SECONDS : MIN_CHUNK_SECONDS)) * 2;
        if (pending.length >= minBytes || (done && pending.length >= 2)) {
          const usable = pending.length - (pending.length % 2);
          schedule(ctx, destination, pcm16ToFloat32(pending.subarray(0, usable)), rate);
          pending = pending.slice(usable);
        }
        if (done) return nextStartTime;
      }
    } finally {
      controllers.delete(controller);
    }
  };

  const waitUntil = (endTime: number, currentGeneration: number) =>
    new Promise<void>((resolve) => {
      const check = () => {
        if (currentGeneration !== generation || !context || context.currentTime >= endTime - 0.02) {
          resolve();
          return;
        }
        setTimeout(check, Math.max(20, (endTime - context.currentTime) * 1000));
      };
      check();
    });

  return {
    enqueue(text: string) {
      const currentGeneration = generation;
      const scheduled = downloadChain.then(() =>
        currentGeneration === generation ? download(text, currentGeneration) : 0,
      );
      downloadChain = scheduled.catch(() => 0);
      return scheduled.then(
        (endTime) => waitUntil(endTime, currentGeneration),
        (err) => {
          if (currentGeneration === generation) {
            console.warn("[CharacterSpeech] Không đọc được câu:", err);
          }
        },
      );
    },

    stop() {
      generation += 1;
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
      sources.forEach((source) => {
        try {
          source.stop();
        } catch {
          // Đã dừng rồi
        }
      });
      sources.clear();
      nextStartTime = 0;
    },

    isPlaying() {
      return sources.size > 0;
    },
  };
}

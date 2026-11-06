import { axiosClient } from "@/configs/axios.client";

/**
 * Giọng đọc của nhân vật do BE tạo (VieNeu-TTS tự host), nên mọi thiết bị nghe cùng một giọng.
 * Không còn dùng giọng của trình duyệt hay Azure.
 */
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

const MAX_SEGMENT_LENGTH = 400;
const MIN_SEGMENT_LENGTH = 12;

/**
 * Tách câu trả lời thành từng câu để câu đầu được đọc sớm.
 * Bỏ dấu "---" (BE dùng để tách bong bóng chat), gộp câu quá ngắn, cắt câu quá dài.
 */
export function splitSpeechSegments(text: string): string[] {
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

/**
 * Hàng đợi đọc: câu sau được tạo âm thanh trong lúc câu trước đang phát,
 * nên giữa các câu không phải chờ. Các câu vẫn được tạo và phát đúng thứ tự.
 */
export function createSpeechQueue(
  synthesize: (text: string) => Promise<ArrayBuffer>,
  play: (audio: ArrayBuffer) => Promise<void>,
) {
  let synthesisChain: Promise<unknown> = Promise.resolve();
  let playbackChain: Promise<void> = Promise.resolve();
  let generation = 0;

  return {
    enqueue(text: string): Promise<void> {
      const currentGeneration = generation;
      const audio = synthesisChain.then(() =>
        currentGeneration === generation ? synthesize(text) : null,
      );
      synthesisChain = audio.catch(() => null);

      playbackChain = playbackChain.then(async () => {
        try {
          const buffer = await audio;
          if (buffer && currentGeneration === generation) {
            await play(buffer);
          }
        } catch (err) {
          if (currentGeneration === generation) {
            console.warn("[CharacterSpeech] Không đọc được câu:", err);
          }
        }
      });
      return playbackChain;
    },

    /** Bỏ các câu đang chờ. Câu đang phát phải được dừng riêng. */
    cancel() {
      generation += 1;
    },
  };
}

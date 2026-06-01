/**
 * Chia text thành sentences và TTS từng câu để phát streaming
 * Giảm perceived latency cho câu trả lời dài
 * 
 * NOTE: Hàm này chỉ dùng cho client-side direct API calls.
 * Server-side caching được xử lý trong /api/voice/stream
 */

import { getVoiceForCharacter, ttsCache } from "./tts-cache";

export function splitToSentences(text: string): string[] {
  // Tách theo dấu câu tiếng Việt: . ! ?
  return text
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * TTS stream - Gọi TTS cho từng câu và phát luôn
 * Thay vì chờ full audio, bắt đầu phát câu đầu tiên ngay
 * 
 * Chỉ dùng trên client với direct API calls (không qua server)
 * Note: ttsCache trên client là in-memory, không shared giữa sessions
 */
export async function* streamTTS(
  sentences: string[],
  characterId: string,
  apiKey: string
): AsyncGenerator<{ audio: ArrayBuffer; text: string; index: number }, void, unknown> {
  const voiceName = getVoiceForCharacter(characterId);
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    
    // Skip TTS cho câu quá ngắn
    if (sentence.length < 3) continue;

    // Check cache first (client-side cache)
    const cached = ttsCache.get(sentence, voiceName);
    if (cached) {
      console.log(`[streamTTS] Client cache hit: "${sentence.slice(0, 30)}..."`);
      yield { 
        audio: cached.audio.buffer.slice(
          cached.audio.byteOffset, 
          cached.audio.byteOffset + cached.audio.byteLength
        ) as ArrayBuffer, 
        text: sentence, 
        index: i 
      };
      continue;
    }

    const ttsBody = {
      contents: [{ parts: [{ text: sentence }], role: "user" }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ttsBody),
      }
    );

    if (!res.ok) {
      console.error("TTS error for sentence:", sentence);
      continue;
    }

    const data = await res.json();
    const audioPart = data.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData?.mimeType?.startsWith("audio/")
    );

    if (audioPart?.inlineData?.data) {
      const audioBuf = Buffer.from(audioPart.inlineData.data, "base64");
      
      // Store in client cache
      ttsCache.set(sentence, voiceName, audioBuf, "audio/wav");
      
      yield { 
        audio: audioBuf.buffer.slice(
          audioBuf.byteOffset, 
          audioBuf.byteOffset + audioBuf.byteLength
        ) as ArrayBuffer, 
        text: sentence, 
        index: i 
      };
    }
  }
}

// Re-export for convenience
export { getVoiceForCharacter, ttsCache };

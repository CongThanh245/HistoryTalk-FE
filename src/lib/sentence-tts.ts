/**
 * Chia text thành sentences và TTS từng câu để phát streaming
 * Giảm perceived latency cho câu trả lời dài
 */

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
 */
export async function* streamTTS(
  sentences: string[],
  characterId: string,
  apiKey: string
): AsyncGenerator<{ audio: ArrayBuffer; text: string; index: number }, void, unknown> {
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    
    // Skip TTS cho câu quá ngắn
    if (sentence.length < 3) continue;

    const ttsBody = {
      contents: [{ parts: [{ text: sentence }], role: "user" }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: getVoiceForCharacter(characterId) },
          },
        },
      },
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
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
      const audio = Buffer.from(audioPart.inlineData.data, "base64");
      yield { audio: audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength), text: sentence, index: i };
    }
  }
}

function getVoiceForCharacter(characterId: string): string {
  const voiceMap: Record<string, string> = {
    "nguyen-hue": "Fenrir",
    "tran-hung-dao": "Charon",
    "ly-thuong-kiet": "Charon",
    "ho-chi-minh": "Fenrir",
    "hai-ba-trung": "Aoede",
    "nguyen-trai": "Puck",
  };
  return voiceMap[characterId] ?? "Aoede";
}

export const runtime = 'edge';

/**
 * POST /api/voice/stream
 * Streaming TTS - Trả về audio chunks qua Server-Sent Events
 * Chia câu trả lời thành sentences, TTS từng câu và stream về client
 *
 * Request: multipart/form-data { audio: File, sessionId, characterId, contextId }
 * Response: text/event-stream với các event:
 *   - userTranscript: { text: string }
 *   - assistantSentence: { text: string, index: number }
 *   - audioChunk: { data: base64, index: number, isLast: boolean }
 *   - error: { message: string }
 *   - done
 */

import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ttsCache, getVoiceForCharacter } from "@/lib/tts-cache";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Split text to sentences (Vietnamese)
function splitToSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, "$1|")
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// getVoiceForCharacter imported from @/lib/tts-cache

// PCM to WAV conversion (Gemini TTS returns raw PCM L16 24000Hz)
function pcmToWav(pcmData: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;
  const dataSize = pcmData.length;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

// TTS for a single sentence with caching
async function ttsSentence(
  text: string,
  characterId: string
): Promise<Buffer | null> {
  try {
    const voiceName = getVoiceForCharacter(characterId);
    
    // Check cache first
    const cached = ttsCache.get(text, voiceName);
    if (cached) {
      console.log(`[TTS Stream] Cache hit for: "${text.slice(0, 30)}..." (${voiceName})`);
      return cached.audio;
    }
    
    // Call Gemini 1.5 Flash TTS API
    const ttsBody = {
      contents: [{ parts: [{ text }], role: "user" }],
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ttsBody),
      }
    );

    if (!res.ok) {
      console.error("TTS error:", await res.text());
      return null;
    }

    const data = await res.json();
    const audioPart = data.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData?.mimeType?.startsWith("audio/")
    );

    if (audioPart?.inlineData?.data) {
      const pcmBuffer = Buffer.from(audioPart.inlineData.data, "base64");
      // Convert PCM to WAV so browser can decode it
      const wavBuffer = pcmToWav(pcmBuffer);
      
      // Store in cache
      ttsCache.set(text, voiceName, wavBuffer, "audio/wav");
      
      return wavBuffer;
    }
    return null;
  } catch (err) {
    console.error("TTS error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", message: "GEMINI_API_KEY chưa được cấu hình" })}\n\n`,
      { status: 500, headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Parse form data
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File | null;
        const sessionId = formData.get("sessionId") as string | null;
        const characterId = (formData.get("characterId") as string) || "default";

        if (!audioFile || !sessionId) {
          send({ type: "error", message: "Thiếu audio hoặc sessionId" });
          controller.close();
          return;
        }

        const authHeader = req.headers.get("authorization") ?? "";

        // ── Step 1: STT ──────────────────────────────────────────────────────
        const audioBytes = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(audioBytes).toString("base64");
        const mimeType = (audioFile.type || "audio/webm") as "audio/webm" | "audio/mp4" | "audio/ogg";

        const sttModel = genAI.getGenerativeModel({
          model: "gemini-3.5-flash",
          systemInstruction:
            "Bạn là một bộ chuyển giọng nói thành văn bản (STT). Chỉ trả về CHÍNH XÁC những gì người dùng nói.",
        });

        const sttResult = await sttModel.generateContent([
          { inlineData: { data: base64Audio, mimeType } },
          { text: "Hãy chuyển audio này thành văn bản tiếng Việt." },
        ]);

        const userTranscript = sttResult.response.text().trim().replace(/^["']|["']$/g, "");

        if (!userTranscript) {
          send({ type: "error", message: "Không nhận dạng được giọng nói" });
          controller.close();
          return;
        }

        // Send user transcript immediately
        send({ type: "userTranscript", text: userTranscript });

        // ── Step 2: Chat ──────────────────────────────────────────────────────
        const BE_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
        const BE_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api/v1";
        const beEndpoint = `${BE_BASE_URL}${BE_BASE_PATH}/chat/messages`;

        const beRes = await fetch(beEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({ sessionId, content: userTranscript, messageType: "VOICE" }),
        });

        if (!beRes.ok) {
          send({ type: "error", message: `Backend lỗi: ${beRes.status}` });
          controller.close();
          return;
        }

        const beJson = await beRes.json();
        const aiResponse = beJson.data?.assistantMessage?.content?.trim() ?? "";

        if (!aiResponse) {
          send({ type: "error", message: "Backend không trả về câu trả lời" });
          controller.close();
          return;
        }

        // ── Step 3: Streaming TTS ───────────────────────────────────────────
        const sentences = splitToSentences(aiResponse);

        // Send sentences first (so UI can display text)
        for (let i = 0; i < sentences.length; i++) {
          send({ type: "assistantSentence", text: sentences[i], index: i });
        }

        // Stream audio for each sentence
        for (let i = 0; i < sentences.length; i++) {
          const sentence = sentences[i];
          if (sentence.length < 3) continue; // Skip very short sentences

          // Small delay between sentences for natural pacing
          if (i > 0) await new Promise((r) => setTimeout(r, 200));

          const audioBuffer = await ttsSentence(sentence, characterId);

          if (audioBuffer) {
            const base64Audio = audioBuffer.toString("base64");
            send({
              type: "audioChunk",
              data: base64Audio,
              index: i,
              isLast: i === sentences.length - 1,
            });
          }
        }

        send({ type: "done" });
        controller.close();
      } catch (err: any) {
        console.error("[Stream] Error:", err);
        send({ type: "error", message: err.message || "Lỗi không xác định" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

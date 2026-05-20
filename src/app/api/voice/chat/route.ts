/**
 * POST /api/voice/chat
 *
 * Pipeline: audio → Gemini (STT + LLM) → Gemini TTS → audio/wav
 *
 * Request  : multipart/form-data { audio: File, sessionId, characterId, contextId }
 * Response : audio/wav binary
 *   Headers: X-User-Transcript      (URL-encoded)
 *            X-Assistant-Transcript (URL-encoded)
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getCharacterPrompt,
  getOrCreateSession,
  pushToSession,
  pcmToWav,
} from "@/lib/voice-gemini";

// ── Gemini client (module-level, shared across requests) ─────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 0. Guard: API key
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { message: "GEMINI_API_KEY chưa được cấu hình trong .env.local" },
      { status: 500 },
    );
  }

  // 1. Parse multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { message: "Request body phải là multipart/form-data" },
      { status: 400 },
    );
  }

  const audioFile = formData.get("audio") as File | null;
  const sessionId = (formData.get("sessionId") as string) || "default";
  const characterId = (formData.get("characterId") as string) || "default";
  // contextId reserved for future use (e.g. RAG context)
  // const contextId = formData.get("contextId") as string;

  if (!audioFile || audioFile.size === 0) {
    return NextResponse.json({ message: "Thiếu file audio" }, { status: 400 });
  }

  try {
    // ── Step 1 + 2: STT + LLM — một lần gọi Gemini ─────────────────────────
    const audioBytes = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBytes).toString("base64");
    const mimeType = (audioFile.type || "audio/webm") as
      | "audio/webm"
      | "audio/mp4"
      | "audio/ogg";

    const characterPrompt = getCharacterPrompt(characterId);
    const history = getOrCreateSession(sessionId);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction: `${characterPrompt}

Khi người dùng nói chuyện với bạn qua âm thanh, hãy:
1. Nhận biết chính xác nội dung họ nói (bằng tiếng Việt hoặc ngôn ngữ họ dùng).
2. Trả lời ngắn gọn, súc tích (2-4 câu) với tư cách là nhân vật lịch sử đó.
3. Luôn trả về đúng định dạng JSON sau và KHÔNG thêm bất kỳ text nào khác ngoài JSON:
{"userTranscript":"<nội dung người dùng nói>","response":"<câu trả lời của bạn>"}`,
    });

    const chat = model.startChat({ history });

    const llmResult = await chat.sendMessage([
      {
        inlineData: {
          data: base64Audio,
          mimeType,
        },
      },
      {
        text: "Hãy lắng nghe âm thanh và phản hồi theo định dạng JSON đã yêu cầu.",
      },
    ]);

    const rawText = llmResult.response.text().trim();

    // Parse JSON — strip markdown fences nếu model trả thêm
    let userTranscript = "";
    let aiResponse = "";
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      const parsed: { userTranscript?: string; response?: string } =
        JSON.parse(cleaned);
      userTranscript = parsed.userTranscript ?? "";
      aiResponse = parsed.response ?? "";
    } catch {
      // Fallback: coi toàn bộ text là câu trả lời
      aiResponse = rawText;
      console.warn("[VoiceChat] Không parse được JSON, dùng raw text:", rawText);
    }

    // Cập nhật session history
    pushToSession(sessionId, [
      ...(userTranscript
        ? [{ role: "user" as const, parts: [{ text: userTranscript }] }]
        : []),
      ...(aiResponse
        ? [{ role: "model" as const, parts: [{ text: aiResponse }] }]
        : []),
    ]);

    // ── Step 3: TTS — Gemini 2.5 Flash TTS ──────────────────────────────────
    const ttsBody = {
      contents: [
        {
          parts: [{ text: aiResponse || "Xin lỗi, tôi chưa hiểu câu hỏi." }],
          role: "user",
        },
      ],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              // Giọng đọc: Aoede (nữ), Charon (nam trầm), Fenrir (nam), Puck (nam trẻ)
              voiceName: getVoiceForCharacter(characterId),
            },
          },
        },
      },
    };

    const ttsRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ttsBody),
      },
    );

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      console.error("[VoiceChat] TTS API error:", errText);
      return NextResponse.json(
        { message: `Lỗi TTS: ${ttsRes.status}` },
        { status: 502 },
      );
    }

    const ttsData = (await ttsRes.json()) as GeminiTTSResponse;

    const audioPart = ttsData.candidates
      ?.at(0)
      ?.content?.parts?.find(
        (p) => p.inlineData?.mimeType?.startsWith("audio/"),
      );

    if (!audioPart?.inlineData?.data) {
      console.error("[VoiceChat] TTS trả về không có audio part:", ttsData);
      return NextResponse.json(
        { message: "TTS không trả về audio" },
        { status: 502 },
      );
    }

    const rawAudioBuf = Buffer.from(audioPart.inlineData.data, "base64");

    // Gemini TTS trả raw PCM (audio/L16;rate=24000) → cần thêm WAV header
    const isRawPcm =
      audioPart.inlineData.mimeType.includes("L16") ||
      audioPart.inlineData.mimeType === "audio/pcm";

    const outputBuffer = isRawPcm ? pcmToWav(rawAudioBuf) : rawAudioBuf;
    const outputContentType = isRawPcm
      ? "audio/wav"
      : audioPart.inlineData.mimeType;

    // ── Response ─────────────────────────────────────────────────────────────
    // NextResponse accepts Uint8Array (not Buffer directly) as BodyInit
    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": outputContentType,
        "X-User-Transcript": encodeURIComponent(userTranscript),
        "X-Assistant-Transcript": encodeURIComponent(aiResponse),
        "Cache-Control": "no-store",
        "Access-Control-Expose-Headers":
          "X-User-Transcript, X-Assistant-Transcript",
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Lỗi không xác định";
    console.error("[VoiceChat] Unexpected error:", err);
    return NextResponse.json({ message }, { status: 500 });
  }
}

// ── DELETE: xoá session history ──────────────────────────────────────────────
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId") ?? "default";
  const { clearSession } = await import("@/lib/voice-gemini");
  clearSession(sessionId);
  return NextResponse.json({ message: "Session cleared", sessionId });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Map character → giọng TTS phù hợp */
function getVoiceForCharacter(characterId: string): string {
  const voiceMap: Record<string, string> = {
    "nguyen-hue": "Fenrir", // nam, mạnh mẽ
    "tran-hung-dao": "Charon", // nam, trầm ổn
    "ly-thuong-kiet": "Charon",
    "ho-chi-minh": "Fenrir",
    "hai-ba-trung": "Aoede", // nữ
    "nguyen-trai": "Puck",
  };
  return voiceMap[characterId] ?? "Aoede";
}

// ── Type helpers ──────────────────────────────────────────────────────────────
interface GeminiTTSResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          data: string;
          mimeType: string;
        };
      }>;
    };
  }>;
}

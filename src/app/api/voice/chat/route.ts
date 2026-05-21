/**
 * POST /api/voice/chat
 *
 * Pipeline:
 *   (1) audio  ──► Gemini STT       ──► userTranscript
 *   (2) userTranscript ──► Spring Boot /chat/messages (RAG + LLM) ──► aiResponse
 *   (3) aiResponse     ──► Gemini TTS ──► audio/wav
 *
 * Request  : multipart/form-data { audio: File, sessionId, characterId, contextId }
 *            Header: Authorization: Bearer <token>   (forward sang BE)
 * Response : audio/wav binary
 *   Headers: X-User-Transcript      (URL-encoded)
 *            X-Assistant-Transcript (URL-encoded)
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pcmToWav } from "@/lib/voice-gemini";

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
  const sessionId = formData.get("sessionId") as string | null;
  const characterId = (formData.get("characterId") as string) || "default";
  // contextId reserved (BE đã biết qua sessionId)
  // const contextId = formData.get("contextId") as string;

  if (!audioFile || audioFile.size === 0) {
    return NextResponse.json({ message: "Thiếu file audio" }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json(
      { message: "Thiếu sessionId" },
      { status: 400 },
    );
  }

  // Forward Authorization sang BE
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader) {
    return NextResponse.json(
      { message: "Thiếu Authorization để gọi backend" },
      { status: 401 },
    );
  }

  try {
    // ── Step 1: STT — Gemini chỉ làm transcribe ────────────────────────────
    const audioBytes = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBytes).toString("base64");
    const mimeType = (audioFile.type || "audio/webm") as
      | "audio/webm"
      | "audio/mp4"
      | "audio/ogg";

    const sttModel = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction:
        "Bạn là một bộ chuyển giọng nói thành văn bản (STT). Chỉ trả về CHÍNH XÁC những gì người dùng nói trong audio, KHÔNG diễn giải, KHÔNG thêm dấu nháy, KHÔNG thêm bất kỳ text nào khác. Nếu không nghe rõ, trả về chuỗi rỗng.",
    });

    const sttResult = await sttModel.generateContent([
      { inlineData: { data: base64Audio, mimeType } },
      { text: "Hãy chuyển audio này thành văn bản tiếng Việt." },
    ]);

    const userTranscript = sttResult.response
      .text()
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!userTranscript) {
      return NextResponse.json(
        { message: "Không nghe rõ nội dung, vui lòng thử lại" },
        { status: 422 },
      );
    }

    // ── Step 2: Gọi Spring Boot /chat/messages (RAG + LLM) ─────────────────
    const BE_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
    const BE_BASE_PATH =
      process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api/v1";
    const beEndpoint = `${BE_BASE_URL}${BE_BASE_PATH}/chat/messages`;

    const beRes = await fetch(beEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ sessionId, content: userTranscript }),
    });

    if (!beRes.ok) {
      const errText = await beRes.text();
      console.error("[VoiceChat] BE /chat/messages error:", beRes.status, errText);
      return NextResponse.json(
        { message: `Backend lỗi: ${beRes.status}` },
        { status: 502 },
      );
    }

    const beJson = (await beRes.json()) as {
      data?: {
        assistantMessage?: { content?: string };
      };
    };

    const aiResponse = beJson.data?.assistantMessage?.content?.trim() ?? "";
    if (!aiResponse) {
      return NextResponse.json(
        { message: "Backend không trả về câu trả lời" },
        { status: 502 },
      );
    }

    // ── Step 3: TTS — Gemini 2.5 Flash TTS ──────────────────────────────────
    const ttsBody = {
      contents: [
        {
          parts: [{ text: aiResponse }],
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

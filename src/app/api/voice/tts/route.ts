import { NextRequest, NextResponse } from "next/server";
import { ttsCache } from "@/lib/tts-cache";
import {
  AZURE_SPEECH_MIME_TYPE,
  getTtsCacheVoiceKey,
  isAzureSpeechConfigured,
  synthesizeWithAzureSpeech,
} from "@/lib/azure-speech-tts";

export const runtime = "edge";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAzureSpeechConfigured()) {
    return NextResponse.json(
      { message: "Azure Speech chua duoc cau hinh" },
      { status: 503 },
    );
  }

  let body: { text?: string; characterId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Request body phai la JSON" },
      { status: 400 },
    );
  }

  const text = body.text?.trim() ?? "";
  const characterId = body.characterId || "default";

  if (!text) {
    return NextResponse.json({ message: "Thieu text" }, { status: 400 });
  }

  const voiceName = getTtsCacheVoiceKey(characterId);
  const cached = ttsCache.get(text, voiceName);

  if (cached) {
    return new NextResponse(new Uint8Array(cached.audio), {
      status: 200,
      headers: {
        "Content-Type": cached.mimeType,
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    const audio = await synthesizeWithAzureSpeech(text, characterId);
    ttsCache.set(text, voiceName, audio, AZURE_SPEECH_MIME_TYPE);

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": AZURE_SPEECH_MIME_TYPE,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    console.error("[VoiceTTS] Azure Speech error:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Loi Azure Speech" },
      { status: 502 },
    );
  }
}

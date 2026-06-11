import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      message:
        "Legacy voice chat endpoint is disabled. Use Web Speech STT with /api/voice/tts for Azure TTS.",
    },
    { status: 410 },
  );
}

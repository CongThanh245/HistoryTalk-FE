export const runtime = "edge";

export async function POST(): Promise<Response> {
  const payload = {
    type: "error",
    message:
      "Legacy voice stream endpoint is disabled. Use Web Speech STT with /api/voice/tts for Azure TTS.",
  };

  return new Response(`data: ${JSON.stringify(payload)}\n\n`, {
    status: 410,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

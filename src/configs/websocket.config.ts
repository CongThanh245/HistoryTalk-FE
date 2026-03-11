// src/configs/websocket.config.ts

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "ws://localhost:8080"}/Historical-tell`
    .replace("http://", "ws://")
    .replace("https://", "wss://");

export function buildVoiceWsUrl(
  sessionId: string,
  characterId: string,
  contextId: string,
) {
  return `${WS_BASE_URL}/ws/voice/${sessionId}?characterId=${characterId}&contextId=${contextId}`;
}
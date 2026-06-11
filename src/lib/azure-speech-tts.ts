const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY ?? "";
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION ?? "";
const AZURE_SPEECH_ENDPOINT = process.env.AZURE_SPEECH_ENDPOINT ?? "";
const AZURE_SPEECH_VOICE = process.env.AZURE_SPEECH_VOICE ?? "";

const OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";
export const AZURE_SPEECH_MIME_TYPE = "audio/mpeg";

const AZURE_VOICE_MAP: Record<string, string> = {
  "nguyen-hue": "vi-VN-HoaiMyNeural",
  "hai-ba-trung": "vi-VN-HoaiMyNeural",
  "vo-thi-sau": "vi-VN-HoaiMyNeural",
  "le-thi-hoa": "vi-VN-HoaiMyNeural",
  "tran-hung-dao": "vi-VN-NamMinhNeural",
  "ly-thuong-kiet": "vi-VN-NamMinhNeural",
  "ho-chi-minh": "vi-VN-NamMinhNeural",
  "nguyen-trai": "vi-VN-NamMinhNeural",
  "nguyen-tri-phuong": "vi-VN-NamMinhNeural",
  "pham-ngu-lao": "vi-VN-NamMinhNeural",
  default: "vi-VN-HoaiMyNeural",
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getAzureTtsUrl(): string {
  if (AZURE_SPEECH_ENDPOINT) {
    return `${AZURE_SPEECH_ENDPOINT.replace(/\/$/, "")}/cognitiveservices/v1`;
  }

  if (!AZURE_SPEECH_REGION) {
    throw new Error("AZURE_SPEECH_REGION chua duoc cau hinh");
  }

  return `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
}

export function getAzureVoiceForCharacter(characterId: string): string {
  return AZURE_SPEECH_VOICE || AZURE_VOICE_MAP[characterId] || AZURE_VOICE_MAP.default;
}

export function getTtsCacheVoiceKey(characterId: string): string {
  return `azure:${getAzureVoiceForCharacter(characterId)}`;
}

export function isAzureSpeechConfigured(): boolean {
  return Boolean(AZURE_SPEECH_KEY && (AZURE_SPEECH_REGION || AZURE_SPEECH_ENDPOINT));
}

export async function synthesizeWithAzureSpeech(
  text: string,
  characterId: string,
): Promise<Uint8Array> {
  if (!isAzureSpeechConfigured()) {
    throw new Error("Azure Speech chua duoc cau hinh");
  }

  const voiceName = getAzureVoiceForCharacter(characterId);
  const ssml = [
    `<speak version="1.0" xml:lang="vi-VN">`,
    `<voice xml:lang="vi-VN" name="${voiceName}">`,
    escapeXml(text),
    `</voice>`,
    `</speak>`,
  ].join("");

  const response = await fetch(getAzureTtsUrl(), {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": OUTPUT_FORMAT,
      "User-Agent": "HistoryTalk",
    },
    body: ssml,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Azure Speech TTS error ${response.status}: ${message}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

/**
 * voice-gemini.ts
 * Helper cho voice pipeline — chỉ còn PCM → WAV conversion.
 * (History & character prompt do Spring Boot backend xử lý qua /chat/messages)
 */

// ── PCM → WAV Conversion ────────────────────────────────────────────────────

/**
 * Thêm WAV header vào raw PCM data (output từ Gemini TTS L16 format).
 * Gemini TTS trả về: 24000 Hz, 16-bit, mono PCM
 */
export function pcmToWav(
  pcmData: Uint8Array,
  sampleRate = 24000,
  channels = 1,
  bitDepth = 16,
): Uint8Array {
  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;
  const dataSize = pcmData.length;

  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  // Helper to write strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      header[offset + i] = str.charCodeAt(i);
    }
  };

  // RIFF chunk
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true); // file size - 8
  writeString(8, "WAVE");

  // fmt sub-chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // sub-chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Concatenate header and PCM data
  const result = new Uint8Array(header.length + pcmData.length);
  result.set(header, 0);
  result.set(pcmData, header.length);
  return result;
}

/**
 * Decode base64 to Uint8Array (Edge Runtime compatible)
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

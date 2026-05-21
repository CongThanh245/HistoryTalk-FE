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
  pcmData: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitDepth = 16,
): Buffer {
  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;
  const dataSize = pcmData.length;

  const header = Buffer.alloc(44);

  // RIFF chunk
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4); // file size - 8
  header.write("WAVE", 8);

  // fmt sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // sub-chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);

  // data sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

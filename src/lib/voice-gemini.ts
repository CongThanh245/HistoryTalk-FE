/**
 * voice-gemini.ts
 * Helpers cho voice pipeline: character prompts, WAV conversion, session store
 */

// ── Character System Prompts ────────────────────────────────────────────────

const CHARACTER_PROMPTS: Record<string, string> = {
  "nguyen-hue": `Bạn là Nguyễn Huệ (Quang Trung Hoàng Đế) — vị anh hùng dân tộc vĩ đại của Việt Nam, người lãnh đạo nghĩa quân Tây Sơn đánh tan 29 vạn quân Thanh mùa xuân năm 1789. Xuất thân bình dân nhưng thiên tài quân sự kiệt xuất, khí phách hiên ngang, quyết đoán. Hãy nói chuyện bằng tiếng Việt, giọng mạnh mẽ, đầy nhiệt huyết, có thể dùng những câu mang hơi thở thời đại. Chia sẻ về chiến lược, lòng yêu nước, khát vọng thống nhất giang sơn.`,

  "tran-hung-dao": `Bạn là Trần Hưng Đạo (Hưng Đạo Đại Vương Trần Quốc Tuấn) — danh tướng kiệt xuất nhà Trần, ba lần lãnh đạo quân dân Đại Việt đánh thắng quân Mông Nguyên. Sâu sắc, mưu lược, trầm tĩnh như núi, tầm nhìn xa rộng. Hãy nói chuyện bằng tiếng Việt, giọng uy nghi, trang trọng. Chia sẻ về "Hịch tướng sĩ", chiến lược "vườn không nhà trống", tinh thần đoàn kết toàn dân.`,

  "ly-thuong-kiet": `Bạn là Lý Thường Kiệt — danh tướng lừng danh thời Lý, tác giả bài thơ thần "Nam quốc sơn hà" — bản tuyên ngôn độc lập đầu tiên của Việt Nam. Uyên bác, văn võ song toàn, yêu nước nồng nàn. Hãy nói chuyện bằng tiếng Việt, giọng điệu trang nhã, có hồn thơ, pha chút cổ kính.`,

  "ho-chi-minh": `Bạn là Chủ tịch Hồ Chí Minh — lãnh tụ kính yêu của nhân dân Việt Nam, người đọc Tuyên ngôn Độc lập ngày 2/9/1945. Giản dị, gần gũi, sâu sắc, tràn đầy tình yêu thương nhân dân. Hãy nói chuyện bằng tiếng Việt, giọng ấm áp, chân thành, thỉnh thoảng dùng những câu ca dao tục ngữ.`,

  "hai-ba-trung": `Bạn là Trưng Trắc — một trong Hai Bà Trưng, người lãnh đạo cuộc khởi nghĩa đầu tiên chống ách đô hộ phương Bắc năm 40 SCN. Dũng cảm, kiên cường, khí tiết anh hùng, lòng yêu nước sâu sắc. Hãy nói chuyện bằng tiếng Việt, giọng quyết đoán, đầy ý chí.`,

  "nguyen-trai": `Bạn là Nguyễn Trãi — nhà chính trị, nhà văn, nhà thơ kiệt xuất thời Lê sơ, tác giả "Bình Ngô Đại Cáo". Trí tuệ sâu rộng, tư tưởng nhân nghĩa, yêu dân như yêu con. Hãy nói chuyện bằng tiếng Việt, giọng sâu sắc, uyên thâm, thỉnh thoảng trích dẫn thơ văn của mình.`,
};

const DEFAULT_PROMPT = `Bạn là một nhân vật lịch sử Việt Nam uyên bác. Hãy trả lời các câu hỏi về lịch sử Việt Nam bằng tiếng Việt, giọng trang trọng, chính xác và thú vị.`;

export function getCharacterPrompt(characterId: string): string {
  return CHARACTER_PROMPTS[characterId] ?? DEFAULT_PROMPT;
}

// ── Session (Conversation History) Store ────────────────────────────────────

export type GeminiMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

const SESSION_MAX_TURNS = 20;
const sessionStore = new Map<string, GeminiMessage[]>();

export function getOrCreateSession(sessionId: string): GeminiMessage[] {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, []);
  }
  return sessionStore.get(sessionId)!;
}

export function pushToSession(
  sessionId: string,
  messages: GeminiMessage[],
): void {
  const history = getOrCreateSession(sessionId);
  history.push(...messages);
  // Trim to max turns (2 messages per turn = user + model)
  if (history.length > SESSION_MAX_TURNS * 2) {
    sessionStore.set(sessionId, history.slice(-SESSION_MAX_TURNS * 2));
  }
}

export function clearSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

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

export const runtime = 'edge';

/**
 * POST /api/voice/stt
 * Chỉ xử lý Speech-to-Text, trả về transcript ngay lập tức
 * Để hiển thị user text trước khi đợi AI trả lời
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { message: "GEMINI_API_KEY chưa được cấu hình" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ message: "Thiếu file audio" }, { status: 400 });
    }

    // STT với Gemini
    const audioBytes = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBytes).toString("base64");
    const mimeType = (audioFile.type || "audio/webm") as "audio/webm" | "audio/mp4" | "audio/ogg";

    const sttModel = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      systemInstruction:
        "Bạn là một bộ chuyển giọng nói thành văn bản (STT). Chỉ trả về CHÍNH XÁC những gì người dùng nói trong audio, KHÔNG diễn giải, KHÔNG thêm dấu nháy, KHÔNG thêm bất kỳ text nào khác.",
    });

    const sttResult = await sttModel.generateContent([
      { inlineData: { data: base64Audio, mimeType } },
      { text: "Hãy chuyển audio này thành văn bản tiếng Việt." },
    ]);

    const transcript = sttResult.response.text().trim().replace(/^["']|["']$/g, "");

    if (!transcript) {
      return NextResponse.json(
        { message: "Không nhận dạng được giọng nói" },
        { status: 422 }
      );
    }

    return NextResponse.json({ transcript }, { status: 200 });
  } catch (err: any) {
    console.error("[STT] Error:", err);
    return NextResponse.json(
      { message: err.message || "Lỗi STT" },
      { status: 500 }
    );
  }
}

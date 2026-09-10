// AI đôi khi trả lời kèm 1 câu hỏi gợi mở, ngăn cách bởi "--".
// Tách thành các đoạn riêng để hiển thị như nhiều tin nhắn liên tiếp thay vì dồn chung 1 bubble.
export const ASSISTANT_SPLIT_PATTERN = /\s*-{2,}\s*/;

export function splitAssistantContent(content: string): string[] {
  return content
    .split(ASSISTANT_SPLIT_PATTERN)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

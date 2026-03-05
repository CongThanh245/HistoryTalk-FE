// TODO: xoá khi có API thực
import type { ChatCharacter, ChatEvent, ChatSession, ChatMessage } from "@/services/chat.service";

export const MOCK_CHARACTERS: Record<string, ChatCharacter> = {
  "ngo-quyen": {
    id: "ngo-quyen",
    name: "Ngô Quyền",
    title: "Tiết độ sứ Tĩnh Hải quân",
    description: "Ngô Quyền (898–944) là vị anh hùng dân tộc, người đã lãnh đạo quân dân Đại Việt đánh tan quân Nam Hán trên sông Bạch Đằng năm 938, chấm dứt hơn 1000 năm Bắc thuộc và mở ra kỷ nguyên độc lập tự chủ của dân tộc.",
    imageUrl: "/ngo-quyen.jpg",
    era: "898–944",
    side: "Đại Việt",
  },
  "liu-hongcao": {
    id: "liu-hongcao",
    name: "Lưu Hoằng Tháo",
    title: "Thái tử Nam Hán",
    description: "Lưu Hoằng Tháo là con trai vua Nam Hán Lưu Cung, chỉ huy đạo thủy quân xâm lược Đại Việt năm 938. Ông đã bại trận và tử trận trong trận Bạch Đằng lịch sử.",
    imageUrl: "/ngo-quyen.jpg", // TODO: thay ảnh riêng
    era: "?–938",
    side: "Nam Hán",
  },
  "duong-dinh-nghe": {
    id: "duong-dinh-nghe",
    name: "Dương Đình Nghệ",
    title: "Tiết độ sứ tiền nhiệm",
    description: "Dương Đình Nghệ là người thầy và nhạc phụ của Ngô Quyền. Ông đã giành lại quyền tự chủ từ tay quân Nam Hán năm 931 nhưng bị Kiều Công Tiễn ám hại năm 937.",
    imageUrl: "/ngo-quyen.jpg",
    era: "?–937",
    side: "Đại Việt",
  },
};

export const MOCK_EVENT: ChatEvent = {
  id: "bach-dang-938",
  title: "Trận Bạch Đằng 938",
  year: 938,
  characters: Object.values(MOCK_CHARACTERS),
};

export const MOCK_SESSIONS: ChatSession[] = [
  {
    id: "session-1",
    characterId: "ngo-quyen",
    eventId: "bach-dang-938",
    title: "Kế sách cọc nhọn Bạch Đằng",
    lastMessage: "Vậy tướng quân đã chuẩn bị kế sách này từ bao giờ?",
    lastMessageAt: new Date(Date.now() - 86400000).toISOString(),
    messageCount: 12,
  },
  {
    id: "session-2",
    characterId: "ngo-quyen",
    eventId: "bach-dang-938",
    title: "Cuộc đời và sự nghiệp",
    lastMessage: "Cảm ơn tướng quân đã chia sẻ!",
    lastMessageAt: new Date(Date.now() - 172800000).toISOString(),
    messageCount: 8,
  },
];

export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    sessionId: "session-new",
    role: "assistant",
    content: "Chào ngươi! Ta là Ngô Quyền, Tiết độ sứ Tĩnh Hải quân. Ngươi muốn hỏi ta điều gì về trận chiến trên sông Bạch Đằng?",
    createdAt: new Date().toISOString(),
  },
];
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ── Types ─────────────────────────────────────────────────

export interface ChatHistoryItem {
  id: string;
  characterId: string;
  characterName: string;
  characterImageUrl: string;
  characterTitle: string;
  eventId: string;
  eventTitle: string;
  eventYear: number;
  lastMessage: string;        // preview tin nhắn cuối
  lastMessageAt: string;      // ISO date
  messageCount: number;
  sessionTitle?: string;
}

export interface ChatHistoryGroup {
  eventId: string;
  eventTitle: string;
  eventYear: number;
  sessions: ChatHistoryItem[];
}

// ── Service ──────────────────────────────────────────────

export const chatHistoryService = {
  // Lấy tất cả lịch sử chat, đã group theo event
  getHistory: async (): Promise<ChatHistoryGroup[]> => {
    const res = await axios.get(`${API_URL}/chat/history`);
    return res.data;
  },

  // Xoá 1 session
  deleteSession: async (sessionId: string): Promise<void> => {
    await axios.delete(`${API_URL}/chat/sessions/${sessionId}`);
  },
};

// ── Mock ─────────────────────────────────────────────────
// TODO: xoá khi có API

export const MOCK_HISTORY: ChatHistoryGroup[] = [
  {
    eventId: "bach-dang-938",
    eventTitle: "Trận Bạch Đằng",
    eventYear: 938,
    sessions: [
      {
        id: "s1",
        characterId: "ngo-quyen",
        characterName: "Ngô Quyền",
        characterImageUrl: "/ngo-quyen.jpg",
        characterTitle: "Tiết độ sứ Tĩnh Hải quân",
        eventId: "bach-dang-938",
        eventTitle: "Trận Bạch Đằng",
        eventYear: 938,
        lastMessage: "Quân Nam Hán đã mắc bẫy cọc nhọn của ta. Khi nước triều rút, thuyền giặc mắc cạn...",
        lastMessageAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        messageCount: 14,
        sessionTitle: "Kế sách cọc nhọn Bạch Đằng",
      },
      {
        id: "s2",
        characterId: "ngo-quyen",
        characterName: "Ngô Quyền",
        characterImageUrl: "/ngo-quyen.jpg",
        characterTitle: "Tiết độ sứ Tĩnh Hải quân",
        eventId: "bach-dang-938",
        eventTitle: "Trận Bạch Đằng",
        eventYear: 938,
        lastMessage: "Ta sinh ra tại Đường Lâm, thuở nhỏ theo học văn võ từ cha...",
        lastMessageAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
        messageCount: 8,
        sessionTitle: "Cuộc đời và sự nghiệp",
      },
      {
        id: "s3",
        characterId: "liu-hongcao",
        characterName: "Lưu Hoằng Tháo",
        characterImageUrl: "/ngo-quyen.jpg",
        characterTitle: "Thái tử Nam Hán",
        eventId: "bach-dang-938",
        eventTitle: "Trận Bạch Đằng",
        eventYear: 938,
        lastMessage: "Ta đã đánh giá thấp chiến thuật của Ngô Quyền. Đó là sai lầm chí mạng...",
        lastMessageAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
        messageCount: 6,
      },
    ],
  },
  {
    eventId: "dong-da-1789",
    eventTitle: "Chiến thắng Ngọc Hồi – Đống Đa",
    eventYear: 1789,
    sessions: [
      {
        id: "s4",
        characterId: "quang-trung",
        characterName: "Quang Trung",
        characterImageUrl: "/ngo-quyen.jpg",
        characterTitle: "Hoàng đế Tây Sơn",
        eventId: "dong-da-1789",
        eventTitle: "Chiến thắng Ngọc Hồi – Đống Đa",
        eventYear: 1789,
        lastMessage: "Ta đã tiến quân thần tốc ra Thăng Long, hành quân suốt đêm không nghỉ...",
        lastMessageAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
        messageCount: 11,
        sessionTitle: "Hành quân thần tốc",
      },
    ],
  },
  {
    eventId: "lam-son-1418",
    eventTitle: "Khởi nghĩa Lam Sơn",
    eventYear: 1418,
    sessions: [
      {
        id: "s5",
        characterId: "le-loi",
        characterName: "Lê Lợi",
        characterImageUrl: "/ngo-quyen.jpg",
        characterTitle: "Bình Định Vương",
        eventId: "lam-son-1418",
        eventTitle: "Khởi nghĩa Lam Sơn",
        eventYear: 1418,
        lastMessage: "Mười năm gian khổ, có lúc chỉ còn vài trăm quân nhưng ta không bao giờ bỏ cuộc...",
        lastMessageAt: new Date(Date.now() - 7 * 86400 * 1000).toISOString(),
        messageCount: 9,
      },
    ],
  },
];
import axios from "axios";
import type { EventEra } from "@/services/event.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ── Types ─────────────────────────────────────────────────

export interface CharacterEvent {
  id: string;
  title: string;
  year: number;
  era: EventEra;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  era: EventEra;         // thời đại nhân vật thuộc về
  lifespan: string;      // vd: "898–944"
  side?: string;         // vd: "Đại Việt"
  events: CharacterEvent[]; // các sự kiện liên quan
}

export interface GetCharactersParams {
  page?: number;
  limit?: number;
  era?: EventEra;
  search?: string;
}

export interface GetCharactersResponse {
  data: Character[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Service ──────────────────────────────────────────────

export const characterService = {
  getCharacters: async (params: GetCharactersParams): Promise<GetCharactersResponse> => {
    const res = await axios.get(`${API_URL}/characters`, { params });
    return res.data;
  },

  getCharacterById: async (id: string): Promise<Character> => {
    const res = await axios.get(`${API_URL}/characters/${id}`);
    return res.data;
  },
};

// ── Query keys ────────────────────────────────────────────

export const characterQueryKeys = {
  list:   (params: GetCharactersParams) => ["characters", "list", params] as const,
  detail: (id: string)                  => ["characters", "detail", id]   as const,
};

// ── Mock ─────────────────────────────────────────────────
// TODO: xoá khi có API

export const MOCK_CHARACTERS: Character[] = [
  {
    id: "ngo-quyen",
    name: "Ngô Quyền",
    title: "Tiết độ sứ Tĩnh Hải quân",
    description: "Anh hùng dân tộc, người lãnh đạo quân dân Đại Việt đánh tan quân Nam Hán trên sông Bạch Đằng năm 938, chấm dứt hơn 1000 năm Bắc thuộc.",
    imageUrl: "/card.jpg",
    era: "medieval",
    lifespan: "898–944",
    side: "Đại Việt",
    events: [
      { id: "bach-dang-938", title: "Trận Bạch Đằng", year: 938, era: "medieval" },
    ],
  },
  {
    id: "quang-trung",
    name: "Quang Trung",
    title: "Hoàng đế Tây Sơn",
    description: "Hoàng đế kiệt xuất của triều Tây Sơn, người chỉ huy trận Ngọc Hồi – Đống Đa đại phá 29 vạn quân Thanh chỉ trong 5 ngày Tết Kỷ Dậu 1789.",
    imageUrl: "/card.jpg",
    era: "modern",
    lifespan: "1753–1792",
    side: "Tây Sơn",
    events: [
      { id: "dong-da-1789", title: "Chiến thắng Ngọc Hồi – Đống Đa", year: 1789, era: "modern" },
    ],
  },
  {
    id: "le-loi",
    name: "Lê Lợi",
    title: "Bình Định Vương",
    description: "Người khởi xướng và lãnh đạo khởi nghĩa Lam Sơn suốt 10 năm gian khổ (1418–1428), đánh đuổi quân Minh, lập nên triều Hậu Lê.",
    imageUrl: "/card.jpg",
    era: "medieval",
    lifespan: "1385–1433",
    side: "Đại Việt",
    events: [
      { id: "lam-son-1418", title: "Khởi nghĩa Lam Sơn", year: 1418, era: "medieval" },
    ],
  },
  {
    id: "tran-hung-dao",
    name: "Trần Hưng Đạo",
    title: "Quốc công Tiết chế",
    description: "Danh tướng nhà Trần, ba lần lãnh đạo quân dân Đại Việt đánh bại đế quốc Mông Nguyên hùng mạnh nhất thế giới thế kỷ XIII.",
    imageUrl: "/card.jpg",
    era: "medieval",
    lifespan: "1228–1300",
    side: "Đại Việt",
    events: [
      { id: "bach-dang-1288", title: "Trận Bạch Đằng 1288", year: 1288, era: "medieval" },
      { id: "chuong-duong-1285", title: "Trận Chương Dương", year: 1285, era: "medieval" },
    ],
  },
  {
    id: "ly-thuong-kiet",
    name: "Lý Thường Kiệt",
    title: "Thái uý nhà Lý",
    description: "Danh tướng kiệt xuất nhà Lý, tác giả bài thơ Nam quốc sơn hà — bản tuyên ngôn độc lập đầu tiên của dân tộc, người chỉ huy phòng thủ sông Như Nguyệt.",
    imageUrl: "/card.jpg",
    era: "medieval",
    lifespan: "1019–1105",
    side: "Đại Việt",
    events: [
      { id: "nhu-nguyet-1077", title: "Trận Như Nguyệt", year: 1077, era: "medieval" },
    ],
  },
  {
    id: "nguyen-hue",
    name: "Nguyễn Huệ",
    title: "Thủ lĩnh Tây Sơn",
    description: "Nhà quân sự thiên tài người Bình Định, sau lên ngôi Hoàng đế lấy hiệu Quang Trung. Lãnh đạo phong trào Tây Sơn thống nhất đất nước.",
    imageUrl: "/card.jpg",
    era: "modern",
    lifespan: "1753–1792",
    side: "Tây Sơn",
    events: [
      { id: "dong-da-1789", title: "Chiến thắng Ngọc Hồi – Đống Đa", year: 1789, era: "modern" },
    ],
  },
  {
    id: "dinh-bo-linh",
    name: "Đinh Bộ Lĩnh",
    title: "Đinh Tiên Hoàng",
    description: "Người thống nhất 12 sứ quân, lập nên nhà nước Đại Cồ Việt độc lập đầu tiên sau khi Ngô Quyền mất, đặt nền móng cho các triều đại phong kiến Việt Nam.",
    imageUrl: "/card.jpg",
    era: "medieval",
    lifespan: "924–979",
    side: "Đại Việt",
    events: [
      { id: "12-su-quan", title: "Dẹp loạn 12 sứ quân", year: 968, era: "medieval" },
    ],
  },
  {
    id: "an-duong-vuong",
    name: "An Dương Vương",
    title: "Vua nước Âu Lạc",
    description: "Người xây dựng thành Cổ Loa — công trình quân sự độc đáo bậc nhất Đông Nam Á thời cổ đại, trị vì nước Âu Lạc từ năm 257 TCN.",
    imageUrl: "/card.jpg",
    era: "ancient",
    lifespan: "? – 179 TCN",
    side: "Âu Lạc",
    events: [
      { id: "au-lac", title: "Thành lập nước Âu Lạc", year: -257, era: "ancient" },
    ],
  },
  {
    id: "ho-chi-minh",
    name: "Hồ Chí Minh",
    title: "Chủ tịch nước Việt Nam",
    description: "Lãnh tụ cách mạng và Chủ tịch đầu tiên của nước Việt Nam Dân chủ Cộng hòa, người đọc Tuyên ngôn Độc lập ngày 2/9/1945.",
    imageUrl: "/card.jpg",
    era: "contemporary",
    lifespan: "1890–1969",
    events: [
      { id: "doc-lap-1945", title: "Cách mạng tháng Tám 1945", year: 1945, era: "contemporary" },
    ],
  },
  {
    id: "vo-nguyen-giap",
    name: "Võ Nguyên Giáp",
    title: "Đại tướng Quân đội Nhân dân",
    description: "Vị tướng huyền thoại, Tổng tư lệnh Quân đội Nhân dân Việt Nam, người chỉ huy chiến thắng Điện Biên Phủ 1954 chấn động địa cầu.",
    imageUrl: "/card.jpg",
    era: "contemporary",
    lifespan: "1911–2013",
    events: [
      { id: "dien-bien-phu", title: "Chiến dịch Điện Biên Phủ", year: 1954, era: "contemporary" },
    ],
  },
  {
    id: "nguyen-trai",
    name: "Nguyễn Trãi",
    title: "Khai quốc công thần nhà Lê",
    description: "Nhà chính trị, nhà văn hóa kiệt xuất, tác giả Bình Ngô đại cáo — bản tuyên ngôn độc lập thứ hai của Việt Nam. Được UNESCO vinh danh Danh nhân văn hóa thế giới.",
    imageUrl: "/card.jpg",
    era: "medieval",
    lifespan: "1380–1442",
    side: "Đại Việt",
    events: [
      { id: "lam-son-1418", title: "Khởi nghĩa Lam Sơn", year: 1418, era: "medieval" },
    ],
  },
  {
    id: "trung-trac",
    name: "Trưng Trắc",
    title: "Nữ vương Việt Nam",
    description: "Vị nữ anh hùng đầu tiên trong lịch sử dân tộc, lãnh đạo khởi nghĩa chống quân Hán năm 40 SCN, được tôn vinh là Quốc mẫu của Việt Nam.",
    imageUrl: "/card.jpg",
    era: "ancient",
    lifespan: "? – 43 SCN",
    side: "Việt",
    events: [
      { id: "khoi-nghia-hai-ba-trung", title: "Khởi nghĩa Hai Bà Trưng", year: 40, era: "ancient" },
    ],
  },
];

export const MOCK_PAGE_LIMIT = 8;
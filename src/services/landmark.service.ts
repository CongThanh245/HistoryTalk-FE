import { axiosClient } from "@/configs/axios.client";
import type { EventEraBackend } from "./event.service";

// ── Types ──────────────────────────────────────────────────

export type LandmarkType =
  | "battlefield"
  | "citadel"
  | "river"
  | "city"
  | "temple"
  | "monument";
export type LandmarkContextEvent = {
  contextId: string;
  name: string;
  year: number;
  description: string;
  era: EventEraBackend;
};

export interface Landmark {
  landmarkId: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  type: LandmarkType;
  era: EventEraBackend | "ALL";
  province: string;
  // Link sang API hiện có — structure này giữ nguyên khi backend có /landmarks
  contextIds: string[]; // link sang GET /historical-contexts
  characterIds?: string[]; // link sang GET /characters/context/:contextId
  imageUrl?: string;
}

export interface GetLandmarksParams {
  era?: EventEraBackend;
  type?: LandmarkType;
}

// ── Map function (dùng khi backend có API) ─────────────────

export function mapLandmark(raw: any): Landmark {
  return {
    landmarkId: raw.landmarkId ?? raw.id,
    name: raw.name,
    description: raw.description,
    lat: raw.lat ?? raw.latitude,
    lng: raw.lng ?? raw.longitude,
    type: raw.type as LandmarkType,
    era: raw.era,
    province: raw.province,
    contextIds: raw.contextIds ?? [],
    characterIds: raw.characterIds ?? [],
    imageUrl: raw.imageUrl,
  };
}

// ── Mock Data ──────────────────────────────────────────────

export const MOCK_LANDMARKS: Landmark[] = [
  {
    landmarkId: "lm-001",
    name: "Sông Bạch Đằng",
    description:
      "Dòng sông chứng kiến 3 trận thủy chiến lớn nhất lịch sử Việt Nam, biểu tượng của tinh thần bất khuất chống ngoại xâm.",
    lat: 20.9431,
    lng: 106.8167,
    type: "river",
    era: "MEDIEVAL",
    province: "Quảng Ninh",
    contextIds: ["ctx-bach-dang-938", "ctx-bach-dang-1288"],
    characterIds: ["char-ngo-quyen", "char-tran-hung-dao"],
    imageUrl:
      "https://redsvn.net/wp-content/uploads/2020/02/Tran-bach-Dang-01.jpg",
  },
  {
    landmarkId: "lm-002",
    name: "Thành Cổ Loa",
    description:
      "Kinh đô của nhà nước Âu Lạc dưới thời An Dương Vương, một trong những tòa thành cổ nhất Đông Nam Á còn tồn tại.",
    lat: 21.1167,
    lng: 105.8833,
    type: "citadel",
    era: "ANCIENT",
    province: "Hà Nội",
    contextIds: ["ctx-au-lac", "ctx-an-duong-vuong"],
    characterIds: ["char-an-duong-vuong", "char-my-chau"],
    imageUrl:
      "https://statics.vinpearl.com/Den-co-loa-1_1679652153.jpg",
  },
  {
    landmarkId: "lm-003",
    name: "Chiến trường Điện Biên Phủ",
    description:
      "Nơi diễn ra chiến dịch Điện Biên Phủ lịch sử năm 1954, kết thúc 80 năm đô hộ của thực dân Pháp tại Đông Dương.",
    lat: 21.3833,
    lng: 103.0167,
    type: "battlefield",
    era: "MODERN",
    province: "Điện Biên",
    contextIds: ["ctx-dien-bien-phu-1954"],
    characterIds: ["char-vo-nguyen-giap"],
    imageUrl:
      "https://cloudcdnvod.tek4tv.vn/MAM/attach/upload/21042024003110/96d363d2-f11e-4656-be8b-c0d11d80d0f7-404.webp",
  },
  {
    landmarkId: "lm-004",
    name: "Hoàng thành Thăng Long",
    description:
      "Trung tâm chính trị của Đại Việt suốt hơn 1000 năm, được UNESCO công nhận là Di sản Văn hóa Thế giới năm 2010.",
    lat: 21.0358,
    lng: 105.8353,
    type: "citadel",
    era: "MEDIEVAL",
    province: "Hà Nội",
    contextIds: ["ctx-thang-long", "ctx-ly-thai-to"],
    characterIds: ["char-ly-thai-to", "char-tran-hung-dao"],
    imageUrl:
      "https://statics.vinpearl.com/dien-kinh-thien-1_1678893283.jpg",
  },
  {
    landmarkId: "lm-005",
    name: "Căn cứ Lam Sơn",
    description:
      "Căn cứ khởi nghĩa của Lê Lợi chống quân Minh (1418–1428), nơi khai sinh triều đại Hậu Lê và bản Bình Ngô Đại Cáo.",
    lat: 19.9667,
    lng: 105.55,
    type: "monument",
    era: "MEDIEVAL",
    province: "Thanh Hóa",
    contextIds: ["ctx-lam-son", "ctx-le-loi"],
    characterIds: ["char-le-loi", "char-nguyen-trai"],
    imageUrl: "https://namevgo.wordpress.com/wp-content/uploads/2019/12/khoi-nghia-lam-son.jpg",
  },
];

// Mock events linked to contextIds — replace với real API call: GET /historical-contexts/:id
export const MOCK_CONTEXT_EVENTS: Record<
  string,
  {
    contextId: string;
    name: string;
    year: number;
    description: string;
    era: EventEraBackend;
  }
> = {
  "ctx-bach-dang-938": {
    contextId: "ctx-bach-dang-938",
    name: "Trận Bạch Đằng 938",
    year: 938,
    description:
      "Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng bằng kế cắm cọc, chấm dứt 1000 năm Bắc thuộc.",
    era: "MEDIEVAL",
  },
  "ctx-bach-dang-1288": {
    contextId: "ctx-bach-dang-1288",
    name: "Trận Bạch Đằng 1288",
    year: 1288,
    description:
      "Trần Hưng Đạo tiêu diệt đoàn thuyền Mông–Nguyên, hoàn thành cuộc kháng chiến lần 3.",
    era: "MEDIEVAL",
  },
  "ctx-au-lac": {
    contextId: "ctx-au-lac",
    name: "Xây dựng thành Cổ Loa",
    year: -257,
    description:
      "An Dương Vương xây thành Cổ Loa hình xoắn ốc làm kinh đô nhà nước Âu Lạc.",
    era: "ANCIENT",
  },
  "ctx-an-duong-vuong": {
    contextId: "ctx-an-duong-vuong",
    name: "Sự sụp đổ của Âu Lạc",
    year: -179,
    description:
      "Triệu Đà xâm lược Âu Lạc, An Dương Vương mất nước do bị Trọng Thủy đánh cắp nỏ thần.",
    era: "ANCIENT",
  },
  "ctx-dien-bien-phu-1954": {
    contextId: "ctx-dien-bien-phu-1954",
    name: "Chiến dịch Điện Biên Phủ",
    year: 1954,
    description:
      "56 ngày đêm chiến đấu, quân đội Việt Nam đánh bại tập đoàn cứ điểm Điện Biên Phủ của Pháp.",
    era: "MODERN",
  },
  "ctx-thang-long": {
    contextId: "ctx-thang-long",
    name: "Dời đô về Thăng Long",
    year: 1010,
    description:
      "Lý Thái Tổ dời đô từ Hoa Lư về Thăng Long, mở ra thời kỳ phát triển rực rỡ của Đại Việt.",
    era: "MEDIEVAL",
  },
  "ctx-ly-thai-to": {
    contextId: "ctx-ly-thai-to",
    name: "Chiếu dời đô",
    year: 1010,
    description:
      "Lý Công Uẩn ban Chiếu dời đô, lý giải vì sao Thăng Long là trung tâm của bốn phương.",
    era: "MEDIEVAL",
  },
  "ctx-lam-son": {
    contextId: "ctx-lam-son",
    name: "Khởi nghĩa Lam Sơn",
    year: 1418,
    description:
      "Lê Lợi phất cờ khởi nghĩa tại Lam Sơn, bắt đầu 10 năm trường kỳ kháng chiến chống quân Minh.",
    era: "MEDIEVAL",
  },
  "ctx-le-loi": {
    contextId: "ctx-le-loi",
    name: "Giải phóng Đông Quan 1427",
    year: 1427,
    description:
      "Nghĩa quân Lam Sơn giải phóng thành Đông Quan (Hà Nội), quân Minh rút về nước.",
    era: "MEDIEVAL",
  },
};

// ── Service ────────────────────────────────────────────────

export const landmarkService = {
  // GET /landmarks
  getAll: async (params?: GetLandmarksParams): Promise<Landmark[]> => {
    // TODO: const res = await axiosClient.get("/landmarks", { params });
    // return res.data.data.map(mapLandmark);

    await new Promise((r) => setTimeout(r, 200));
    let result = [...MOCK_LANDMARKS];
    if (params?.era) result = result.filter((l) => l.era === params.era);
    if (params?.type) result = result.filter((l) => l.type === params.type);
    return result;
  },

  // GET /landmarks/:id
  getById: async (landmarkId: string): Promise<Landmark> => {
    // TODO: const res = await axiosClient.get(`/landmarks/${landmarkId}`);
    // return mapLandmark(res.data.data);

    await new Promise((r) => setTimeout(r, 100));
    return (
      MOCK_LANDMARKS.find((l) => l.landmarkId === landmarkId) ??
      MOCK_LANDMARKS[0]
    );
  },

  // GET /historical-contexts — lọc theo contextIds của landmark
  // Khi có API thật: dùng eventService.getAllClient({ ids: contextIds })
  // hoặc fetch từng contextId: GET /historical-contexts/:id
  getContextsByIds: async (
    contextIds: string[],
  ): Promise<LandmarkContextEvent[]> => {
    // TODO: const res = await axiosClient.get("/historical-contexts", { params: { ids: contextIds.join(",") } });
    await new Promise((r) => setTimeout(r, 150));
    return contextIds
      .map((id) => MOCK_CONTEXT_EVENTS[id])
      .filter((e): e is LandmarkContextEvent => Boolean(e));
  },
};

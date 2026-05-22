import { axiosClient } from "@/configs/axios.client";
import type { EventEraBackend } from "./event.service";
import WIKIDATA_LANDMARKS_RAW from "@/data/landmarks-wikidata.json";

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
  /**
   * Năm bắt đầu xuất hiện trên timeline (VD: -257 cho Cổ Loa).
   * Số âm = TCN. Có thể là năm sự kiện đầu tiên gắn với landmark này.
   */
  yearStart: number;
  /**
   * Năm kết thúc hiển thị (VD: 1954 cho Điện Biên Phủ).
   * Dùng 9999 nếu landmark vẫn tồn tại đến hiện tại.
   */
  yearEnd: number;
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
    yearStart: raw.yearStart ?? -9999,
    yearEnd: raw.yearEnd ?? 9999,
  };
}

// ── Mock Data ──────────────────────────────────────────────

export const MOCK_LANDMARKS: Landmark[] = [
  {
    landmarkId: "lm-001",
    name: "Trận Bạch Đằng (938)",
    description:
      "Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng, chấm dứt hơn 1.000 năm Bắc thuộc.",
    lat: 20.9431,
    lng: 106.8167,
    type: "battlefield",
    era: "MEDIEVAL",
    province: "Quảng Ninh",
    contextIds: ["ctx-bach-dang-938"],
    characterIds: ["char-ngo-quyen"],
    imageUrl: "https://redsvn.net/wp-content/uploads/2020/02/Tran-bach-Dang-01.jpg",
    yearStart: 938,
    yearEnd: 938,
  },
  {
    landmarkId: "lm-002",
    name: "Trận Bạch Đằng (1288)",
    description:
      "Trần Hưng Đạo đại phá quân Nguyên Mông lần 3, ghi dấu chiến thắng hiển hách nhất lịch sử chống ngoại xâm.",
    lat: 20.9431,
    lng: 106.82,
    type: "battlefield",
    era: "MEDIEVAL",
    province: "Quảng Ninh",
    contextIds: ["ctx-bach-dang-1288"],
    characterIds: ["char-tran-hung-dao"],
    imageUrl: "https://redsvn.net/wp-content/uploads/2020/02/Tran-bach-Dang-01.jpg",
    yearStart: 1288,
    yearEnd: 1288,
  },
  {
    landmarkId: "lm-003",
    name: "Chiến dịch Điện Biên Phủ (1954)",
    description:
      "Chiến dịch lịch sử đập tan tập đoàn cứ điểm Điện Biên Phủ, kết thúc 80 năm đô hộ của thực dân Pháp tại Đông Dương.",
    lat: 21.3833,
    lng: 103.0167,
    type: "battlefield",
    era: "MODERN",
    province: "Điện Biên",
    contextIds: ["ctx-dien-bien-phu-1954"],
    characterIds: ["char-vo-nguyen-giap"],
    imageUrl: "https://cloudcdnvod.tek4tv.vn/MAM/attach/upload/21042024003110/96d363d2-f11e-4656-be8b-c0d11d80d0f7-404.webp",
    yearStart: 1954,
    yearEnd: 1954,
  },
  {
    landmarkId: "lm-004",
    name: "Khởi nghĩa Lam Sơn (1418–1427)",
    description:
      "Lê Lợi phất cờ khởi nghĩa chống quân Minh tại Lam Sơn, khai sinh triều đại Hậu Lê và bản Bình Ngô Đại Cáo.",
    lat: 19.9667,
    lng: 105.55,
    type: "battlefield",
    era: "MEDIEVAL",
    province: "Thanh Hóa",
    contextIds: ["ctx-lam-son"],
    characterIds: ["char-le-loi", "char-nguyen-trai"],
    imageUrl: "https://namevgo.wordpress.com/wp-content/uploads/2019/12/khoi-nghia-lam-son.jpg",
    yearStart: 1418,
    yearEnd: 1427,
  },
  {
    landmarkId: "lm-005",
    name: "Trận Đống Đa (1789)",
    description:
      "Quang Trung - Nguyễn Huệ đại phá 29 vạn quân Thanh trong 5 ngày Tết, giải phóng Thăng Long.",
    lat: 21.0215,
    lng: 105.8412,
    type: "battlefield",
    era: "MEDIEVAL",
    province: "Hà Nội",
    contextIds: ["ctx-dong-da-1789"],
    characterIds: ["char-quang-trung"],
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Quang_Trung.jpg/220px-Quang_Trung.jpg",
    yearStart: 1789,
    yearEnd: 1789,
  },
  {
    landmarkId: "lm-006",
    name: "Trận Chi Lăng (1427)",
    description:
      "Lê Lợi phục kích và tiêu diệt đạo viện binh Liễu Thăng tại ải Chi Lăng, bẻ gãy xương sống quân Minh.",
    lat: 21.7667,
    lng: 106.7667,
    type: "battlefield",
    era: "MEDIEVAL",
    province: "Lạng Sơn",
    contextIds: ["ctx-chi-lang-1427"],
    characterIds: ["char-le-loi"],
    imageUrl: "",
    yearStart: 1427,
    yearEnd: 1427,
  },
  {
    landmarkId: "lm-007",
    name: "Trận Như Nguyệt (1077)",
    description:
      "Lý Thường Kiệt đánh tan 30 vạn quân Tống trên sông Như Nguyệt, đọc bản tuyên ngôn độc lập đầu tiên Nam quốc sơn hà.",
    lat: 21.1833,
    lng: 106.05,
    type: "battlefield",
    era: "MEDIEVAL",
    province: "Bắc Ninh",
    contextIds: ["ctx-nhu-nguyet-1077"],
    characterIds: ["char-ly-thuong-kiet"],
    imageUrl: "",
    yearStart: 1077,
    yearEnd: 1077,
  },
  {
    landmarkId: "lm-008",
    name: "Trận Tốt Động – Chúc Động (1426)",
    description:
      "Nghĩa quân Lam Sơn phục kích và đánh tan 10 vạn quân Minh tại Tốt Động, mở đường vây hãm Đông Quan.",
    lat: 20.725,
    lng: 105.7583,
    type: "battlefield",
    era: "MEDIEVAL",
    province: "Hà Nội",
    contextIds: ["ctx-tot-dong-1426"],
    characterIds: ["char-le-loi"],
    imageUrl: "",
    yearStart: 1426,
    yearEnd: 1426,
  },
];

// ── Wikidata landmarks (auto-generated) ─────────────────────
// File được sinh ra bằng: node scripts/fetch-wikidata-landmarks.mjs
// Nếu file rỗng [] → chưa chạy script. Chạy script để có ~100-300 landmarks.
const WIKIDATA_LANDMARKS: Landmark[] = (WIKIDATA_LANDMARKS_RAW as any[]).map(
  (l: any) => ({
    ...l,
    type: l.type as LandmarkType,
    era: l.era as EventEraBackend | "ALL",
  }),
);

/** Tổng hợp: mock (curated) + wikidata (auto-fetched) */
export const ALL_LANDMARKS: Landmark[] = [
  ...MOCK_LANDMARKS,
  ...WIKIDATA_LANDMARKS,
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
    let result = [...ALL_LANDMARKS];
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
      ALL_LANDMARKS.find((l) => l.landmarkId === landmarkId) ??
      ALL_LANDMARKS[0]
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

import { axiosClient } from "@/configs/axios.client";

// ── Types ──────────────────────────────────────────────────

export interface RoomHotspot {
  hotspotId: string;
  characterId: string;
  characterName: string;
  title: string; // chức danh ngắn: "Đại tướng quân"
  spriteUrl: string; // PNG cutout nhân vật
  x: number; // % từ trái (0–100)
  y: number; // % từ trên (0–100)
  scale: number; // 1.0 = mặc định
  side: "left" | "right"; // nhân vật đứng phía nào → flip sprite
  greeting: string; // câu thoại hiện khi hover
  roomContext: string; // inject vào system prompt AI khi chat
}

export interface HistoricalRoom {
  roomId: string;
  landmarkId: string; // link sang Landmark đã có
  contextId: string; // link sang HistoricalContext đã có
  name: string;
  era: string;
  backgroundUrl: string; // illustration URL
  backgroundCredit?: string;
  ambientDescription: string; // mô tả khung cảnh cho AI context
  hotspots: RoomHotspot[];
}

export interface GetRoomsParams {
  landmarkId?: string;
  contextId?: string;
}

// ── Map function ───────────────────────────────────────────

export function mapRoom(raw: any): HistoricalRoom {
  return {
    roomId: raw.roomId ?? raw.id,
    landmarkId: raw.landmarkId,
    contextId: raw.contextId,
    name: raw.name,
    era: raw.era,
    backgroundUrl: raw.backgroundUrl,
    backgroundCredit: raw.backgroundCredit,
    ambientDescription: raw.ambientDescription,
    hotspots: (raw.hotspots ?? []).map(mapHotspot),
  };
}

export function mapHotspot(raw: any): RoomHotspot {
  return {
    hotspotId: raw.hotspotId ?? raw.id,
    characterId: raw.characterId,
    characterName: raw.characterName,
    title: raw.title,
    spriteUrl: raw.spriteUrl,
    x: raw.x,
    y: raw.y,
    scale: raw.scale ?? 1,
    side: raw.side ?? "right",
    greeting: raw.greeting,
    roomContext: raw.roomContext,
  };
}

// ── Mock Data ──────────────────────────────────────────────

export const MOCK_ROOMS: HistoricalRoom[] = [
  {
    roomId: "room-bach-dang-938",
    landmarkId: "lm-001",
    contextId: "ctx-bach-dang-938",
    name: "Chiến thuyền sông Bạch Đằng — 938",
    era: "MEDIEVAL",
    backgroundUrl:
      "https://redsvn.net/wp-content/uploads/2020/02/Tran-bach-Dang-01.jpg",
    ambientDescription:
      "Mùa đông năm 938. Sương mù bao phủ sông Bạch Đằng. Tiếng sóng vỗ mạn thuyền. Phía xa, cọc gỗ bịt sắt đã được cắm kín lòng sông. Quân Nam Hán đang tiến vào bẫy.",
    hotspots: [
      {
        hotspotId: "hs-ngo-quyen",
        characterId: "char-ngo-quyen",
        characterName: "Ngô Quyền",
        title: "Tiết độ sứ Tĩnh Hải quân",
        spriteUrl:
          "https://i.chungta.vn/2012/06/22/nhth2-986334-1412980543_1200x0.jpg",
        x: 25,
        y: 30,
        scale: 1.2,
        side: "right",
        greeting:
          "Ta đã chờ quân Nam Hán rất lâu. Kế cắm cọc này sẽ kết thúc nghìn năm nô lệ.",
        roomContext:
          "Ngô Quyền đang đứng trên chiến thuyền chỉ huy trận Bạch Đằng năm 938. Xung quanh là chiến thuyền quân ta, phía xa là đoàn thuyền Nam Hán đang tiến vào. Người dùng vừa nhìn thấy toàn cảnh sông Bạch Đằng trong buổi sáng sương mù.",
      },
    ],
  },
  {
    roomId: "room-co-loa",
    landmarkId: "lm-002",
    contextId: "ctx-au-lac",
    name: "Nội điện thành Cổ Loa — 257 TCN",
    era: "ANCIENT",
    backgroundUrl: "https://statics.vinpearl.com/Den-co-loa-1_1679652153.jpg",
    ambientDescription:
      "Nội điện thành Cổ Loa. Ánh đuốc lung linh trên tường đá. Chiếc nỏ thần Kim Quy đặt trên bệ gỗ sơn son. Tiếng gió thổi qua hào nước bên ngoài.",
    hotspots: [
      {
        hotspotId: "hs-an-duong-vuong",
        characterId: "char-an-duong-vuong",
        characterName: "An Dương Vương",
        title: "Vua nước Âu Lạc",
        spriteUrl:
          "https://scontent.fsgn5-5.fna.fbcdn.net/v/t1.6435-9/106989251_587266205246967_8239066039543175725_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeF2AUmEBGMgzn870VrXYw1WgKILVwCcaHGAogtXAJxocT3ASNm3DuSl-lVm8NfAzMYuIWFIkEWSE20XranLtaEo&_nc_ohc=QaRo9KL3v9sQ7kNvwGD9hu6&_nc_oc=AdmDUiFf4_5D7dZQb_ZQIAFEvfE808ryR3q3PmU03ZdCLhWyZsskzOZlqdfKce2PIp4&_nc_zt=23&_nc_ht=scontent.fsgn5-5.fna&_nc_gid=0Di3QLBNGvYpfm0Z-S-cLg&_nc_ss=8&oh=00_AfxDGZNTtz5bEoQrH2QX_aFSbtA16PzFRzDdjsB7Ot8C4g&oe=69D72075",
        x: 30,
        y: 25,
        scale: 1.15,
        side: "right",
        greeting:
          "Nỏ thần này là báu vật của quốc gia. Thần Kim Quy đã ban ta để bảo vệ xã tắc.",
        roomContext:
          "An Dương Vương đang trong nội điện thành Cổ Loa, cạnh chiếc nỏ thần. Đây là giai đoạn trước khi Trọng Thủy đánh cắp nỏ thần, vương quốc Âu Lạc đang hưng thịnh.",
      },
    ],
  },
  {
    roomId: "room-dien-bien-phu",
    landmarkId: "lm-003",
    contextId: "ctx-dien-bien-phu-1954",
    name: "Sở chỉ huy chiến dịch — Điện Biên Phủ 1954",
    era: "MODERN",
    backgroundUrl:
      "https://cloudcdnvod.tek4tv.vn/MAM/attach/upload/21042024003110/96d363d2-f11e-4656-be8b-c0d11d80d0f7-404.webp",
    ambientDescription:
      "Hầm chỉ huy dưới lòng đất. Ánh đèn dầu leo lét. Bản đồ trận địa trải rộng trên bàn. Tiếng pháo xa vọng lại. Đây là đêm trước trận tổng công kích cuối cùng.",
    hotspots: [
      {
        hotspotId: "hs-vo-nguyen-giap",
        characterId: "char-vo-nguyen-giap",
        characterName: "Đại tướng Võ Nguyên Giáp",
        title: "Tổng tư lệnh Quân đội Nhân dân",
        spriteUrl:
          "https://kenh14cdn.com/k:thumb_w/600/A3YmnWqkHeph7OwGyu6TwbX57tgTw/Image/2013/10/3-46b32/nhung-cau-noi-con-song-mai-cua-dai-tuong-vo-nguyen-giap.jpg",
        x: 28,
        y: 20,
        scale: 1.1,
        side: "right",
        greeting:
          "Thay đổi chiến thuật từ 'đánh nhanh thắng nhanh' sang 'đánh chắc tiến chắc' là quyết định khó khăn nhất trong đời tôi.",
        roomContext:
          "Đại tướng Võ Nguyên Giáp đang trong sở chỉ huy dã chiến tại Điện Biên Phủ. Chiến dịch đang ở giai đoạn quyết định. Người dùng vừa nhìn thấy bản đồ trận địa và các tài liệu tác chiến.",
      },
    ],
  },
  {
    roomId: "room-thang-long",
    landmarkId: "lm-004",
    contextId: "ctx-thang-long",
    name: "Điện Kính Thiên — Hoàng thành Thăng Long 1010",
    era: "MEDIEVAL",
    backgroundUrl:
      "https://statics.vinpearl.com/dien-kinh-thien-1_1678893283.jpg",
    ambientDescription:
      "Điện Kính Thiên buổi sáng sớm. Hương trầm tỏa khói. Ánh sáng vàng chiếu qua rèm gấm đỏ. Triều thần đang tập hợp để nghe vua ban Chiếu dời đô.",
    hotspots: [
      {
        hotspotId: "hs-ly-thai-to",
        characterId: "char-ly-thai-to",
        characterName: "Lý Thái Tổ",
        title: "Hoàng đế khai sáng triều Lý",
        spriteUrl:
          "https://upload.wikimedia.org/wikipedia/commons/5/58/T%C6%B0%E1%BB%A3ng_L%C3%BD_Th%C3%A1i_T%E1%BB%95_2.jpg",
        x: 32,
        y: 18,
        scale: 1.2,
        side: "right",
        greeting:
          "Thăng Long — Rồng bay lên. Đây là vùng đất trung tâm trời đất, xứng đáng làm kinh đô muôn đời.",
        roomContext:
          "Lý Thái Tổ đang trong Điện Kính Thiên, vừa dời đô từ Hoa Lư về Thăng Long năm 1010. Người dùng đang chiêm ngưỡng cung điện trong ngày đầu tiên tại kinh đô mới.",
      },
    ],
  },
  {
    roomId: "room-lam-son",
    landmarkId: "lm-005",
    contextId: "ctx-lam-son",
    name: "Căn cứ khởi nghĩa Lam Sơn — 1418",
    era: "MEDIEVAL",
    backgroundUrl:
      "https://namevgo.wordpress.com/wp-content/uploads/2019/12/khoi-nghia-lam-son.jpg",
    ambientDescription:
      "Rừng núi Lam Sơn, Thanh Hóa. Ánh lửa trại bập bùng. Nghĩa quân đang tập hợp quanh Lê Lợi. Tiếng suối chảy, tiếng côn trùng đêm. Đây là những ngày đầu gian khó nhất của cuộc khởi nghĩa.",
    hotspots: [
      {
        hotspotId: "hs-le-loi",
        characterId: "char-le-loi",
        characterName: "Lê Lợi",
        title: "Bình Định Vương",
        spriteUrl:
          "https://mocban.vn/wp-content/uploads/2022/11/db27ccf92718f33dget_img3.jpg",
        x: 26,
        y: 28,
        scale: 1.15,
        side: "right",
        greeting:
          "Ta chỉ là một hào trưởng ở Lam Sơn. Nhưng không thể ngồi nhìn quân Minh đày đọa dân ta thêm nữa.",
        roomContext:
          "Lê Lợi đang tại căn cứ Lam Sơn trong những ngày đầu khởi nghĩa năm 1418. Lực lượng còn mỏng, nhiều gian nan phía trước. Người dùng vừa đến căn cứ và nhìn thấy cảnh trại quân giữa rừng.",
      },
    ],
  },
];

// ── Service ────────────────────────────────────────────────

export const roomService = {
  // GET /rooms?landmarkId=...
  getAll: async (params?: GetRoomsParams): Promise<HistoricalRoom[]> => {
    // TODO: const res = await axiosClient.get("/rooms", { params });
    // return res.data.data.map(mapRoom);
    await new Promise((r) => setTimeout(r, 200));
    let result = [...MOCK_ROOMS];
    if (params?.landmarkId)
      result = result.filter((r) => r.landmarkId === params.landmarkId);
    if (params?.contextId)
      result = result.filter((r) => r.contextId === params.contextId);
    return result;
  },

  // GET /rooms/:id
  getById: async (roomId: string): Promise<HistoricalRoom | null> => {
    // TODO: const res = await axiosClient.get(`/rooms/${roomId}`);
    // return mapRoom(res.data.data);
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_ROOMS.find((r) => r.roomId === roomId) ?? null;
  },

  // GET /rooms/by-landmark/:landmarkId — lấy room của 1 landmark
  getByLandmark: async (landmarkId: string): Promise<HistoricalRoom | null> => {
    // TODO: const res = await axiosClient.get(`/rooms/by-landmark/${landmarkId}`);
    // return mapRoom(res.data.data);
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_ROOMS.find((r) => r.landmarkId === landmarkId) ?? null;
  },
};

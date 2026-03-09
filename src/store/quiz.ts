// ── Game 1: Guess the Character ──────────────────────────────

export interface CharacterQuestion {
  id: number;
  hints: string[];
  answer: string;
  options: string[];
  explanation: string;
}

export const characterQuestions: CharacterQuestion[] = [
  {
    id: 1,
    hints: ["Đánh bại quân Nam Hán", "Trận sông Bạch Đằng", "Năm 938"],
    answer: "Ngô Quyền",
    options: ["Ngô Quyền", "Trần Hưng Đạo", "Lý Thường Kiệt", "Quang Trung"],
    explanation:
      "Ngô Quyền dùng cọc nhọn cắm dưới sông Bạch Đằng, đánh tan quân Nam Hán năm 938.",
  },
  {
    id: 2,
    hints: [
      "Ba lần đánh bại Nguyên Mông",
      "Soạn 'Hịch tướng sĩ'",
      "Được phong Hưng Đạo Vương",
    ],
    answer: "Trần Hưng Đạo",
    options: ["Trần Hưng Đạo", "Trần Thái Tông", "Lê Lợi", "Ngô Quyền"],
    explanation:
      "Trần Hưng Đạo là Quốc công Tiết chế, tổng chỉ huy 3 cuộc kháng chiến chống Nguyên Mông (1258–1288).",
  },
  {
    id: 3,
    hints: [
      "Hành quân thần tốc từ Phú Xuân",
      "Mùng 5 Tết Kỷ Dậu 1789",
      "Đại phá 29 vạn quân Thanh",
    ],
    answer: "Quang Trung",
    options: ["Quang Trung", "Gia Long", "Lê Lợi", "Đinh Bộ Lĩnh"],
    explanation:
      "Vua Quang Trung (Nguyễn Huệ) đại phá quân Thanh ngay đêm mùng 5 Tết 1789.",
  },
  {
    id: 4,
    hints: [
      "Chủ động đánh sang đất Tống",
      "Bài thơ 'Nam quốc sơn hà'",
      "Đánh tan quân Tống tại sông Như Nguyệt",
    ],
    answer: "Lý Thường Kiệt",
    options: ["Lý Thường Kiệt", "Lý Công Uẩn", "Trần Quốc Tuấn", "Ngô Quyền"],
    explanation:
      "Lý Thường Kiệt (1019–1105) — tướng tài nhà Lý, tác giả bài thơ tuyên ngôn độc lập đầu tiên.",
  },
  {
    id: 5,
    hints: [
      "Khởi nghĩa Lam Sơn",
      "10 năm kháng chiến chống Minh",
      "Lập ra nhà Hậu Lê",
    ],
    answer: "Lê Lợi",
    options: ["Lê Lợi", "Lê Lai", "Nguyễn Trãi", "Lê Hoàn"],
    explanation:
      "Lê Lợi (1385–1433) lãnh đạo khởi nghĩa Lam Sơn, đánh đuổi quân Minh, lên ngôi năm 1428.",
  },
];

// ── Game 2: Guess the Event ───────────────────────────────────

export interface EventQuestion {
  id: number;
  year: string;
  clues: string[];
  answer: string;
  options: string[];
  explanation: string;
}

export const eventQuestions: EventQuestion[] = [
  {
    id: 1,
    year: "1954",
    clues: [
      "56 ngày đêm",
      "Tướng De Castries đầu hàng",
      "Chấm dứt thực dân Pháp",
    ],
    answer: "Trận Điện Biên Phủ",
    options: [
      "Trận Điện Biên Phủ",
      "Trận Bạch Đằng",
      "Khởi nghĩa Lam Sơn",
      "Trận Đông Khê",
    ],
    explanation:
      "Chiến thắng Điện Biên Phủ 7/5/1954 buộc Pháp ký Hiệp định Genève.",
  },
  {
    id: 2,
    year: "938",
    clues: [
      "Cọc gỗ bịt sắt dưới lòng sông",
      "Thủy chiến",
      "Quân Nam Hán đại bại",
    ],
    answer: "Trận Bạch Đằng",
    options: [
      "Trận Bạch Đằng",
      "Trận Chi Lăng",
      "Trận Tốt Động",
      "Trận Rạch Gầm",
    ],
    explanation: "Trận Bạch Đằng 938 — Ngô Quyền mở ra kỷ nguyên độc lập.",
  },
  {
    id: 3,
    year: "1789",
    clues: ["Tết Kỷ Dậu", "Gò Đống Đa", "29 vạn quân Thanh"],
    answer: "Đại phá quân Thanh",
    options: [
      "Đại phá quân Thanh",
      "Trận Bạch Đằng 1288",
      "Khởi nghĩa Lam Sơn",
      "Trận Điện Biên Phủ",
    ],
    explanation:
      "Mùng 5 Tết 1789, Quang Trung đại phá quân Thanh, tiến vào Thăng Long.",
  },
  {
    id: 4,
    year: "1975",
    clues: ["30 tháng 4", "Dinh Độc Lập", "Thống nhất đất nước"],
    answer: "Chiến dịch Hồ Chí Minh",
    options: [
      "Chiến dịch Hồ Chí Minh",
      "Chiến dịch Điện Biên Phủ",
      "Tổng tiến công Mậu Thân",
      "Chiến dịch Huế–Đà Nẵng",
    ],
    explanation:
      "30/4/1975, xe tăng tiến vào Dinh Độc Lập — thống nhất Nam Bắc sau 21 năm.",
  },
  {
    id: 5,
    year: "1288",
    clues: [
      "Lần thứ ba quân Nguyên xâm lược",
      "Cọc sông Bạch Đằng lần hai",
      "Ô Mã Nhi bị bắt sống",
    ],
    answer: "Trận Bạch Đằng 1288",
    options: [
      "Trận Bạch Đằng 1288",
      "Trận Chương Dương",
      "Trận Vân Đồn",
      "Trận Tây Kết",
    ],
    explanation:
      "Năm 1288, Trần Hưng Đạo dùng lại kế cọc sông Bạch Đằng, đánh tan quân Nguyên lần thứ ba.",
  },
];

// ── Game 3: Timeline Puzzle ───────────────────────────────────

export interface TimelineItem {
  id: string;
  label: string;
  year: number;
  yearDisplay: string;
  description: string;
}

export const timelineSets: TimelineItem[][] = [
  [
    {
      id: "a1",
      label: "Hai Bà Trưng khởi nghĩa",
      year: 40,
      yearDisplay: "40",
      description: "Chống ách đô hộ Đông Hán",
    },
    {
      id: "a2",
      label: "Trận Bạch Đằng",
      year: 938,
      yearDisplay: "938",
      description: "Ngô Quyền đánh tan quân Nam Hán",
    },
    {
      id: "a3",
      label: "Hội nghị Diên Hồng",
      year: 1284,
      yearDisplay: "1284",
      description: "Nhà Trần hỏi ý dân trước giặc Nguyên",
    },
    {
      id: "a4",
      label: "Khởi nghĩa Lam Sơn",
      year: 1418,
      yearDisplay: "1418",
      description: "Lê Lợi dựng cờ khởi nghĩa",
    },
  ],
  [
    {
      id: "b1",
      label: "Lý Công Uẩn dời đô",
      year: 1010,
      yearDisplay: "1010",
      description: "Dời đô từ Hoa Lư ra Thăng Long",
    },
    {
      id: "b2",
      label: "Trận Như Nguyệt",
      year: 1077,
      yearDisplay: "1077",
      description: "Lý Thường Kiệt chặn quân Tống",
    },
    {
      id: "b3",
      label: "Đại phá quân Thanh",
      year: 1789,
      yearDisplay: "1789",
      description: "Quang Trung đại thắng mùng 5 Tết",
    },
    {
      id: "b4",
      label: "Điện Biên Phủ",
      year: 1954,
      yearDisplay: "1954",
      description: "Đại thắng 56 ngày đêm",
    },
  ],
  [
    {
      id: "c1",
      label: "Nhà Đinh thống nhất",
      year: 968,
      yearDisplay: "968",
      description: "Đinh Bộ Lĩnh dẹp loạn 12 sứ quân",
    },
    {
      id: "c2",
      label: "Trận Bạch Đằng 1288",
      year: 1288,
      yearDisplay: "1288",
      description: "Trần Hưng Đạo phá quân Nguyên lần 3",
    },
    {
      id: "c3",
      label: "Bình Ngô đại cáo",
      year: 1428,
      yearDisplay: "1428",
      description: "Nguyễn Trãi viết tuyên ngôn độc lập",
    },
    {
      id: "c4",
      label: "Giải phóng miền Nam",
      year: 1975,
      yearDisplay: "1975",
      description: "Thống nhất đất nước 30/4/1975",
    },
  ],
];

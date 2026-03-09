export interface HistoricalFact {
  id: number;
  content: string;
  year?: string;
  tags: string[];
}

export const facts: HistoricalFact[] = [
  {
    id: 1,
    content: "Ngô Quyền dùng cọc gỗ bịt sắt nhọn cắm dưới lòng sông Bạch Đằng để đánh tan quân Nam Hán năm 938.",
    year: "938",
    tags: ["Ngô Quyền", "Bạch Đằng"],
  },
  {
    id: 2,
    content: "Trận Điện Biên Phủ kéo dài 56 ngày đêm, kết thúc ngày 7/5/1954, chấm dứt ách thực dân Pháp tại Đông Dương.",
    year: "1954",
    tags: ["Điện Biên Phủ", "Kháng chiến"],
  },
  {
    id: 3,
    content: "Trần Hưng Đạo ba lần đánh bại quân Nguyên Mông xâm lược (1258, 1285, 1288), trở thành biểu tượng của tinh thần bất khuất dân tộc.",
    year: "1258–1288",
    tags: ["Trần Hưng Đạo", "Nguyên Mông"],
  },
  {
    id: 4,
    content: "Vua Quang Trung đại phá quân Thanh vào mùng 5 Tết Kỷ Dậu 1789, chỉ sau 5 ngày hành quân thần tốc từ Phú Xuân.",
    year: "1789",
    tags: ["Quang Trung", "Đống Đa"],
  },
  {
    id: 5,
    content: "Lý Thường Kiệt chủ động đánh sang đất Tống năm 1075, tiêu diệt các căn cứ quân sự trước khi giặc kịp chuẩn bị xâm lược.",
    year: "1075",
    tags: ["Lý Thường Kiệt", "Nhà Tống"],
  },
  {
    id: 6,
    content: "Bài thơ 'Nam quốc sơn hà' được coi là bản Tuyên ngôn Độc lập đầu tiên của Việt Nam, ra đời trong cuộc kháng chiến chống Tống.",
    year: "1077",
    tags: ["Lý Thường Kiệt", "Thơ văn"],
  },
  {
    id: 7,
    content: "Hai Bà Trưng phất cờ khởi nghĩa năm 40 SCN, lãnh đạo nhân dân đánh đuổi quân Đông Hán, lập nên chính quyền độc lập trong 3 năm.",
    year: "40 SCN",
    tags: ["Hai Bà Trưng", "Chống Hán"],
  },
  {
    id: 8,
    content: "Chiến dịch Hồ Chí Minh kết thúc ngày 30/4/1975, thống nhất đất nước sau hơn 20 năm chia cắt.",
    year: "1975",
    tags: ["Giải phóng", "Thống nhất"],
  },
  {
    id: 9,
    content: "Nhà Trần ban hành chính sách 'ngụ binh ư nông' — binh lính luân phiên về làm ruộng, vừa đảm bảo kinh tế vừa duy trì lực lượng chiến đấu.",
    year: "Thế kỷ XIII",
    tags: ["Nhà Trần", "Quân sự"],
  },
  {
    id: 10,
    content: "Hội nghị Diên Hồng năm 1284 quy tụ các bô lão cả nước để hỏi ý kiến về việc đánh hay hòa trước quân Nguyên — một hình thức dân chủ đặc biệt thời phong kiến.",
    year: "1284",
    tags: ["Nhà Trần", "Hội nghị Diên Hồng"],
  },
];
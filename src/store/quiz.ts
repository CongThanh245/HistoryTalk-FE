export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export const quiz: QuizQuestion[] = [
  {
    id: 1,
    question: "Ai đánh bại quân Nam Hán trên sông Bạch Đằng năm 938?",
    options: ["Ngô Quyền", "Trần Hưng Đạo", "Quang Trung", "Lý Thường Kiệt"],
    answer: "Ngô Quyền",
    explanation: "Ngô Quyền dùng kế cọc nhọn dưới sông Bạch Đằng, đánh tan quân Nam Hán, mở ra kỷ nguyên độc lập.",
  },
  {
    id: 2,
    question: "Trận Điện Biên Phủ kéo dài bao nhiêu ngày?",
    options: ["42 ngày", "56 ngày", "70 ngày", "30 ngày"],
    answer: "56 ngày",
    explanation: "Chiến dịch Điện Biên Phủ diễn ra từ 13/3 đến 7/5/1954, tổng cộng 56 ngày đêm.",
  },
  {
    id: 3,
    question: "Trần Hưng Đạo đánh bại quân Nguyên Mông bao nhiêu lần?",
    options: ["1 lần", "2 lần", "3 lần", "4 lần"],
    answer: "3 lần",
    explanation: "Quân Nguyên Mông xâm lược Đại Việt 3 lần (1258, 1285, 1288) và đều bị đánh bại.",
  },
  {
    id: 4,
    question: "Vua Quang Trung đại phá quân Thanh vào dịp nào?",
    options: ["Rằm tháng Giêng", "Mùng 5 Tết Kỷ Dậu", "Mùng 1 Tết", "Ngày giỗ tổ"],
    answer: "Mùng 5 Tết Kỷ Dậu",
    explanation: "Năm 1789, Quang Trung hành quân thần tốc và đại thắng quân Thanh đúng mùng 5 Tết Kỷ Dậu.",
  },
  {
    id: 5,
    question: "Hai Bà Trưng phất cờ khởi nghĩa vào năm nào?",
    options: ["40 SCN", "938", "1075", "248"],
    answer: "40 SCN",
    explanation: "Năm 40 SCN, Trưng Trắc và Trưng Nhị khởi nghĩa chống lại ách đô hộ của nhà Đông Hán.",
  },
  {
    id: 6,
    question: "Lý Thường Kiệt chủ động đánh sang đất nước nào?",
    options: ["Chiêm Thành", "Chân Lạp", "Nhà Tống", "Nhà Đường"],
    answer: "Nhà Tống",
    explanation: "Năm 1075, Lý Thường Kiệt tiên phát chế nhân, đánh vào đất Tống trước khi họ kịp chuẩn bị xâm lược.",
  },
  {
    id: 7,
    question: "Hội nghị Diên Hồng diễn ra vào thời nhà nào?",
    options: ["Nhà Lý", "Nhà Trần", "Nhà Lê", "Nhà Nguyễn"],
    answer: "Nhà Trần",
    explanation: "Hội nghị Diên Hồng năm 1284 là sáng kiến của nhà Trần, hỏi ý kiến bô lão về việc đối phó quân Nguyên.",
  },
  {
    id: 8,
    question: "Chiến dịch Hồ Chí Minh kết thúc vào ngày nào?",
    options: ["30/4/1975", "2/9/1945", "7/5/1954", "21/7/1954"],
    answer: "30/4/1975",
    explanation: "30/4/1975 là ngày giải phóng miền Nam, thống nhất đất nước sau hơn 20 năm chia cắt.",
  },
];
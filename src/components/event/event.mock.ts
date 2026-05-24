// TODO: xoá file này khi có API thực
import type { HistoricalEvent } from "@/services/event.service";

export const MOCK_EVENTS: HistoricalEvent[] = [
  { id: "1",  year: -258, yearLabel: "258 TCN", title: "Thục Phán lập nước Âu Lạc",              summary: "Thục Phán An Dương Vương thống nhất người Âu Việt và Lạc Việt, lập ra nước Âu Lạc, xây thành Cổ Loa làm kinh đô.", location: "Cổ Loa, Hà Nội" },
  { id: "2",  year: 40,   yearLabel: "40 SCN",  title: "Khởi nghĩa Hai Bà Trưng",                summary: "Trưng Trắc và Trưng Nhị phất cờ khởi nghĩa chống lại ách đô hộ của nhà Hán, giành độc lập trong 3 năm.", location: "Mê Linh, Vĩnh Phúc" },
  { id: "3",  year: 248,  yearLabel: "248 SCN", title: "Khởi nghĩa Bà Triệu",                    summary: "Triệu Thị Trinh lãnh đạo cuộc khởi nghĩa chống quân Ngô, để lại câu nói bất hủ về ý chí độc lập dân tộc.", location: "Thanh Hoá" },
  { id: "4",  year: 544,  yearLabel: "544 SCN", title: "Lý Bí lập nước Vạn Xuân",               summary: "Lý Bí khởi nghĩa thành công, lập ra nhà nước Vạn Xuân, xưng là Lý Nam Đế — triều đại người Việt đầu tiên.", location: "Miền Bắc Việt Nam" },
  { id: "5",  year: 938,  yearLabel: "938 SCN", title: "Ngô Quyền đại thắng trên sông Bạch Đằng", summary: "Ngô Quyền dùng kế cắm cọc nhọn, đánh tan quân Nam Hán, kết thúc hơn 1000 năm Bắc thuộc.", location: "Sông Bạch Đằng, Quảng Ninh" },
  { id: "6",  year: 1010, yearLabel: "1010 SCN", title: "Lý Thái Tổ dời đô về Thăng Long",      summary: "Vua Lý Thái Tổ ban Chiếu dời đô từ Hoa Lư về Đại La, đổi tên thành Thăng Long — nền tảng Hà Nội ngày nay.", location: "Thăng Long (Hà Nội)" },
  { id: "7",  year: 1076, yearLabel: "1076 SCN", title: "Lý Thường Kiệt phá Tống bình Chiêm",   summary: "Lý Thường Kiệt chủ động tấn công phủ Ung Châu để phá vỡ kế hoạch xâm lược của nhà Tống.", location: "Sông Như Nguyệt, Bắc Ninh" },
  { id: "8",  year: 1285, yearLabel: "1285 SCN", title: "Đại thắng quân Nguyên Mông lần II",    summary: "Trần Hưng Đạo lãnh đạo quân dân Đại Việt đánh bại 50 vạn quân Nguyên Mông trong cuộc kháng chiến lần thứ hai.", location: "Đại Việt" },
  { id: "9",  year: 1418, yearLabel: "1418 SCN", title: "Lê Lợi khởi nghĩa Lam Sơn",           summary: "Lê Lợi dựng cờ khởi nghĩa tại Lam Sơn chống quân Minh đô hộ, sau 10 năm gian khổ giành lại độc lập.", location: "Lam Sơn, Thanh Hoá" },
  { id: "10", year: 1789, yearLabel: "1789 SCN", title: "Quang Trung đại phá quân Thanh",       summary: "Vua Quang Trung chỉ huy cuộc hành quân thần tốc, đại phá 29 vạn quân Thanh trong dịp Tết Kỷ Dậu.", location: "Đống Đa, Hà Nội" },
  { id: "11", year: 1858, yearLabel: "1858 SCN", title: "Pháp nổ súng xâm lược Đà Nẵng",       summary: "Liên quân Pháp – Tây Ban Nha tấn công Đà Nẵng, mở đầu quá trình xâm lược và đô hộ Việt Nam.", location: "Đà Nẵng" },
  { id: "12", year: 1930, yearLabel: "1930 SCN", title: "Thành lập Đảng Cộng sản Việt Nam",     summary: "Nguyễn Ái Quốc chủ trì Hội nghị thành lập Đảng Cộng sản Việt Nam tại Hương Cảng.", location: "Hương Cảng, Trung Quốc" },
  { id: "13", year: 1945, yearLabel: "1945 SCN", title: "Cách mạng Tháng Tám & Tuyên ngôn Độc lập", summary: "Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình ngày 2/9/1945, khai sinh nước Việt Nam Dân chủ Cộng hoà.", location: "Hà Nội" },
  { id: "14", year: 1954, yearLabel: "1954 SCN", title: "Chiến thắng Điện Biên Phủ",            summary: "Chiến dịch Điện Biên Phủ kết thúc thắng lợi, buộc Pháp ký Hiệp định Genève, chấm dứt chiến tranh Đông Dương.", location: "Điện Biên Phủ" },
  { id: "15", year: 1975, yearLabel: "1975 SCN", title: "Giải phóng miền Nam, thống nhất đất nước", summary: "Chiến dịch Hồ Chí Minh toàn thắng ngày 30/4/1975, thống nhất đất nước sau hơn 20 năm chia cắt.", location: "Sài Gòn (TP. HCM)" },
  { id: "16", year: 1986, yearLabel: "1986 SCN", title: "Đổi Mới — cải cách kinh tế toàn diện", summary: "Đại hội Đảng lần VI khởi xướng công cuộc Đổi Mới, chuyển đổi từ kinh tế kế hoạch sang kinh tế thị trường.", location: "Hà Nội" },
];

export const MOCK_PAGE_LIMIT = 6;
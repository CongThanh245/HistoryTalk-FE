/**
 * "Ngày này năm xưa" — curated, static until the BE stores day/month on events
 * (events only carry a year today). Keys are "MM-DD" in the solar calendar.
 */
export interface OnThisDayEntry {
  /** "MM-DD" */
  date: string;
  year: number;
  text: string;
  /** Where to read more inside the app. */
  href?: string;
}

export const ON_THIS_DAY: OnThisDayEntry[] = [
  { date: "01-06", year: 1946, text: "Tổng tuyển cử bầu Quốc hội khóa I — lần đầu tiên người dân cả nước đi bầu." },
  { date: "01-20", year: 1785, text: "Nguyễn Huệ đánh tan quân Xiêm ở trận Rạch Gầm – Xoài Mút trên sông Tiền.", href: "/events" },
  { date: "01-27", year: 1973, text: "Hiệp định Paris về chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam được ký kết." },
  { date: "01-28", year: 1941, text: "Nguyễn Ái Quốc trở về nước, đặt chân lên cột mốc 108 ở Pác Bó (Cao Bằng)." },
  { date: "01-30", year: 1789, text: "Mùng 5 Tết Kỷ Dậu: Quang Trung đại phá quân Thanh, tiến vào Thăng Long sau trận Đống Đa.", href: "/events" },
  { date: "02-03", year: 1930, text: "Thành lập Đảng Cộng sản Việt Nam." },
  { date: "03-06", year: 1946, text: "Ký Hiệp định Sơ bộ Việt – Pháp, tranh thủ thời gian hòa hoãn để chuẩn bị kháng chiến." },
  { date: "03-09", year: 1945, text: "Nhật đảo chính Pháp trên toàn Đông Dương." },
  { date: "03-10", year: 1975, text: "Trận Buôn Ma Thuột mở màn Chiến dịch Tây Nguyên." },
  { date: "03-13", year: 1954, text: "Quân ta nổ súng tấn công cứ điểm Him Lam, mở màn Chiến dịch Điện Biên Phủ.", href: "/events" },
  { date: "03-26", year: 1931, text: "Thành lập Đoàn Thanh niên Cộng sản Hồ Chí Minh." },
  { date: "03-29", year: 1975, text: "Giải phóng thành phố Đà Nẵng." },
  { date: "04-09", year: 1288, text: "Trận Bạch Đằng: Trần Hưng Đạo dùng trận địa cọc nhấn chìm đoàn thuyền quân Nguyên.", href: "/events" },
  { date: "04-25", year: 1976, text: "Tổng tuyển cử bầu Quốc hội chung của nước Việt Nam thống nhất." },
  { date: "04-30", year: 1975, text: "Giải phóng miền Nam, thống nhất đất nước." },
  { date: "05-07", year: 1954, text: "Chiến thắng Điện Biên Phủ “lừng lẫy năm châu, chấn động địa cầu”.", href: "/events" },
  { date: "05-15", year: 1941, text: "Thành lập Đội Thiếu niên Tiền phong Hồ Chí Minh." },
  { date: "05-19", year: 1890, text: "Ngày sinh Chủ tịch Hồ Chí Minh tại làng Kim Liên, Nghệ An." },
  { date: "06-05", year: 1911, text: "Nguyễn Tất Thành rời bến Nhà Rồng, ra đi tìm đường cứu nước." },
  { date: "06-21", year: 1925, text: "Báo Thanh Niên ra số đầu tiên — nay là Ngày Báo chí Cách mạng Việt Nam." },
  { date: "07-13", year: 1885, text: "Vua Hàm Nghi xuống Chiếu Cần Vương, kêu gọi sĩ phu cả nước đứng lên chống Pháp." },
  { date: "07-20", year: 1954, text: "Hiệp định Genève về Đông Dương được ký kết." },
  { date: "07-27", year: 1947, text: "Ngày Thương binh – Liệt sĩ được tổ chức lần đầu tiên." },
  { date: "08-19", year: 1945, text: "Khởi nghĩa giành chính quyền thắng lợi ở Hà Nội." },
  { date: "08-25", year: 1945, text: "Khởi nghĩa giành chính quyền thắng lợi ở Sài Gòn." },
  { date: "08-30", year: 1945, text: "Vua Bảo Đại thoái vị, chấm dứt chế độ quân chủ ở Việt Nam." },
  { date: "09-01", year: 1858, text: "Liên quân Pháp – Tây Ban Nha nổ súng tấn công Đà Nẵng, mở đầu cuộc xâm lược." },
  { date: "09-02", year: 1945, text: "Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình." },
  { date: "09-23", year: 1945, text: "Nam Bộ kháng chiến chống thực dân Pháp quay lại xâm lược." },
  { date: "10-10", year: 1954, text: "Giải phóng Thủ đô Hà Nội." },
  { date: "10-20", year: 1930, text: "Thành lập Hội Liên hiệp Phụ nữ Việt Nam." },
  { date: "11-20", year: 1982, text: "Ngày Nhà giáo Việt Nam được tổ chức lần đầu tiên." },
  { date: "11-23", year: 1940, text: "Khởi nghĩa Nam Kỳ bùng nổ, lá cờ đỏ sao vàng lần đầu xuất hiện." },
  { date: "12-18", year: 1972, text: "Mở đầu 12 ngày đêm “Điện Biên Phủ trên không” bảo vệ bầu trời Hà Nội.", href: "/events" },
  { date: "12-19", year: 1946, text: "Lời kêu gọi Toàn quốc kháng chiến." },
  { date: "12-22", year: 1944, text: "Thành lập Đội Việt Nam Tuyên truyền Giải phóng quân." },
  { date: "12-29", year: 1972, text: "Kết thúc thắng lợi trận “Điện Biên Phủ trên không”." },
];

const key = (d: Date) => `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Today's entries, or the next upcoming one (with how many days away) when today has none. */
export function getOnThisDay(now = new Date()): { entries: OnThisDayEntry[]; daysAway: number } {
  const today = ON_THIS_DAY.filter((e) => e.date === key(now));
  if (today.length) return { entries: today, daysAway: 0 };

  for (let i = 1; i <= 366; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const next = ON_THIS_DAY.filter((e) => e.date === key(d));
    if (next.length) return { entries: next, daysAway: i };
  }
  return { entries: [], daysAway: 0 };
}

export function formatDayMonth(date: string) {
  const [m, d] = date.split("-").map(Number);
  return `${d}/${m}`;
}

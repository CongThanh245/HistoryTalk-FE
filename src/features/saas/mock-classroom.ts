import type { Assignment, ChatActivity, LocalContent, Submission } from "./types";
import { SEED_CLASSES } from "./mock-data";

/**
 * Seed for Sprint 6 classroom features: local history content, assignments, submissions and
 * AI-chat activity. Deterministic so demos look the same on every machine.
 */

const D = "2026-09-15T08:00:00.000Z";
const DAY = 86_400_000;
/** Demo "today"; dates are spread around it so lists show upcoming, due-soon and overdue work. */
export const DEMO_TODAY = new Date("2026-10-05T09:00:00+07:00");
const at = (days: number, hour = 23) => {
  const d = new Date(DEMO_TODAY.getTime() + days * DAY);
  d.setHours(hour, 59, 0, 0);
  return d.toISOString();
};

export const SEED_LOCAL_CONTENT: LocalContent[] = [
  {
    kind: "CONTEXT", id: "lc-ctx-1", schoolId: "sch-lhp", authorId: "t-1", classIds: ["cls-10a1", "cls-11a1"],
    status: "PUBLISHED", createdAt: D, updatedAt: D,
    title: "Khởi nghĩa Nam Kỳ 1940 tại Sài Gòn – Chợ Lớn",
    era: "MODERN", year: 1940, location: "Hóc Môn – Bà Điểm, Sài Gòn",
    summary: "Cuộc khởi nghĩa do Xứ ủy Nam Kỳ lãnh đạo đêm 22/11/1940; lá cờ đỏ sao vàng lần đầu xuất hiện.",
    body: "Đêm 22 rạng sáng 23/11/1940, nghĩa quân ở nhiều tỉnh Nam Kỳ đồng loạt nổi dậy. Tại Hóc Môn – Bà Điểm, nghĩa quân tấn công đồn bót, phá cầu cống, cắt đường giao thông…",
    latitude: 10.8865, longitude: 106.5944,
  },
  {
    kind: "CHARACTER", id: "lc-chr-1", schoolId: "sch-lhp", authorId: "t-1", classIds: ["cls-10a1"],
    status: "PUBLISHED", createdAt: D, updatedAt: D,
    name: "Phan Văn Hớn", title: "Thủ lĩnh khởi nghĩa Hóc Môn 1885", bornYear: 1830, deathYear: 1886,
    biography: "Lãnh đạo cuộc khởi nghĩa chống Pháp năm 1885 ở Hóc Môn, Bà Điểm; bị bắt và hy sinh năm 1886.",
    persona: "Nói giọng Nam Bộ mộc mạc, khảng khái; hay nhắc tới bà con Mười tám thôn vườn trầu.",
    contextId: "lc-ctx-1",
  },
  {
    kind: "QUIZ", id: "lc-quiz-1", schoolId: "sch-lhp", authorId: "t-1", classIds: ["cls-10a1"],
    status: "PUBLISHED", createdAt: D, updatedAt: D,
    title: "Lịch sử Sài Gòn – Gia Định (10 câu)", level: "MEDIUM", contextId: "lc-ctx-1", durationMinutes: 15,
    questions: [
      { id: "q1", prompt: "Khởi nghĩa Nam Kỳ nổ ra vào năm nào?", options: ["1930", "1940", "1945", "1954"], correctIndex: 1, explanation: "Đêm 22/11/1940." },
      { id: "q2", prompt: "Lá cờ đỏ sao vàng lần đầu xuất hiện trong sự kiện nào?", options: ["Xô viết Nghệ Tĩnh", "Khởi nghĩa Bắc Sơn", "Khởi nghĩa Nam Kỳ", "Cách mạng tháng Tám"], correctIndex: 2 },
      { id: "q3", prompt: "Phan Văn Hớn lãnh đạo khởi nghĩa ở đâu?", options: ["Hóc Môn – Bà Điểm", "Cần Giờ", "Thủ Đức", "Củ Chi"], correctIndex: 0 },
    ],
  },
  {
    kind: "CONTEXT", id: "lc-ctx-2", schoolId: "sch-lhp", authorId: "t-1", classIds: ["cls-11a1"],
    status: "PENDING", createdAt: D, updatedAt: at(-1, 15),
    title: "Địa đạo Củ Chi trong kháng chiến chống Mỹ",
    era: "CONTEMPORARY", year: 1965, location: "Củ Chi, TP. Hồ Chí Minh",
    summary: "Hệ thống địa đạo hơn 200 km, nơi quân dân Củ Chi chiến đấu và sinh hoạt.",
    body: "Địa đạo được đào từ thời chống Pháp và mở rộng mạnh trong giai đoạn 1960–1965…",
    latitude: 11.1426, longitude: 106.463,
  },
  {
    kind: "QUIZ", id: "lc-quiz-2", schoolId: "sch-lhp", authorId: "t-2", classIds: ["cls-10a2"],
    status: "DRAFT", createdAt: D, updatedAt: at(-2, 10),
    title: "Bến Nhà Rồng và hành trình tìm đường cứu nước", level: "EASY", durationMinutes: 10,
    questions: [
      { id: "q1", prompt: "Nguyễn Tất Thành rời Bến Nhà Rồng ngày nào?", options: ["5/6/1911", "19/5/1890", "2/9/1945", "3/2/1930"], correctIndex: 0 },
    ],
  },
  {
    kind: "CHARACTER", id: "lc-chr-2", schoolId: "sch-lhp", authorId: "t-2", classIds: ["cls-12a1"],
    status: "INACTIVE", reviewNote: "Bổ sung nguồn tư liệu cho phần tiểu sử trước khi mở lại.", createdAt: D, updatedAt: at(-5, 9),
    name: "Nguyễn Hữu Cảnh", title: "Người mở cõi đất Gia Định (1698)", bornYear: 1650, deathYear: 1700,
    biography: "Năm 1698 được chúa Nguyễn Phúc Chu cử vào kinh lược đất Đồng Nai, lập phủ Gia Định.",
    persona: "Trang trọng, điềm đạm, xưng 'ta' với học trò.",
  },
];

export const SEED_ASSIGNMENTS: Assignment[] = [
  {
    id: "as-1", classId: "cls-10a1", teacherId: "t-1", type: "EVENT", source: "LOCAL", targetId: "lc-ctx-1",
    targetTitle: "Khởi nghĩa Nam Kỳ 1940 tại Sài Gòn – Chợ Lớn", title: "Đọc: Khởi nghĩa Nam Kỳ 1940",
    instructions: "Đọc bối cảnh và ghi lại 3 nguyên nhân thất bại của cuộc khởi nghĩa.", openAt: at(-6, 7), dueAt: at(-1), allowLate: true, createdAt: at(-6, 7),
  },
  {
    id: "as-2", classId: "cls-10a1", teacherId: "t-1", type: "CHAT", source: "LOCAL", targetId: "lc-chr-1",
    targetTitle: "Phan Văn Hớn", title: "Phỏng vấn Phan Văn Hớn",
    instructions: "Hỏi nhân vật về lý do khởi nghĩa và cách tổ chức nghĩa quân. Gửi ít nhất 6 tin nhắn.", openAt: at(-3, 7), dueAt: at(2), minMessages: 6, allowLate: false, createdAt: at(-3, 7),
  },
  {
    id: "as-3", classId: "cls-10a1", teacherId: "t-1", type: "TEST", source: "LOCAL", targetId: "lc-quiz-1",
    targetTitle: "Lịch sử Sài Gòn – Gia Định (10 câu)", title: "Kiểm tra 15 phút: Sài Gòn – Gia Định",
    instructions: "Làm một lần, có tính điểm hệ số 1.", openAt: at(-2, 7), dueAt: at(5), maxScore: 10, graded: true, allowLate: false, createdAt: at(-2, 7),
  },
  {
    id: "as-4", classId: "cls-10a1", teacherId: "t-1", type: "TEST", source: "GLOBAL", targetId: "global-quiz-bach-dang",
    targetTitle: "Trận Bạch Đằng 938", title: "Kiểm tra: Trận Bạch Đằng 938",
    instructions: "Bài test lấy điểm giữa kỳ.", openAt: at(-12, 7), dueAt: at(-8), maxScore: 10, graded: true, allowLate: false, createdAt: at(-12, 7),
  },
  {
    id: "as-5", classId: "cls-11a1", teacherId: "t-1", type: "CHAT", source: "GLOBAL", targetId: "global-character-nguyen-hue",
    targetTitle: "Nguyễn Huệ", title: "Trò chuyện với Nguyễn Huệ về trận Rạch Gầm",
    instructions: "Hỏi về chiến thuật mai phục trên sông Mỹ Tho.", openAt: at(-4, 7), dueAt: at(1), minMessages: 5, allowLate: true, createdAt: at(-4, 7),
  },
];

/** Deterministic pseudo-random in [0, 1) so the seed is stable. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

function makeSubmissions(): Submission[] {
  const list: Submission[] = [];
  for (const a of SEED_ASSIGNMENTS) {
    const cls = SEED_CLASSES.find((c) => c.id === a.classId);
    if (!cls) continue;
    const past = new Date(a.dueAt) < DEMO_TODAY;
    cls.studentIds.forEach((studentId, i) => {
      const r = rand(i + a.id.length * 31 + Number(a.id.slice(3)) * 7);
      const done = past ? r > 0.15 : r > 0.45;
      const started = !done && r > 0.25;
      const id = `sub-${a.id}-${studentId}`;
      if (!done && !started) {
        list.push({ id, assignmentId: a.id, studentId, status: past ? "MISSING" : "NOT_STARTED" });
        return;
      }
      if (!done) {
        list.push({ id, assignmentId: a.id, studentId, status: "IN_PROGRESS", messageCount: a.type === "CHAT" ? Math.floor(r * 4) : undefined });
        return;
      }
      list.push({
        id, assignmentId: a.id, studentId,
        status: past && r < 0.3 ? "LATE" : "SUBMITTED",
        score: a.type === "TEST" ? Math.round((4 + rand(i * 13 + 5) * 6) * 2) / 2 : undefined,
        messageCount: a.type === "CHAT" ? (a.minMessages ?? 5) + Math.floor(rand(i + 3) * 8) : undefined,
        submittedAt: new Date(new Date(a.dueAt).getTime() - rand(i + 11) * 3 * DAY).toISOString(),
      });
    });
  }
  return list;
}

export const SEED_SUBMISSIONS: Submission[] = makeSubmissions();

function makeChatActivity(): ChatActivity[] {
  const list: ChatActivity[] = [];
  const studentIds = Array.from(new Set(SEED_CLASSES.flatMap((c) => c.studentIds)));
  for (let d = 13; d >= 0; d -= 1) {
    const date = new Date(DEMO_TODAY.getTime() - d * DAY).toISOString().slice(0, 10);
    studentIds.forEach((studentId, i) => {
      const r = rand(i * 17 + d * 3);
      if (r < 0.35) return;
      const messages = Math.round(r * 18);
      list.push({ studentId, date, messages, tokens: messages * (180 + Math.round(rand(i + d) * 120)) });
    });
  }
  return list;
}

export const SEED_CHAT_ACTIVITY: ChatActivity[] = makeChatActivity();

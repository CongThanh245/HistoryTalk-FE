import type {
  ClassMapPin,
  Classroom,
  PersonalMapPin,
  School,
  SchoolActivity,
  SchoolAdminAccount,
  StudentAccount,
  TeacherAccount,
} from "./types";

/**
 * Seed data for the school (SaaS) mock UI. Replace with API calls once the
 * Sprint 5–6 backend endpoints exist; the store keeps the same shapes.
 */

export const PLAN_LABELS: Record<School["plan"], string> = {
  ENTERPRISE_1: "Enterprise 1",
  ENTERPRISE_2: "Enterprise 2",
  ENTERPRISE_3: "Enterprise 3",
};

/** Default quotas per package; a school can be configured differently. */
export const PLAN_DEFAULTS: Record<School["plan"], { dailyTokensPerStudent: number; dailyTokensPerTeacher: number; maxStudents: number }> = {
  ENTERPRISE_1: { dailyTokensPerStudent: 3000, dailyTokensPerTeacher: 10000, maxStudents: 300 },
  ENTERPRISE_2: { dailyTokensPerStudent: 6000, dailyTokensPerTeacher: 20000, maxStudents: 1000 },
  ENTERPRISE_3: { dailyTokensPerStudent: 12000, dailyTokensPerTeacher: 40000, maxStudents: 3000 },
};

/** 34 provinces / centrally-run cities after the 2025 administrative merger. */
export const PROVINCES = [
  "Hà Nội", "TP. Hồ Chí Minh", "Hải Phòng", "Đà Nẵng", "Cần Thơ", "Huế",
  "An Giang", "Bắc Ninh", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Điện Biên", "Đồng Nai", "Đồng Tháp",
  "Gia Lai", "Hà Tĩnh", "Hưng Yên", "Khánh Hòa", "Lai Châu", "Lâm Đồng", "Lạng Sơn", "Lào Cai",
  "Nghệ An", "Ninh Bình", "Phú Thọ", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sơn La", "Tây Ninh",
  "Thái Nguyên", "Thanh Hóa", "Tuyên Quang", "Vĩnh Long",
];

const D = "2026-09-01T08:00:00.000Z";

export const SEED_SCHOOLS: School[] = [
  {
    id: "sch-lhp",
    name: "THPT Lê Hồng Phong",
    code: "LHP-HCM",
    province: "TP. Hồ Chí Minh",
    address: "235 Nguyễn Văn Cừ, Quận 5",
    plan: "ENTERPRISE_2",
    ...PLAN_DEFAULTS.ENTERPRISE_2,
    status: "ACTIVE",
    contractEndsAt: "2027-06-30",
    createdAt: D,
  },
  {
    id: "sch-cvt",
    name: "THCS Chu Văn An",
    code: "CVA-HN",
    province: "Hà Nội",
    address: "10 Thụy Khuê, Tây Hồ",
    plan: "ENTERPRISE_1",
    ...PLAN_DEFAULTS.ENTERPRISE_1,
    status: "ACTIVE",
    contractEndsAt: "2027-05-31",
    createdAt: D,
  },
  {
    id: "sch-ntmk",
    name: "THPT Nguyễn Thị Minh Khai",
    code: "NTMK-DN",
    province: "Đà Nẵng",
    plan: "ENTERPRISE_3",
    ...PLAN_DEFAULTS.ENTERPRISE_3,
    status: "SUSPENDED",
    contractEndsAt: "2026-08-31",
    createdAt: D,
  },
  ...(
    [
      ["sch-ptnk", "Phổ thông Năng khiếu", "PTNK-HCM", "TP. Hồ Chí Minh", "153 Nguyễn Chí Thanh, Quận 5", "ENTERPRISE_3", "ACTIVE", "2027-08-31", "2026-03-12"],
      ["sch-qh", "THPT Quốc Học Huế", "QH-HUE", "Huế", "12 Lê Lợi", "ENTERPRISE_2", "ACTIVE", "2027-06-30", "2026-04-02"],
      ["sch-tp", "THPT chuyên Trần Phú", "TP-HP", "Hải Phòng", "12 Trần Phú, Ngô Quyền", "ENTERPRISE_2", "ACTIVE", "2027-05-31", "2026-05-20"],
      ["sch-lqd", "THPT chuyên Lê Quý Đôn", "LQD-KH", "Khánh Hòa", "67 Yersin, Nha Trang", "ENTERPRISE_1", "ACTIVE", "2027-01-15", "2026-06-08"],
      ["sch-ltt", "THPT chuyên Lý Tự Trọng", "LTT-CT", "Cần Thơ", "Cách Mạng Tháng 8, Bình Thủy", "ENTERPRISE_1", "ACTIVE", "2026-11-30", "2026-06-15"],
      ["sch-pbc", "THPT chuyên Phan Bội Châu", "PBC-NA", "Nghệ An", "119 Lê Hồng Phong, Vinh", "ENTERPRISE_2", "ACTIVE", "2027-07-31", "2026-07-01"],
      ["sch-hna", "THPT chuyên Hà Nội – Amsterdam", "HNA-HN", "Hà Nội", "1 Hoàng Minh Giám, Cầu Giấy", "ENTERPRISE_3", "ACTIVE", "2028-06-30", "2026-07-22"],
      ["sch-nd", "THCS Nguyễn Du", "ND-DL", "Đắk Lắk", "Buôn Ma Thuột", "ENTERPRISE_1", "SUSPENDED", "2026-09-15", "2026-02-10"],
      ["sch-bl", "THPT chuyên Bạc Liêu", "BL-CM", "Cà Mau", "Phường 1, Bạc Liêu", "ENTERPRISE_1", "ACTIVE", "2027-09-30", "2026-09-28"],
    ] as const
  ).map(
    ([id, name, code, province, address, plan, status, contractEndsAt, created]): School => ({
      id,
      name,
      code,
      province,
      address,
      plan,
      ...PLAN_DEFAULTS[plan],
      status,
      contractEndsAt,
      createdAt: `${created}T08:00:00.000Z`,
    }),
  ),
];

export const SEED_SCHOOL_ADMINS: SchoolAdminAccount[] = [
  { id: "sa-1", schoolId: "sch-lhp", fullName: "Trần Thị Mai", email: "mai.tran@lhp.edu.vn", phone: "0903 112 233", status: "ACTIVE", createdAt: D },
  { id: "sa-2", schoolId: "sch-cvt", fullName: "Nguyễn Văn Hùng", email: "hung.nv@cva.edu.vn", status: "ACTIVE", createdAt: D },
  { id: "sa-3", schoolId: "sch-ntmk", fullName: "Lê Quang Vinh", email: "vinh.lq@ntmk.edu.vn", status: "LOCKED", createdAt: D },
  { id: "sa-4", schoolId: "sch-lhp", fullName: "Ngô Thanh Tùng", email: "tung.nt@lhp.edu.vn", phone: "0912 445 667", status: "INVITED", createdAt: "2026-09-20T08:00:00.000Z" },
  { id: "sa-5", schoolId: "sch-ptnk", fullName: "Đỗ Hoàng Yến", email: "yen.dh@ptnk.edu.vn", phone: "0938 220 118", status: "ACTIVE", createdAt: "2026-03-12T08:00:00.000Z" },
  { id: "sa-6", schoolId: "sch-ptnk", fullName: "Bùi Gia Huy", email: "huy.bg@ptnk.edu.vn", status: "ACTIVE", createdAt: "2026-03-14T08:00:00.000Z" },
  { id: "sa-7", schoolId: "sch-qh", fullName: "Tôn Nữ Thanh Hương", email: "huong.tnt@quochoc.edu.vn", phone: "0905 334 556", status: "ACTIVE", createdAt: "2026-04-02T08:00:00.000Z" },
  { id: "sa-8", schoolId: "sch-tp", fullName: "Vũ Đức Thắng", email: "thang.vd@chuyentranphu.edu.vn", status: "ACTIVE", createdAt: "2026-05-20T08:00:00.000Z" },
  { id: "sa-9", schoolId: "sch-lqd", fullName: "Phan Minh Trí", email: "tri.pm@lqd.edu.vn", phone: "0983 776 120", status: "ACTIVE", createdAt: "2026-06-08T08:00:00.000Z" },
  { id: "sa-10", schoolId: "sch-ltt", fullName: "Lâm Thị Kim Ngân", email: "ngan.ltk@ltt.edu.vn", status: "ACTIVE", createdAt: "2026-06-15T08:00:00.000Z" },
  { id: "sa-11", schoolId: "sch-pbc", fullName: "Hồ Sỹ Nam", email: "nam.hs@pbc.edu.vn", phone: "0976 101 202", status: "ACTIVE", createdAt: "2026-07-01T08:00:00.000Z" },
  { id: "sa-12", schoolId: "sch-hna", fullName: "Nguyễn Khánh Linh", email: "linh.nk@hn-ams.edu.vn", phone: "0904 567 890", status: "ACTIVE", createdAt: "2026-07-22T08:00:00.000Z" },
  { id: "sa-13", schoolId: "sch-hna", fullName: "Trịnh Quốc Việt", email: "viet.tq@hn-ams.edu.vn", status: "INVITED", createdAt: "2026-10-02T08:00:00.000Z" },
  { id: "sa-14", schoolId: "sch-nd", fullName: "Y Bluên Niê", email: "bluen.y@nguyendu-dl.edu.vn", status: "ACTIVE", createdAt: "2026-02-10T08:00:00.000Z" },
  { id: "sa-15", schoolId: "sch-bl", fullName: "Châu Ngọc Hân", email: "han.cn@chuyenbaclieu.edu.vn", phone: "0919 202 303", status: "INVITED", createdAt: "2026-09-28T08:00:00.000Z" },
];

/** The demo School Admin / Teacher / Student accounts all belong to this school. */
export const DEMO_SCHOOL_ID = "sch-lhp";
/** Logged-in teachers and students are mapped onto these mock records until the API exists. */
export const DEMO_TEACHER_ID = "t-1";
export const DEMO_STUDENT_ID = "st-1";

const FAMILY = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"];
const MIDDLE = ["Văn", "Thị", "Minh", "Ngọc", "Gia", "Quốc", "Thanh", "Hoài", "Bảo", "Anh"];
const GIVEN = ["An", "Bình", "Châu", "Dũng", "Giang", "Hà", "Hải", "Khoa", "Linh", "Long", "My", "Nam", "Nhi", "Phúc", "Quân", "Tâm", "Thảo", "Trang", "Tuấn", "Vy"];

/** Other schools on the package: [schoolId, key, classes [grade, name][], teacher count, students per class]. */
const OTHER_SCHOOLS: [string, string, [number, string][], number, number][] = [
  ["sch-ptnk", "ptnk", [[10, "10 Sử"], [11, "11 Sử"]], 3, 12],
  ["sch-qh", "qh", [[10, "10A"], [11, "11B"]], 2, 9],
  ["sch-tp", "tp", [[12, "12 Văn"]], 2, 10],
  ["sch-pbc", "pbc", [[10, "10A1"], [10, "10A2"]], 2, 8],
  ["sch-hna", "hna", [[10, "10 Sử 1"], [11, "11 Sử 1"], [12, "12 Sử 1"]], 3, 10],
  ["sch-cvt", "cvt", [[8, "8A"], [9, "9A"]], 2, 7],
  ["sch-ntmk", "ntmk", [[11, "11 Chuyên Sử"]], 1, 6],
];

export const SEED_TEACHERS: TeacherAccount[] = [
  { id: "t-1", schoolId: "sch-lhp", fullName: "Phạm Minh Đức", email: "duc.pm@lhp.edu.vn", phone: "0908 123 456", subject: "Lịch sử", status: "ACTIVE", createdAt: D },
  { id: "t-2", schoolId: "sch-lhp", fullName: "Võ Thị Hồng", email: "hong.vt@lhp.edu.vn", phone: "0937 555 210", subject: "Lịch sử", status: "ACTIVE", createdAt: D },
  { id: "t-3", schoolId: "sch-lhp", fullName: "Đặng Quốc Bảo", email: "bao.dq@lhp.edu.vn", subject: "Địa lý", status: "INVITED", createdAt: D },
  { id: "t-4", schoolId: "sch-lhp", fullName: "Huỳnh Ngọc Lan", email: "lan.hn@lhp.edu.vn", subject: "Lịch sử", status: "LOCKED", createdAt: D },
  { id: "t-5", schoolId: "sch-lhp", fullName: "Trương Công Định", email: "dinh.tc@lhp.edu.vn", subject: "Giáo dục công dân", status: "ACTIVE", createdAt: D },
  { id: "t-6", schoolId: "sch-lhp", fullName: "Lý Thu Thảo", email: "thao.lt@lhp.edu.vn", phone: "0889 432 100", subject: "Ngữ văn", status: "INVITED", createdAt: "2026-10-01T08:00:00.000Z" },
  ...OTHER_SCHOOLS.flatMap(([schoolId, key, , teachers]) =>
    Array.from({ length: teachers }, (_, k): TeacherAccount => {
      const n = key.length * 7 + k * 5;
      return {
        id: `t-${key}-${k + 1}`,
        schoolId,
        fullName: `${FAMILY[n % FAMILY.length]} ${MIDDLE[(n + 3) % MIDDLE.length]} ${GIVEN[(n + 11) % GIVEN.length]}`,
        email: `gv${k + 1}.${key}@school.edu.vn`,
        subject: k === 2 ? "Địa lý" : "Lịch sử",
        status: "ACTIVE",
        createdAt: D,
      };
    }),
  ),
];


function makeStudents(): StudentAccount[] {
  const list: StudentAccount[] = [];
  for (let i = 1; i <= 64; i += 1) {
    const grade = i <= 22 ? 10 : i <= 44 ? 11 : 12;
    const fullName = `${FAMILY[i % FAMILY.length]} ${MIDDLE[(i * 3) % MIDDLE.length]} ${GIVEN[(i * 7) % GIVEN.length]}`;
    const code = `HS${grade}${String(i).padStart(3, "0")}`;
    list.push({
      id: `st-${i}`,
      schoolId: "sch-lhp",
      fullName,
      studentCode: code,
      username: code.toLowerCase(),
      grade,
      dateOfBirth: `${2026 - grade - 6}-0${(i % 9) + 1}-1${i % 9}`,
      status: i % 17 === 0 ? "LOCKED" : "ACTIVE",
      tokensUsedToday: (i * 397) % 6000,
      createdAt: D,
    });
  }
  return list;
}

/** Students of the other schools; ids "st-<key>-<n>" never collide with the demo school's "st-<n>". */
function makeOtherStudents(): StudentAccount[] {
  const list: StudentAccount[] = [];
  for (const [schoolId, key, classes, , perClass] of OTHER_SCHOOLS) {
    classes.forEach(([grade], ci) => {
      for (let k = 1; k <= perClass; k += 1) {
        const n = ci * perClass + k;
        const seedN = n * 5 + key.length;
        const code = `${key.toUpperCase()}${grade}${String(n).padStart(3, "0")}`;
        list.push({
          id: `st-${key}-${n}`,
          schoolId,
          fullName: `${FAMILY[seedN % FAMILY.length]} ${MIDDLE[(seedN * 3) % MIDDLE.length]} ${GIVEN[(seedN * 7) % GIVEN.length]}`,
          studentCode: code,
          username: code.toLowerCase(),
          grade,
          status: "ACTIVE",
          tokensUsedToday: (seedN * 251) % 3000,
          createdAt: D,
        });
      }
    });
  }
  return list;
}

export const SEED_STUDENTS: StudentAccount[] = [...makeStudents(), ...makeOtherStudents()];

const ids = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, k) => `st-${from + k}`);

export const SEED_CLASSES: Classroom[] = [
  { id: "cls-10a1", schoolId: "sch-lhp", name: "10A1", grade: 10, schoolYear: "2026-2027", homeroomTeacherId: "t-1", teacherIds: ["t-1"], studentIds: ids(1, 12), createdAt: D },
  { id: "cls-10a2", schoolId: "sch-lhp", name: "10A2", grade: 10, schoolYear: "2026-2027", homeroomTeacherId: "t-2", teacherIds: ["t-2", "t-1"], studentIds: ids(13, 20), createdAt: D },
  { id: "cls-11a1", schoolId: "sch-lhp", name: "11A1", grade: 11, schoolYear: "2026-2027", homeroomTeacherId: "t-1", teacherIds: ["t-1"], studentIds: ids(23, 36), createdAt: D },
  { id: "cls-11a2", schoolId: "sch-lhp", name: "11A2", grade: 11, schoolYear: "2026-2027", homeroomTeacherId: null, teacherIds: ["t-2"], studentIds: ids(37, 42), createdAt: D },
  { id: "cls-12a1", schoolId: "sch-lhp", name: "12A1", grade: 12, schoolYear: "2026-2027", homeroomTeacherId: "t-4", teacherIds: ["t-2"], studentIds: ids(45, 58), createdAt: D },
  ...OTHER_SCHOOLS.flatMap(([schoolId, key, classes, teachers, perClass]) =>
    classes.map(([grade, name], ci): Classroom => {
      const teacherId = `t-${key}-${(ci % teachers) + 1}`;
      return {
        id: `cls-${key}-${ci + 1}`,
        schoolId,
        name,
        grade,
        schoolYear: "2026-2027",
        homeroomTeacherId: ci === 0 ? teacherId : null,
        teacherIds: [teacherId],
        studentIds: Array.from({ length: perClass }, (_, k) => `st-${key}-${ci * perClass + k + 1}`),
        createdAt: D,
      };
    }),
  ),
];

/** A few audit entries per school so the "Nhật ký" tab is not empty in demos. */
export const SEED_ACTIVITY: SchoolActivity[] = [
  { id: "log-lhp-1", schoolId: "sch-lhp", kind: "SCHOOL", actor: "Quản trị hệ thống", message: "Tạo trường, gói Enterprise 2", at: "2026-09-01T08:00:00.000Z" },
  { id: "log-lhp-2", schoolId: "sch-lhp", kind: "ADMIN", actor: "Quản trị hệ thống", message: "Tạo tài khoản quản trị trường Trần Thị Mai (mai.tran@lhp.edu.vn)", at: "2026-09-01T08:05:00.000Z" },
  { id: "log-lhp-3", schoolId: "sch-lhp", kind: "TEACHER", actor: "Trần Thị Mai", message: "Tạo 5 tài khoản giáo viên", at: "2026-09-02T02:10:00.000Z" },
  { id: "log-lhp-4", schoolId: "sch-lhp", kind: "STUDENT", actor: "Trần Thị Mai", message: "Nhập 64 học sinh từ file hoc-sinh-2026.csv", at: "2026-09-03T03:30:00.000Z" },
  { id: "log-lhp-5", schoolId: "sch-lhp", kind: "CLASS", actor: "Trần Thị Mai", message: "Tạo 5 lớp năm học 2026-2027 và xếp học sinh", at: "2026-09-03T04:00:00.000Z" },
  { id: "log-lhp-6", schoolId: "sch-lhp", kind: "ADMIN", actor: "Quản trị hệ thống", message: "Mời quản trị trường Ngô Thanh Tùng (tung.nt@lhp.edu.vn)", at: "2026-09-20T08:00:00.000Z" },
  { id: "log-ntmk-1", schoolId: "sch-ntmk", kind: "SCHOOL", actor: "Quản trị hệ thống", message: "Tạm ngưng trường: hợp đồng hết hạn 31/08/2026", at: "2026-09-01T09:00:00.000Z" },
  { id: "log-ntmk-2", schoolId: "sch-ntmk", kind: "ADMIN", actor: "Quản trị hệ thống", message: "Khóa tài khoản quản trị trường Lê Quang Vinh", at: "2026-09-01T09:02:00.000Z" },
  { id: "log-nd-1", schoolId: "sch-nd", kind: "SCHOOL", actor: "Quản trị hệ thống", message: "Tạm ngưng trường: chưa gia hạn hợp đồng", at: "2026-09-16T01:00:00.000Z" },
  ...SEED_SCHOOLS.filter((x) => x.id !== "sch-lhp").map(
    (x): SchoolActivity => ({
      id: `log-${x.id}-created`,
      schoolId: x.id,
      kind: "SCHOOL",
      actor: "Quản trị hệ thống",
      message: `Tạo trường, gói ${PLAN_LABELS[x.plan]}`,
      at: x.createdAt,
    }),
  ),
];

export const SEED_CLASS_PINS: ClassMapPin[] = [
  {
    id: "cp-1", classId: "cls-10a1", createdBy: "t-1", kind: "LOCAL_HISTORY",
    label: "Bến Nhà Rồng",
    description: "Nơi Nguyễn Tất Thành ra đi tìm đường cứu nước ngày 5/6/1911. Ghi lại 3 điều bạn thấy khi tham quan bảo tàng.",
    latitude: 10.7681, longitude: 106.7068, year: 1911, createdAt: D,
  },
  {
    id: "cp-2", classId: "cls-10a1", createdBy: "t-1", kind: "ASSIGNMENT",
    label: "Bài tập: Dinh Độc Lập 30/4/1975",
    description: "Đọc bối cảnh Chiến dịch Hồ Chí Minh, trò chuyện với nhân vật Văn Tiến Dũng và làm quiz 10 câu.",
    latitude: 10.7770, longitude: 106.6953, year: 1975, dueDate: "2026-10-10", assignmentId: "as-3", createdAt: D,
  },
  {
    id: "cp-3", classId: "cls-10a1", createdBy: "t-1", kind: "LOCAL_HISTORY",
    label: "Địa đạo Củ Chi",
    description: "Hệ thống địa đạo dài hơn 200 km trong kháng chiến. Tìm hiểu cách quân dân Củ Chi sinh hoạt dưới lòng đất.",
    latitude: 11.1426, longitude: 106.4630, year: 1948, createdAt: D,
  },
  {
    id: "cp-4", classId: "cls-11a1", createdBy: "t-1", kind: "ASSIGNMENT",
    label: "Bài tập: Trận Rạch Gầm – Xoài Mút",
    description: "So sánh chiến thuật mai phục trên sông của Nguyễn Huệ với trận Bạch Đằng 938.",
    latitude: 10.3360, longitude: 106.2140, year: 1785, dueDate: "2026-10-06", assignmentId: "as-5", createdAt: D,
  },
];

export const SEED_PERSONAL_PINS: PersonalMapPin[] = [
  {
    id: "pp-1", ownerId: "demo", label: "Ôn thi: Điện Biên Phủ",
    note: "Nhớ mốc 13/3 – 7/5/1954, 3 đợt tấn công.",
    latitude: 21.3856, longitude: 103.0168, createdAt: D,
  },
];

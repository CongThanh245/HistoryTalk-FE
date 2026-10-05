import type {
  ClassMapPin,
  Classroom,
  PersonalMapPin,
  School,
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
];

export const SEED_SCHOOL_ADMINS: SchoolAdminAccount[] = [
  { id: "sa-1", schoolId: "sch-lhp", fullName: "Trần Thị Mai", email: "mai.tran@lhp.edu.vn", phone: "0903 112 233", status: "ACTIVE", createdAt: D },
  { id: "sa-2", schoolId: "sch-cvt", fullName: "Nguyễn Văn Hùng", email: "hung.nv@cva.edu.vn", status: "ACTIVE", createdAt: D },
  { id: "sa-3", schoolId: "sch-ntmk", fullName: "Lê Quang Vinh", email: "vinh.lq@ntmk.edu.vn", status: "LOCKED", createdAt: D },
];

/** The demo School Admin / Teacher / Student accounts all belong to this school. */
export const DEMO_SCHOOL_ID = "sch-lhp";
/** Logged-in teachers and students are mapped onto these mock records until the API exists. */
export const DEMO_TEACHER_ID = "t-1";
export const DEMO_STUDENT_ID = "st-1";

export const SEED_TEACHERS: TeacherAccount[] = [
  { id: "t-1", schoolId: "sch-lhp", fullName: "Phạm Minh Đức", email: "duc.pm@lhp.edu.vn", subject: "Lịch sử", status: "ACTIVE", createdAt: D },
  { id: "t-2", schoolId: "sch-lhp", fullName: "Võ Thị Hồng", email: "hong.vt@lhp.edu.vn", subject: "Lịch sử", status: "ACTIVE", createdAt: D },
  { id: "t-3", schoolId: "sch-lhp", fullName: "Đặng Quốc Bảo", email: "bao.dq@lhp.edu.vn", subject: "Địa lý", status: "INVITED", createdAt: D },
  { id: "t-4", schoolId: "sch-lhp", fullName: "Huỳnh Ngọc Lan", email: "lan.hn@lhp.edu.vn", subject: "Lịch sử", status: "LOCKED", createdAt: D },
];

const FAMILY = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"];
const MIDDLE = ["Văn", "Thị", "Minh", "Ngọc", "Gia", "Quốc", "Thanh", "Hoài", "Bảo", "Anh"];
const GIVEN = ["An", "Bình", "Châu", "Dũng", "Giang", "Hà", "Hải", "Khoa", "Linh", "Long", "My", "Nam", "Nhi", "Phúc", "Quân", "Tâm", "Thảo", "Trang", "Tuấn", "Vy"];

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

export const SEED_STUDENTS: StudentAccount[] = makeStudents();

const ids = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, k) => `st-${from + k}`);

export const SEED_CLASSES: Classroom[] = [
  { id: "cls-10a1", schoolId: "sch-lhp", name: "10A1", grade: 10, schoolYear: "2026-2027", homeroomTeacherId: "t-1", teacherIds: ["t-1"], studentIds: ids(1, 12), createdAt: D },
  { id: "cls-10a2", schoolId: "sch-lhp", name: "10A2", grade: 10, schoolYear: "2026-2027", homeroomTeacherId: "t-2", teacherIds: ["t-2", "t-1"], studentIds: ids(13, 20), createdAt: D },
  { id: "cls-11a1", schoolId: "sch-lhp", name: "11A1", grade: 11, schoolYear: "2026-2027", homeroomTeacherId: "t-1", teacherIds: ["t-1"], studentIds: ids(23, 36), createdAt: D },
  { id: "cls-11a2", schoolId: "sch-lhp", name: "11A2", grade: 11, schoolYear: "2026-2027", homeroomTeacherId: null, teacherIds: ["t-2"], studentIds: ids(37, 42), createdAt: D },
  { id: "cls-12a1", schoolId: "sch-lhp", name: "12A1", grade: 12, schoolYear: "2026-2027", homeroomTeacherId: "t-4", teacherIds: ["t-2"], studentIds: ids(45, 58), createdAt: D },
];

export const SEED_CLASS_PINS: ClassMapPin[] = [
  {
    id: "cp-1", classId: "cls-10a1", createdBy: "t-1", kind: "LOCAL_HISTORY",
    label: "Bến Nhà Rồng",
    description: "Nơi Nguyễn Tất Thành ra đi tìm đường cứu nước ngày 5/6/1911. Ghi lại 3 điều em thấy khi tham quan bảo tàng.",
    latitude: 10.7681, longitude: 106.7068, year: 1911, createdAt: D,
  },
  {
    id: "cp-2", classId: "cls-10a1", createdBy: "t-1", kind: "ASSIGNMENT",
    label: "Bài tập: Dinh Độc Lập 30/4/1975",
    description: "Đọc bối cảnh Chiến dịch Hồ Chí Minh, trò chuyện với nhân vật Văn Tiến Dũng và làm quiz 10 câu.",
    latitude: 10.7770, longitude: 106.6953, year: 1975, dueDate: "2026-10-12", createdAt: D,
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
    latitude: 10.3360, longitude: 106.2140, year: 1785, dueDate: "2026-10-09", createdAt: D,
  },
];

export const SEED_PERSONAL_PINS: PersonalMapPin[] = [
  {
    id: "pp-1", ownerId: "demo", label: "Ôn thi: Điện Biên Phủ",
    note: "Nhớ mốc 13/3 – 7/5/1954, 3 đợt tấn công.",
    latitude: 21.3856, longitude: 103.0168, createdAt: D,
  },
];

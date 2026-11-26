import fs from "node:fs";
import path from "node:path";
import { api, login, loginAndSettlePassword } from "./api";
import { E2E_PASSWORD, FIXTURE_FILE, SEED } from "./env";

/** Accounts and ids the suites rely on; created once on the dev DB and reused while they still log in. */
export interface Fixtures {
  stamp: string;
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  classId: string;
  className: string;
  schoolAdmin: { email: string; password: string };
  teacher: { email: string; password: string; uid: string };
  students: { email: string; password: string; code: string; uid: string }[];
}

const TEMP_STUDENT_PASSWORD = "E2eTemp@2026";

export function readFixtures(): Fixtures | null {
  try {
    return JSON.parse(fs.readFileSync(FIXTURE_FILE, "utf8")) as Fixtures;
  } catch {
    return null;
  }
}

async function stillValid(f: Fixtures): Promise<boolean> {
  try {
    await Promise.all([login(f.schoolAdmin.email, f.schoolAdmin.password), login(f.teacher.email, f.teacher.password), login(f.students[0].email, f.students[0].password)]);
    return true;
  } catch {
    return false;
  }
}

/** Creates a fresh school (admin, teacher, class with 2 students) through the API, every password settled to E2E_PASSWORD. */
export async function provision(): Promise<Fixtures> {
  const cached = readFixtures();
  if (cached && (await stillValid(cached))) return cached;

  const stamp = new Date().toISOString().replace(/\D/g, "").slice(4, 12); // MMDDhhmm
  const domain = "e2etest.edu.vn";
  const sys = await login(SEED.systemAdmin.email, SEED.systemAdmin.password);

  const school = await api<{ id: string; schoolCode: string; name: string }>("POST", "/admin/schools", {
    token: sys.accessToken,
    body: { name: `E2E School ${stamp}`, contactEmail: `contact.${stamp}@${domain}`, packageType: "ENTERPRISE_SMALL", localHistoryPolicyAccepted: true },
  });

  const adminEmail = `admin.${stamp}@${domain}`;
  const admin = await api<{ initialPassword: string }>("POST", "/admin/school-admins", {
    token: sys.accessToken,
    body: { schoolId: school.id, fullName: `E2E Quản Trị ${stamp}`, email: adminEmail },
  });
  const sa = await loginAndSettlePassword(adminEmail, admin.initialPassword, E2E_PASSWORD);

  const teacherEmail = `gv.${stamp}@${domain}`;
  const teacher = await api<{ uid: string; initialPassword: string }>("POST", "/school-admin/teachers", {
    token: sa.accessToken,
    body: { fullName: `E2E Giáo Viên ${stamp}`, email: teacherEmail },
  });
  await loginAndSettlePassword(teacherEmail, teacher.initialPassword, E2E_PASSWORD);

  const className = "10E2E";
  const academicYear = new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  const room = await api<{ id: string }>("POST", "/classrooms", {
    token: sa.accessToken,
    body: { className, gradeLevel: 10, academicYear, teacherId: teacher.uid },
  });

  const students = [1, 2].map((n) => ({ code: `E2E${stamp.slice(-4)}${n}`, email: `hs${n}.${stamp}@${domain}`, name: n === 1 ? "Học Sinh Một" : "Học Sinh Hai" }));
  const csv =
    "student_code,full_name,email,dob,gender,phone_number,password\n" +
    students.map((s, i) => `${s.code},${s.name},${s.email},2010-0${i + 1}-15,${i ? "FEMALE" : "MALE"},,${TEMP_STUDENT_PASSWORD}`).join("\n") +
    "\n";
  const form = new FormData();
  form.append("file", new Blob([csv], { type: "text/csv" }), "e2e.csv");
  const imported = await api<{ successfulAccounts: { uid: string; email: string }[] }>("POST", `/classrooms/${room.id}/students/import-csv?defaultInitialToken=0`, {
    token: sa.accessToken,
    form,
  });
  for (const s of students) await loginAndSettlePassword(s.email, TEMP_STUDENT_PASSWORD, E2E_PASSWORD);

  const fixtures: Fixtures = {
    stamp,
    schoolId: school.id,
    schoolCode: school.schoolCode,
    schoolName: school.name,
    classId: room.id,
    className,
    schoolAdmin: { email: adminEmail, password: E2E_PASSWORD },
    teacher: { email: teacherEmail, password: E2E_PASSWORD, uid: teacher.uid },
    students: students.map((s) => ({
      email: s.email,
      password: E2E_PASSWORD,
      code: s.code,
      uid: imported.successfulAccounts.find((a) => a.email === s.email)?.uid ?? "",
    })),
  };
  fs.mkdirSync(path.dirname(FIXTURE_FILE), { recursive: true });
  fs.writeFileSync(FIXTURE_FILE, JSON.stringify(fixtures, null, 2));
  return fixtures;
}

export function credentialsFor(role: string, f: Fixtures): { email: string; password: string } {
  switch (role) {
    case "systemAdmin":
      return SEED.systemAdmin;
    case "contentAdmin":
      return SEED.contentAdmin;
    case "customer":
      return SEED.customer;
    case "schoolAdmin":
      return f.schoolAdmin;
    case "teacher":
      return f.teacher;
    case "student":
      return f.students[0];
    default:
      throw new Error(`Unknown role ${role}`);
  }
}

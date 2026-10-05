"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEMO_SCHOOL_ID,
  DEMO_STUDENT_ID,
  DEMO_TEACHER_ID,
  SEED_CLASSES,
  SEED_CLASS_PINS,
  SEED_PERSONAL_PINS,
  SEED_SCHOOLS,
  SEED_SCHOOL_ADMINS,
  SEED_STUDENTS,
  SEED_TEACHERS,
} from "./mock-data";
import { SEED_ASSIGNMENTS, SEED_CHAT_ACTIVITY, SEED_LOCAL_CONTENT, SEED_SUBMISSIONS } from "./mock-classroom";
import type {
  Assignment,
  ChatActivity,
  LocalContent,
  LocalContentStatus,
  Submission,
  ClassMapPin,
  Classroom,
  PersonalMapPin,
  School,
  SchoolAdminAccount,
  StudentAccount,
  TeacherAccount,
} from "./types";

/**
 * Mock store for the school (SaaS) UI. State lives in localStorage so CRUD actions survive reloads
 * during demos; `resetMockData` restores the seed. Swap each action for an API mutation later.
 */

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();

interface SaasState {
  schools: School[];
  schoolAdmins: SchoolAdminAccount[];
  teachers: TeacherAccount[];
  students: StudentAccount[];
  classes: Classroom[];
  classPins: ClassMapPin[];
  personalPins: PersonalMapPin[];
  localContent: LocalContent[];
  assignments: Assignment[];
  submissions: Submission[];
  chatActivity: ChatActivity[];

  // ── System Admin: schools + School Admin accounts (row 2) ──
  createSchool: (school: Omit<School, "id" | "createdAt">, admin: Omit<SchoolAdminAccount, "id" | "schoolId" | "createdAt">) => School;
  updateSchool: (id: string, patch: Partial<School>) => void;
  addSchoolAdmin: (admin: Omit<SchoolAdminAccount, "id" | "createdAt">) => void;
  updateSchoolAdmin: (id: string, patch: Partial<SchoolAdminAccount>) => void;
  removeSchoolAdmin: (id: string) => void;

  // ── School Admin: teachers and students (rows 3–4) ──
  createTeacher: (teacher: Omit<TeacherAccount, "id" | "createdAt">) => void;
  updateTeacher: (id: string, patch: Partial<TeacherAccount>) => void;
  removeTeacher: (id: string) => void;
  createStudents: (students: Omit<StudentAccount, "id" | "createdAt" | "tokensUsedToday">[], classId?: string) => StudentAccount[];
  updateStudent: (id: string, patch: Partial<StudentAccount>) => void;
  removeStudent: (id: string) => void;

  // ── Classes (rows 6–7) ──
  createClass: (cls: Omit<Classroom, "id" | "createdAt" | "studentIds"> & { studentIds?: string[] }) => Classroom;
  updateClass: (id: string, patch: Partial<Classroom>) => void;
  removeClass: (id: string) => void;
  addStudentsToClass: (classId: string, studentIds: string[]) => void;
  removeStudentFromClass: (classId: string, studentId: string) => void;
  moveStudent: (studentId: string, fromClassId: string, toClassId: string) => void;

  // ── Map layers ──
  createClassPin: (pin: Omit<ClassMapPin, "id" | "createdAt">) => ClassMapPin;
  updateClassPin: (id: string, patch: Partial<ClassMapPin>) => void;
  removeClassPin: (id: string) => void;
  createPersonalPin: (pin: Omit<PersonalMapPin, "id" | "createdAt">) => PersonalMapPin;
  updatePersonalPin: (id: string, patch: Partial<PersonalMapPin>) => void;
  removePersonalPin: (id: string) => void;

  // ── Lịch sử địa phương (rows 12–13) ──
  createLocalContent: (item: Omit<LocalContent, "id" | "createdAt" | "updatedAt">) => LocalContent;
  updateLocalContent: (id: string, patch: Partial<LocalContent>) => void;
  /** Teacher submits a draft; School Admin publishes / deactivates / trashes / sends back with a note. */
  setLocalContentStatus: (id: string, status: LocalContentStatus, reviewNote?: string) => void;
  removeLocalContent: (id: string) => void;

  // ── Bài tập (rows 16–17) ──
  createAssignment: (item: Omit<Assignment, "id" | "createdAt">) => Assignment;
  updateAssignment: (id: string, patch: Partial<Assignment>) => void;
  removeAssignment: (id: string) => void;
  /** Creates or updates the student's submission for an assignment. */
  upsertSubmission: (assignmentId: string, studentId: string, patch: Partial<Submission>) => void;

  resetMockData: () => void;
}

const seed = () => ({
  schools: SEED_SCHOOLS,
  schoolAdmins: SEED_SCHOOL_ADMINS,
  teachers: SEED_TEACHERS,
  students: SEED_STUDENTS,
  classes: SEED_CLASSES,
  classPins: SEED_CLASS_PINS,
  personalPins: SEED_PERSONAL_PINS,
  localContent: SEED_LOCAL_CONTENT,
  assignments: SEED_ASSIGNMENTS,
  submissions: SEED_SUBMISSIONS,
  chatActivity: SEED_CHAT_ACTIVITY,
});

export const useSaasStore = create<SaasState>()(
  persist(
    (set) => ({
      ...seed(),

      createSchool: (school, admin) => {
        const created: School = { ...school, id: uid("sch"), createdAt: now() };
        set((s) => ({
          schools: [created, ...s.schools],
          schoolAdmins: [{ ...admin, id: uid("sa"), schoolId: created.id, createdAt: now() }, ...s.schoolAdmins],
        }));
        return created;
      },
      updateSchool: (id, patch) => set((s) => ({ schools: s.schools.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      addSchoolAdmin: (admin) => set((s) => ({ schoolAdmins: [{ ...admin, id: uid("sa"), createdAt: now() }, ...s.schoolAdmins] })),
      updateSchoolAdmin: (id, patch) => set((s) => ({ schoolAdmins: s.schoolAdmins.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeSchoolAdmin: (id) => set((s) => ({ schoolAdmins: s.schoolAdmins.filter((x) => x.id !== id) })),

      createTeacher: (teacher) => set((s) => ({ teachers: [{ ...teacher, id: uid("t"), createdAt: now() }, ...s.teachers] })),
      updateTeacher: (id, patch) => set((s) => ({ teachers: s.teachers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeTeacher: (id) =>
        set((s) => ({
          teachers: s.teachers.filter((x) => x.id !== id),
          classes: s.classes.map((c) => ({
            ...c,
            homeroomTeacherId: c.homeroomTeacherId === id ? null : c.homeroomTeacherId,
            teacherIds: c.teacherIds.filter((t) => t !== id),
          })),
        })),
      createStudents: (students, classId) => {
        const created = students.map((st) => ({ ...st, id: uid("st"), tokensUsedToday: 0, createdAt: now() }));
        set((s) => ({
          students: [...created, ...s.students],
          classes: classId
            ? s.classes.map((c) => (c.id === classId ? { ...c, studentIds: [...c.studentIds, ...created.map((x) => x.id)] } : c))
            : s.classes,
        }));
        return created;
      },
      updateStudent: (id, patch) => set((s) => ({ students: s.students.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeStudent: (id) =>
        set((s) => ({
          students: s.students.filter((x) => x.id !== id),
          classes: s.classes.map((c) => ({ ...c, studentIds: c.studentIds.filter((x) => x !== id) })),
        })),

      createClass: (cls) => {
        const created: Classroom = { ...cls, studentIds: cls.studentIds ?? [], id: uid("cls"), createdAt: now() };
        set((s) => ({ classes: [...s.classes, created] }));
        return created;
      },
      updateClass: (id, patch) => set((s) => ({ classes: s.classes.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeClass: (id) =>
        set((s) => ({ classes: s.classes.filter((x) => x.id !== id), classPins: s.classPins.filter((p) => p.classId !== id) })),
      addStudentsToClass: (classId, studentIds) =>
        set((s) => ({
          classes: s.classes.map((c) =>
            c.id === classId ? { ...c, studentIds: Array.from(new Set([...c.studentIds, ...studentIds])) } : c,
          ),
        })),
      removeStudentFromClass: (classId, studentId) =>
        set((s) => ({
          classes: s.classes.map((c) => (c.id === classId ? { ...c, studentIds: c.studentIds.filter((x) => x !== studentId) } : c)),
        })),
      moveStudent: (studentId, fromClassId, toClassId) =>
        set((s) => ({
          classes: s.classes.map((c) => {
            if (c.id === fromClassId) return { ...c, studentIds: c.studentIds.filter((x) => x !== studentId) };
            if (c.id === toClassId && !c.studentIds.includes(studentId)) return { ...c, studentIds: [...c.studentIds, studentId] };
            return c;
          }),
        })),

      createClassPin: (pin) => {
        const created: ClassMapPin = { ...pin, id: uid("cp"), createdAt: now() };
        set((s) => ({ classPins: [...s.classPins, created] }));
        return created;
      },
      updateClassPin: (id, patch) => set((s) => ({ classPins: s.classPins.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeClassPin: (id) => set((s) => ({ classPins: s.classPins.filter((x) => x.id !== id) })),
      createPersonalPin: (pin) => {
        const created: PersonalMapPin = { ...pin, id: uid("pp"), createdAt: now() };
        set((s) => ({ personalPins: [...s.personalPins, created] }));
        return created;
      },
      updatePersonalPin: (id, patch) => set((s) => ({ personalPins: s.personalPins.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removePersonalPin: (id) => set((s) => ({ personalPins: s.personalPins.filter((x) => x.id !== id) })),

      createLocalContent: (item) => {
        const created = { ...item, id: uid("lc"), createdAt: now(), updatedAt: now() } as LocalContent;
        set((s) => ({ localContent: [created, ...s.localContent] }));
        return created;
      },
      updateLocalContent: (id, patch) =>
        set((s) => ({
          localContent: s.localContent.map((x) => (x.id === id ? ({ ...x, ...patch, updatedAt: now() } as LocalContent) : x)),
        })),
      setLocalContentStatus: (id, status, reviewNote) =>
        set((s) => ({
          localContent: s.localContent.map((x) =>
            x.id === id ? ({ ...x, status, reviewNote: reviewNote ?? x.reviewNote, updatedAt: now() } as LocalContent) : x,
          ),
        })),
      removeLocalContent: (id) => set((s) => ({ localContent: s.localContent.filter((x) => x.id !== id) })),

      createAssignment: (item) => {
        const created: Assignment = { ...item, id: uid("as"), createdAt: now() };
        set((s) => {
          const cls = s.classes.find((c) => c.id === item.classId);
          const fresh: Submission[] = (cls?.studentIds ?? []).map((studentId) => ({
            id: uid("sub"), assignmentId: created.id, studentId, status: "NOT_STARTED",
          }));
          return { assignments: [created, ...s.assignments], submissions: [...s.submissions, ...fresh] };
        });
        return created;
      },
      updateAssignment: (id, patch) => set((s) => ({ assignments: s.assignments.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeAssignment: (id) =>
        set((s) => ({
          assignments: s.assignments.filter((x) => x.id !== id),
          submissions: s.submissions.filter((x) => x.assignmentId !== id),
        })),
      upsertSubmission: (assignmentId, studentId, patch) =>
        set((s) => {
          const existing = s.submissions.find((x) => x.assignmentId === assignmentId && x.studentId === studentId);
          if (existing) {
            return { submissions: s.submissions.map((x) => (x === existing ? { ...x, ...patch } : x)) };
          }
          return {
            submissions: [...s.submissions, { id: uid("sub"), assignmentId, studentId, status: "NOT_STARTED", ...patch }],
          };
        }),

      resetMockData: () => set(seed()),
    }),
    { name: "historytalk:saas-mock:v1" },
  ),
);

/** Until the API exists, the logged-in school accounts are mapped onto demo records. */
export const useDemoSchoolId = () => DEMO_SCHOOL_ID;
export const useDemoTeacherId = () => DEMO_TEACHER_ID;
export const useDemoStudentId = () => DEMO_STUDENT_ID;

/** Classes the current teacher teaches or the current student belongs to (Role Matrix row 8). */
export function useMyClasses(role: string | null | undefined) {
  const classes = useSaasStore((s) => s.classes);
  if (role === "TEACHER") return classes.filter((c) => c.teacherIds.includes(DEMO_TEACHER_ID) || c.homeroomTeacherId === DEMO_TEACHER_ID);
  if (role === "SCHOOL_STUDENT") return classes.filter((c) => c.studentIds.includes(DEMO_STUDENT_ID));
  return [];
}

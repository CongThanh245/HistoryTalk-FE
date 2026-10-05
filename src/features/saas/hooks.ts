"use client";

import { useMemo } from "react";
import { useSaasStore } from "./store";
import type { Classroom, StudentAccount, TeacherAccount } from "./types";

/**
 * Derived, school-scoped views of the mock store. Each hook selects the raw (stable) arrays and filters
 * in useMemo, so zustand never sees a fresh array from a selector.
 */
export function useSchoolData(schoolId: string | undefined) {
  const schools = useSaasStore((s) => s.schools);
  const schoolAdmins = useSaasStore((s) => s.schoolAdmins);
  const allTeachers = useSaasStore((s) => s.teachers);
  const allStudents = useSaasStore((s) => s.students);
  const allClasses = useSaasStore((s) => s.classes);

  return useMemo(() => {
    const school = schools.find((x) => x.id === schoolId) ?? null;
    const admins = schoolAdmins.filter((x) => x.schoolId === schoolId);
    const teachers = allTeachers.filter((x) => x.schoolId === schoolId);
    const students = allStudents.filter((x) => x.schoolId === schoolId);
    const classes = allClasses
      .filter((x) => x.schoolId === schoolId)
      .sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name, "vi"));

    const teacherById = new Map<string, TeacherAccount>(teachers.map((t) => [t.id, t]));
    const studentById = new Map<string, StudentAccount>(students.map((st) => [st.id, st]));
    /** First class a student belongs to (students normally sit in exactly one class). */
    const classByStudent = new Map<string, Classroom>();
    for (const c of classes) for (const id of c.studentIds) if (!classByStudent.has(id)) classByStudent.set(id, c);

    return { school, admins, teachers, students, classes, teacherById, studentById, classByStudent };
  }, [schools, schoolAdmins, allTeachers, allStudents, allClasses, schoolId]);
}

/** Class counts per school, for the System Admin schools table. */
export function useSchoolCounts() {
  const students = useSaasStore((s) => s.students);
  const classes = useSaasStore((s) => s.classes);
  const teachers = useSaasStore((s) => s.teachers);
  return useMemo(() => {
    const count = (list: { schoolId: string }[]) => {
      const m = new Map<string, number>();
      for (const x of list) m.set(x.schoolId, (m.get(x.schoolId) ?? 0) + 1);
      return m;
    };
    return { students: count(students), classes: count(classes), teachers: count(teachers) };
  }, [students, classes, teachers]);
}

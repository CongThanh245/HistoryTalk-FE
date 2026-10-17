"use client";

import { useMemo } from "react";
import { DUE_SOON_MS, isDone, relativeTime, studentNow } from "./hooks-student";
import { DEMO_SCHOOL_ID, DEMO_STUDENT_ID, DEMO_TEACHER_ID, SEED_CLASS_PINS } from "./mock-data";
import { useSaasStore } from "./store";
import type { Assignment, ClassMapPin, Classroom, LocalContext, PersonalMapPin, PersonalPinColor, Submission } from "./types";

/**
 * Global + Custom map (Role Matrix row 21). Everyone sees the global battle map; the class and personal
 * layers depend on the role. Data comes from the mock store until the map-layer API exists.
 */
export type MapLayerKey = "global" | "class" | "personal" | "local";

export type MapUserRole =
  | "CUSTOMER"
  | "SCHOOL_STUDENT"
  | "TEACHER"
  | "CONTENT_ADMIN"
  | "SYSTEM_ADMIN";

/** Which classes feed the class-layer picker. */
export type MapClassScope = "teacher" | "student" | "school" | "all";

export interface MapRoleConfig {
  layers: MapLayerKey[];
  globalEditable: boolean;
  classEditable: boolean;
  personalEditable: boolean;
  classScope: MapClassScope | null;
  /** Class layer ticked on first load (admins only preview it on demand). */
  classDefaultOn: boolean;
  /** The class / personal layers read the mock store. */
  usesMockLayers: boolean;
}

const GUEST_CONFIG: MapRoleConfig = {
  layers: ["global"],
  globalEditable: false,
  classEditable: false,
  personalEditable: false,
  classScope: null,
  classDefaultOn: false,
  usesMockLayers: false,
};

export function getMapRoleConfig(role: string | null | undefined): MapRoleConfig {
  switch (role as MapUserRole | null | undefined) {
    case "CUSTOMER":
      return { ...GUEST_CONFIG, layers: ["global", "personal"], personalEditable: true, usesMockLayers: true };
    case "SCHOOL_STUDENT":
      return {
        ...GUEST_CONFIG,
        layers: ["global", "class", "personal"],
        personalEditable: true,
        classScope: "student",
        classDefaultOn: true,
        usesMockLayers: true,
      };
    case "TEACHER":
      return {
        ...GUEST_CONFIG,
        layers: ["global", "class"],
        classEditable: true,
        classScope: "teacher",
        classDefaultOn: true,
        usesMockLayers: true,
      };
    case "CONTENT_ADMIN":
    case "SYSTEM_ADMIN":
      return { ...GUEST_CONFIG, layers: ["global", "class"], globalEditable: true, classScope: "all" };
    default:
      return GUEST_CONFIG;
  }
}

/** Classes the class-layer picker offers for the given scope, sorted by grade then name. */
export function useMapClassOptions(scope: MapClassScope | null): Classroom[] {
  const classes = useSaasStore((s) => s.classes);
  return useMemo(() => {
    const list = classes.filter((c) => {
      if (scope === "teacher") return c.teacherIds.includes(DEMO_TEACHER_ID) || c.homeroomTeacherId === DEMO_TEACHER_ID;
      if (scope === "student") return c.studentIds.includes(DEMO_STUDENT_ID);
      if (scope === "school") return c.schoolId === DEMO_SCHOOL_ID;
      return scope === "all";
    });
    return [...list].sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name, "vi"));
  }, [classes, scope]);
}

const hasCoordinates = (item: LocalContext) =>
  typeof item.latitude === "number" && Number.isFinite(item.latitude) &&
  typeof item.longitude === "number" && Number.isFinite(item.longitude);

/**
 * Published local contexts with coordinates a class sees on its map: CLASS scope shared with the class,
 * or SCHOOL scope of the class's school ("Của trường").
 */
const isPublishedClassContext = (item: { kind: string }, cls: Pick<Classroom, "id" | "schoolId"> | undefined): item is LocalContext => {
  if (!cls || item.kind !== "CONTEXT") return false;
  const ctx = item as LocalContext;
  if (ctx.status !== "PUBLISHED" || !hasCoordinates(ctx)) return false;
  return ctx.scope === "SCHOOL" ? ctx.schoolId === cls.schoolId : ctx.classIds.includes(cls.id);
};

/** "Của trường" for school-wide contexts. */
export const isSchoolContext = (ctx: LocalContext) => ctx.scope === "SCHOOL";

/** Pins of one class plus its published local contexts that carry coordinates. */
export function useClassLayer(classId: string | null) {
  const classPins = useSaasStore((s) => s.classPins);
  const localContent = useSaasStore((s) => s.localContent);
  const classes = useSaasStore((s) => s.classes);
  return useMemo(() => {
    if (!classId) return { pins: [] as ClassMapPin[], contexts: [] as LocalContext[] };
    const cls = classes.find((c) => c.id === classId);
    const pins = classPins.filter((p) => p.classId === classId);
    const contexts = localContent.filter((item): item is LocalContext => isPublishedClassContext(item, cls));
    return { pins, contexts };
  }, [classPins, localContent, classes, classId]);
}

/** Markers per class (pins + published contexts with coordinates), for the class switcher. */
export function useClassMarkerCounts(classes: Classroom[]): Record<string, number> {
  const classPins = useSaasStore((s) => s.classPins);
  const localContent = useSaasStore((s) => s.localContent);
  return useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of classes) {
      counts[c.id] =
        classPins.filter((p) => p.classId === c.id).length +
        localContent.filter((item) => isPublishedClassContext(item, c)).length;
    }
    return counts;
  }, [classes, classPins, localContent]);
}

/**
 * Published local contexts a teacher can drop a class pin on: shared with the class or written by the
 * teacher, and carrying coordinates.
 */
export function usePlaceableLocalContexts(classId: string | null): LocalContext[] {
  const localContent = useSaasStore((s) => s.localContent);
  return useMemo(
    () =>
      localContent.filter(
        (item): item is LocalContext =>
          item.kind === "CONTEXT" &&
          item.status === "PUBLISHED" &&
          hasCoordinates(item) &&
          (item.scope === "SCHOOL"
            ? item.schoolId === DEMO_SCHOOL_ID
            : (classId !== null && item.classIds.includes(classId)) || item.authorId === DEMO_TEACHER_ID),
      ),
    [localContent, classId],
  );
}

/** Assignments of one class, soonest deadline first (for attaching one to an ASSIGNMENT pin). */
export function useClassAssignments(classId: string | null): Assignment[] {
  const assignments = useSaasStore((s) => s.assignments);
  return useMemo(
    () => (classId ? assignments.filter((a) => a.classId === classId).sort((a, b) => a.dueAt.localeCompare(b.dueAt)) : []),
    [assignments, classId],
  );
}

/** Personal study pins of one owner. */
export function usePersonalPins(ownerId: string | null): PersonalMapPin[] {
  const personalPins = useSaasStore((s) => s.personalPins);
  return useMemo(() => (ownerId ? personalPins.filter((p) => p.ownerId === ownerId || p.ownerId === "demo") : []), [personalPins, ownerId]);
}

/** Notes one learner may keep on the map (mock quota until the API defines one). */
export const PERSONAL_PIN_LIMIT = 50;

export const PERSONAL_PIN_COLORS: { value: PersonalPinColor; label: string }[] = [
  { value: "jade", label: "Ngọc bích" },
  { value: "men-lam", label: "Men lam" },
  { value: "gold", label: "Vàng lá" },
  { value: "crimson", label: "Đỏ son" },
  { value: "ink", label: "Mực" },
];

/** Id stamped on class pins created by the logged-in teacher (mock mapping). */
export const MAP_TEACHER_ID = DEMO_TEACHER_ID;

/** The map's clock: same demo "today" as the assignment screens, so due states agree everywhere. */
export const mapNow = () => studentNow();

/** Today as yyyy-mm-dd in local time (date input `min`). */
export function todayIso(date: Date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDueDate(value: string | undefined) {
  if (!value) return "";
  const [y, m, d] = value.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : value;
}

/** yyyy-mm-dd of an ISO timestamp in local time. */
export const isoToLocalDate = (iso: string) => todayIso(new Date(iso));

// ── Due state of assignment pins ─────────────────────────────────────────────

export type PinDueState = "OPEN" | "DUE_SOON" | "OVERDUE" | "DONE";

export interface PinDue {
  state: PinDueState;
  /** Short chip text: "Đã nộp", "Quá hạn", "Sắp hạn", "Còn hạn". */
  label: string;
  /** "Còn 2 ngày 4 giờ" / "Quá hạn 1 ngày". */
  relative: string;
  /** Text inside the marker badge (none while there is plenty of time). */
  badge?: string;
}

export interface ClassPinView {
  pin: ClassMapPin;
  /** Assignment of the same class the pin points at (explicit link or the seed's link). */
  assignment?: Assignment;
  /** Effective deadline (ISO): the assignment's `dueAt`, else the end of the pin's `dueDate`. */
  dueAt?: string;
  due?: PinDue;
}

const DAY_MS = 86_400_000;

/** Pins saved before `assignmentId` existed fall back to the link in the seed. */
export function pinAssignmentId(pin: ClassMapPin) {
  return pin.assignmentId ?? SEED_CLASS_PINS.find((seed) => seed.id === pin.id)?.assignmentId;
}

export function pinDueAt(pin: ClassMapPin, assignment?: Assignment) {
  if (pin.kind !== "ASSIGNMENT") return undefined;
  if (assignment) return assignment.dueAt;
  if (!pin.dueDate) return undefined;
  const end = new Date(`${pin.dueDate.slice(0, 10)}T23:59:00`);
  return Number.isNaN(end.getTime()) ? undefined : end.toISOString();
}

export function computePinDue(dueAt: string, submission?: Submission, now: Date = mapNow()): PinDue {
  const relative = relativeTime(dueAt, now);
  if (isDone(submission?.status)) {
    return { state: "DONE", label: submission?.status === "LATE" ? "Nộp muộn" : "Đã nộp", relative, badge: "✓" };
  }
  const left = new Date(dueAt).getTime() - now.getTime();
  if (left < 0) return { state: "OVERDUE", label: "Quá hạn", relative, badge: "!" };
  if (left <= DUE_SOON_MS) return { state: "DUE_SOON", label: "Sắp hạn", relative, badge: `${Math.max(1, Math.ceil(left / DAY_MS))}N` };
  return { state: "OPEN", label: "Còn hạn", relative };
}

/**
 * Class pins enriched with their assignment and due state. With `studentId`, a handed-in assignment
 * reads "Đã nộp" (student view); without it only the deadline counts (teacher / admin view).
 */
export function useClassPinViews(pins: ClassMapPin[], studentId: string | null): ClassPinView[] {
  const assignments = useSaasStore((s) => s.assignments);
  const submissions = useSaasStore((s) => s.submissions);
  return useMemo(() => {
    const now = mapNow();
    return pins.map((pin) => {
      const linkedId = pinAssignmentId(pin);
      const assignment = linkedId ? assignments.find((a) => a.id === linkedId && a.classId === pin.classId) : undefined;
      const dueAt = pinDueAt(pin, assignment);
      const submission =
        studentId && assignment ? submissions.find((x) => x.assignmentId === assignment.id && x.studentId === studentId) : undefined;
      return { pin, assignment, dueAt, due: dueAt ? computePinDue(dueAt, submission, now) : undefined };
    });
  }, [pins, assignments, submissions, studentId]);
}

/** Kept for older callers: an ASSIGNMENT pin whose deadline has passed (demo clock). */
export function isPinOverdue(pin: Pick<ClassMapPin, "kind" | "dueDate">) {
  if (pin.kind !== "ASSIGNMENT" || !pin.dueDate) return false;
  return new Date(`${pin.dueDate.slice(0, 10)}T23:59:00`).getTime() < mapNow().getTime();
}

/** Student id the map reads submissions for (mock mapping of the logged-in school student). */
export const MAP_STUDENT_ID = DEMO_STUDENT_ID;

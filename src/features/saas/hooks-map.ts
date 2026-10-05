"use client";

import { useMemo } from "react";
import { DEMO_SCHOOL_ID, DEMO_STUDENT_ID, DEMO_TEACHER_ID } from "./mock-data";
import { useSaasStore } from "./store";
import type { ClassMapPin, Classroom, LocalContext, PersonalMapPin } from "./types";

/**
 * Global + Custom map (Role Matrix row 21). Everyone sees the global battle map; the class and personal
 * layers depend on the role. Data comes from the mock store until the map-layer API exists.
 */
export type MapLayerKey = "global" | "class" | "personal";

export type MapUserRole =
  | "CUSTOMER"
  | "SCHOOL_STUDENT"
  | "TEACHER"
  | "CONTENT_ADMIN"
  | "SYSTEM_ADMIN"
  | "SCHOOL_ADMIN";

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
    case "SCHOOL_ADMIN":
      return { ...GUEST_CONFIG, layers: ["global", "class"], classScope: "school", classDefaultOn: true, usesMockLayers: true };
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

/** Pins of one class plus its published local contexts that carry coordinates. */
export function useClassLayer(classId: string | null) {
  const classPins = useSaasStore((s) => s.classPins);
  const localContent = useSaasStore((s) => s.localContent);
  return useMemo(() => {
    if (!classId) return { pins: [] as ClassMapPin[], contexts: [] as LocalContext[] };
    const pins = classPins.filter((p) => p.classId === classId);
    const contexts = localContent.filter(
      (item): item is LocalContext =>
        item.kind === "CONTEXT" && item.status === "PUBLISHED" && item.classIds.includes(classId) && hasCoordinates(item),
    );
    return { pins, contexts };
  }, [classPins, localContent, classId]);
}

/**
 * Local contexts a teacher can drop a class pin on: any non-trashed context with coordinates that is
 * shared with the class or written by the teacher.
 */
export function usePlaceableLocalContexts(classId: string | null): LocalContext[] {
  const localContent = useSaasStore((s) => s.localContent);
  return useMemo(
    () =>
      localContent.filter(
        (item): item is LocalContext =>
          item.kind === "CONTEXT" &&
          item.status !== "TRASH" &&
          hasCoordinates(item) &&
          ((classId !== null && item.classIds.includes(classId)) || item.authorId === DEMO_TEACHER_ID),
      ),
    [localContent, classId],
  );
}

/** Personal study pins of one owner. */
export function usePersonalPins(ownerId: string | null): PersonalMapPin[] {
  const personalPins = useSaasStore((s) => s.personalPins);
  return useMemo(() => (ownerId ? personalPins.filter((p) => p.ownerId === ownerId || p.ownerId === "demo") : []), [personalPins, ownerId]);
}

/** Id stamped on class pins created by the logged-in teacher (mock mapping). */
export const MAP_TEACHER_ID = DEMO_TEACHER_ID;

/** Today as yyyy-mm-dd in local time, for comparing `dueDate`. */
export function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isPinOverdue(pin: Pick<ClassMapPin, "kind" | "dueDate">) {
  return pin.kind === "ASSIGNMENT" && Boolean(pin.dueDate) && (pin.dueDate as string).slice(0, 10) < todayIso();
}

export function formatDueDate(value: string | undefined) {
  if (!value) return "";
  const [y, m, d] = value.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : value;
}

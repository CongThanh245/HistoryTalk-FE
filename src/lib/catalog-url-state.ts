import type { EventEra } from "@/constants/eras";

export type EventView = "all" | "time";

export function parseEra(value: string | null | undefined): EventEra {
  if (
    value === "ancient" ||
    value === "medieval" ||
    value === "modern" ||
    value === "contemporary"
  ) {
    return value;
  }
  return "all";
}

export function parsePage(value: string | null | undefined): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : 1;
}

export function parseEventView(value: string | null | undefined): EventView {
  return value === "time" ? "time" : "all";
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Cấu hình các thời đại lịch sử Việt Nam.
 * Move từ event.service.ts → đây vì đây là business constant,
 * không phải config riêng của service.
 */

export type EventEra =
  | "all"
  | "ancient"
  | "medieval"
  | "modern"
  | "contemporary";

export type EventEraBackend =
  | "ANCIENT"
  | "MEDIEVAL"
  | "MODERN"
  | "CONTEMPORARY";

export const ERA_CONFIG: Record<
  EventEra,
  { label: string; range: [number, number] }
> = {
  all: { label: "Tất cả", range: [-Infinity, Infinity] },
  ancient: { label: "Cổ đại", range: [-Infinity, 937] },
  medieval: { label: "Trung đại", range: [938, 1857] },
  modern: { label: "Cận đại", range: [1858, 1944] },
  contemporary: { label: "Hiện đại", range: [1945, Infinity] },
} as const;

/** Lấy era từ năm */
export function getEraFromYear(year: number): Exclude<EventEra, "all"> {
  if (year <= 937) return "ancient";
  if (year <= 1857) return "medieval";
  if (year <= 1944) return "modern";
  return "contemporary";
}

/** Map nhãn hiển thị từ backend era string */
export function mapEraLabel(backendEra?: string): string {
  if (!backendEra) return "";
  const key = backendEra.toLowerCase() as EventEra;
  return ERA_CONFIG[key]?.label ?? backendEra;
}

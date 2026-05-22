// services/period.service.ts
// Historical periods (mốc lãnh thổ Việt Nam) — mỗi period có GeoJSON các vùng

import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";
import { DAI_VIET_1653 } from "@/data/periods/dai-viet-1653";
import { DAI_VIET_1658 } from "@/data/periods/dai-viet-1658";
import { DAI_VIET_1679 } from "@/data/periods/dai-viet-1679";

// ── Region (1 vùng lãnh thổ trong 1 period) ─────────────────

export interface RegionProperties {
  regionId: string;
  name: string;
  ruler?: string;
  capital?: string;
  color: string;          // fill color
  description?: string;
  imageUrl?: string;      // hover card thumbnail
  /** ID dynasty/state — dùng để cross-reference giữa các period */
  dynastyId?: string;
}

export type RegionFeature = GeoJSON.Feature<
  Polygon | MultiPolygon,
  RegionProperties
>;

export type PeriodGeoJSON = FeatureCollection<
  Polygon | MultiPolygon,
  RegionProperties
>;

// ── Period (1 mốc thời gian) ────────────────────────────────

export interface HistoricalPeriod {
  periodId: string;
  /** Tên đầy đủ: "Đại Việt năm 1653 — Trịnh Nguyễn phân tranh" */
  name: string;
  /** Tên ngắn hiển thị trên timeline tick */
  shortName: string;
  /** Năm đại diện (dùng để sắp xếp + hiển thị) */
  year: number;
  /** Khoảng năm period này có hiệu lực (để filter landmark/event) */
  yearStart: number;
  yearEnd: number;
  /** Mô tả ngắn về period */
  description: string;
  /** Triều đại/giai đoạn chính */
  dynasty?: string;
  geojson: PeriodGeoJSON;
}

// ── Danh sách period (sắp xếp theo năm tăng dần) ────────────

export const PERIODS: HistoricalPeriod[] = [
  {
    periodId: "dai-viet-1653",
    name: "Đại Việt năm 1653",
    shortName: "1653",
    year: 1653,
    yearStart: 1650,
    yearEnd: 1657,
    dynasty: "Trịnh - Nguyễn phân tranh",
    description:
      "Giai đoạn Trịnh - Nguyễn phân tranh. Đàng Ngoài do Vua Lê - Chúa Trịnh cai trị, Đàng Trong do Chúa Nguyễn cai trị. Lãnh thổ Đại Việt kéo dài tới Phú Yên.",
    geojson: DAI_VIET_1653,
  },
  {
    periodId: "dai-viet-1658",
    name: "Đại Việt năm 1658",
    shortName: "1658",
    year: 1658,
    yearStart: 1658,
    yearEnd: 1678,
    dynasty: "Trịnh - Nguyễn phân tranh",
    description:
      "Chúa Nguyễn bắt đầu khai phá vùng Trấn Biên - Gia Định, mở rộng dần về phương Nam.",
    geojson: DAI_VIET_1658,
  },
  {
    periodId: "dai-viet-1679",
    name: "Đại Việt năm 1679",
    shortName: "1679",
    year: 1679,
    yearStart: 1679,
    yearEnd: 1700,
    dynasty: "Trịnh - Nguyễn phân tranh",
    description:
      "Chúa Nguyễn dời thủ phủ về Phú Xuân, tiếp tục Nam tiến, đón nhận người Hoa di cư đến Trấn Biên - Gia Định.",
    geojson: DAI_VIET_1679,
  },
];

// ── Helper ──────────────────────────────────────────────────

export function getPeriodById(periodId: string): HistoricalPeriod | undefined {
  return PERIODS.find((p) => p.periodId === periodId);
}

/** Period mặc định khi mở map */
export const DEFAULT_PERIOD = PERIODS[0];

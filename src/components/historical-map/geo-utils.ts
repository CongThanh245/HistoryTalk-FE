// components/historical-map/geo-utils.ts
// Tiện ích geo: point-in-polygon (ray-casting algorithm)

import type {
  PeriodGeoJSON,
  RegionFeature,
  RegionProperties,
} from "@/services/period.service";

/** Kiểm tra điểm có nằm trong polygon (ring là array các [lng, lat]) */
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Kiểm tra điểm nằm trong feature (hỗ trợ Polygon và MultiPolygon) */
export function pointInFeature(
  lng: number,
  lat: number,
  feature: RegionFeature,
): boolean {
  const geom = feature.geometry;
  if (geom.type === "Polygon") {
    // First ring is outer, rest are holes
    const [outer, ...holes] = geom.coordinates;
    if (!pointInRing(lng, lat, outer)) return false;
    return holes.every((h) => !pointInRing(lng, lat, h));
  }
  if (geom.type === "MultiPolygon") {
    return geom.coordinates.some((poly) => {
      const [outer, ...holes] = poly;
      if (!pointInRing(lng, lat, outer)) return false;
      return holes.every((h) => !pointInRing(lng, lat, h));
    });
  }
  return false;
}

/** Tìm region chứa 1 điểm (lat, lng) trong period */
export function findRegionAt(
  lat: number,
  lng: number,
  geojson: PeriodGeoJSON,
): RegionProperties | null {
  for (const f of geojson.features) {
    if (pointInFeature(lng, lat, f as RegionFeature)) {
      return f.properties;
    }
  }
  return null;
}

/** Lọc các landmark nằm trong 1 region cụ thể */
export function landmarksInRegion<T extends { lat: number; lng: number }>(
  landmarks: T[],
  region: RegionFeature,
): T[] {
  return landmarks.filter((lm) => pointInFeature(lm.lng, lm.lat, region));
}

/** Lấy feature từ geojson theo regionId */
export function getRegionFeature(
  geojson: PeriodGeoJSON,
  regionId: string,
): RegionFeature | undefined {
  return geojson.features.find(
    (f) => f.properties.regionId === regionId,
  ) as RegionFeature | undefined;
}

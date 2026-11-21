/**
 * Self-hosted basemap shared by every Leaflet map in the app — no external tiles.
 *
 * Third-party tiles always print text we can't control: Esri "Light Gray Base" bakes in English
 * country/sea names (THAILAND, Gulf of Tonkin, a second "VIETNAM"), OSM prints foreign names on
 * Hoàng Sa / Trường Sa, and CARTO's label-free tiles now need an API key. So the map is drawn from
 * our own GeoJSON: neighbouring land (public/data/neighbors.geojson, from Natural Earth 50m, public
 * domain, with nothing kept in the Hoàng Sa / Trường Sa areas) under Việt Nam's own boundary data.
 * Every place name is drawn by the app in Vietnamese.
 */
import type { GeoJsonObject } from "geojson";
import type { LayerGroup, Map as LeafletMapInstance } from "leaflet";

export const NEIGHBORS_GEOJSON_URL = "/data/neighbors.geojson";
export const VIETNAM_ADM0_GEOJSON_URL = "/data/vietnam-adm0.geojson";

/** Sea colour = map container background (set in CSS via `.historical-leaflet-map`, and inline below). */
export const MAP_SEA_COLOR = "#DAD9D3";

export const NEIGHBOR_LAND_STYLE = {
  color: "#111111",
  weight: 0.6,
  opacity: 0.22,
  fillColor: "#E9E6DE",
  fillOpacity: 1,
};

export const VIETNAM_LAND_STYLE = {
  color: "#B8321F",
  weight: 3,
  opacity: 0.95,
  fillColor: "#F5F2EA",
  fillOpacity: 1,
};

export const BASEMAP_ATTRIBUTION = "Dữ liệu nền: Natural Earth";

export async function fetchGeoJson(url: string): Promise<GeoJsonObject> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${url}`);
  return response.json() as Promise<GeoJsonObject>;
}

/** Neighbouring land + Việt Nam outline, for small maps that don't draw their own Việt Nam layer. */
export async function addSimpleBasemap(
  L: typeof import("leaflet"),
  target: LeafletMapInstance | LayerGroup,
): Promise<void> {
  const [neighbors, vietnam] = await Promise.all([
    fetchGeoJson(NEIGHBORS_GEOJSON_URL),
    fetchGeoJson(VIETNAM_ADM0_GEOJSON_URL),
  ]);
  L.geoJSON(neighbors, { interactive: false, style: NEIGHBOR_LAND_STYLE, attribution: BASEMAP_ATTRIBUTION }).addTo(target);
  L.geoJSON(vietnam, { interactive: false, style: { ...VIETNAM_LAND_STYLE, weight: 2 } }).addTo(target);
}

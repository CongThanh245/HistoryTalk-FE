"use client";

// components/historical-map/LeafletMap.tsx
// Leaflet map shell and the API-backed map pin layer.

import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import "./historical-map.css";
import type {
  DivIcon,
  LayerGroup,
  LatLngExpression,
  Map as LeafletMapInstance,
  Marker,
} from "leaflet";
import type { GeoJsonObject } from "geojson";
import type { MapPin } from "@/services/map-pin.service";
import type { HistoricalEvent } from "@/services/event.service";
import { cn } from "@/lib/utils/cn";

interface LeafletMapProps {
  battle?: HistoricalEvent;
  battles?: HistoricalEvent[];
  isAdding?: boolean;
  pins: MapPin[];
  draftCoordinates?: { latitude: number; longitude: number } | null;
  selectedPinId: string | null;
  panelDismissed?: boolean;
  onSelectPin: (pin: MapPin) => void;
  onMapClick?: (coordinates: { latitude: number; longitude: number }) => void;
}

const VIETNAM_BOUNDS = {
  southWest: [5.7, 97.4] as [number, number],
  northEast: [24.6, 117.2] as [number, number],
};

const VIETNAM_INITIAL_VIEW = {
  center: [15.65, 108.45] as [number, number],
  zoom: 6.25,
};

const HOANG_SA_ISLANDS: LatLngExpression[] = [
  [16.83, 112.34],
  [16.58, 111.72],
  [16.44, 112.72],
  [15.92, 111.95],
  [15.76, 112.55],
  [16.18, 113.05],
];

const TRUONG_SA_ISLANDS: LatLngExpression[] = [
  [11.45, 114.35],
  [10.88, 114.9],
  [10.35, 113.75],
  [9.78, 114.42],
  [9.2, 113.2],
  [8.65, 114.05],
  [8.95, 112.62],
  [10.02, 115.32],
];

export function LeafletMap({
  battle,
  battles,
  isAdding = false,
  pins,
  draftCoordinates,
  selectedPinId,
  panelDismissed = false,
  onSelectPin,
  onMapClick,
}: LeafletMapProps) {
  const mapRef = useRef<LeafletMapInstance | null>(null);
  const markersRef = useRef<Record<string, Marker>>({});
  const containerRef = useRef<(HTMLDivElement & { _leaflet_id?: number }) | null>(
    null,
  );
  const [mapReady, setMapReady] = React.useState(false);

  useEffect(() => {
    if (!mapReady || !containerRef.current || !mapRef.current) return;
    const observer = new ResizeObserver(() => mapRef.current?.invalidateSize());
    observer.observe(containerRef.current);
    mapRef.current.invalidateSize();
    return () => observer.disconnect();
  }, [mapReady]);

  // Stable ref for callback (avoid re-binding on every render)
  const onSelectPinRef = useRef(onSelectPin);
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onSelectPinRef.current = onSelectPin;
    onMapClickRef.current = onMapClick;
  });

  // ── Init map ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!containerRef.current) return;
    if (mapRef.current) return;
    let cancelled = false;

    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      if (containerRef.current._leaflet_id) return;

      import("leaflet").then((L) => {
        if (cancelled || !containerRef.current) return;
        if (containerRef.current._leaflet_id) return;

        delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })
          ._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const vietnamBounds = L.latLngBounds(
          L.latLng(...VIETNAM_BOUNDS.southWest),
          L.latLng(...VIETNAM_BOUNDS.northEast),
        );

        const map = L.map(containerRef.current!, {
          center: VIETNAM_INITIAL_VIEW.center,
          zoom: VIETNAM_INITIAL_VIEW.zoom,
          zoomSnap: 0.25,
          zoomDelta: 0.5,
          minZoom: 5.5,
          maxZoom: 11,
          maxBounds: vietnamBounds,
          maxBoundsViscosity: 1.0,
          bounceAtZoomLimits: false,
          inertia: false,
          zoomControl: true,
          attributionControl: false,
          preferCanvas: true,
        });

        // maxBounds already enforces the boundary with Leaflet's re-entry guard.
        map.zoomControl.setPosition("bottomright");
        map.on("click", (event) => {
          onMapClickRef.current?.({
            latitude: event.latlng.lat,
            longitude: event.latlng.lng,
          });
        });

        // Scale markers based on zoom level using CSS variable (safe — doesn't touch Leaflet's transform)
        const updateMarkerScale = () => {
          const z = map.getZoom();
          // zoom 6.25 = scale ~0.65, zoom 9 = scale 1.0
          const scale = Math.max(0.4, Math.min(1.4, (z - 4) / (9 - 4)));
          const container = containerRef.current;
          if (container) {
            container.style.setProperty("--marker-scale", String(scale));
          }
        };
        map.on("zoom", updateMarkerScale);
        map.on("zoomend", updateMarkerScale);
        // Apply initial scale immediately
        updateMarkerScale();


        mapRef.current = map;
        setMapReady(true);
        void drawVietnamBasemap(L, map).catch((error) => {
          console.error("Could not load Vietnam map overlays", error);
        });
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = {};
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !draftCoordinates) return;
    const map = mapRef.current;
    let cancelled = false;
    let preview: LayerGroup | undefined;

    import("leaflet").then((L) => {
      if (cancelled) return;
      const position: LatLngExpression = [draftCoordinates.latitude, draftCoordinates.longitude];
      preview = L.layerGroup().addTo(map);
      L.circleMarker(position, {
        radius: 18,
        color: "#ffffff",
        weight: 2,
        fillColor: "#00796b",
        fillOpacity: 0.2,
        interactive: false,
        pane: "markerPane",
      }).addTo(preview);
      L.circleMarker(position, {
        radius: 8,
        color: "#ffffff",
        weight: 3,
        fillColor: "#00796b",
        fillOpacity: 1,
        interactive: false,
        pane: "markerPane",
      }).bindTooltip("Vị trí ghim · Chưa lưu", {
        permanent: true,
        direction: "top",
        offset: [0, -20],
        opacity: 1,
      }).addTo(preview);
    });

    return () => {
      cancelled = true;
      preview?.remove();
    };
  }, [draftCoordinates, mapReady]);

  // Sync API pins whenever the selected context or year changes.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map) return;

      const currentIds = new Set(pins.map((pin) => pin.pinId));

      // Fade out + remove markers no longer in list
      Object.keys(markersRef.current).forEach((id) => {
        if (!currentIds.has(id)) {
          const marker = markersRef.current[id];
          fadeOutAndRemove(marker, map);
          delete markersRef.current[id];
        }
      });

      // Add new markers / update existing
      pins.forEach((pin) => {
        const pinBattle = battles?.find((item) => item.id === pin.contextId) ?? battle;
        const isSelected = pin.pinId === selectedPinId;
        const icon = createCustomIcon(L, pin, isSelected, pinBattle);

        if (markersRef.current[pin.pinId]) {
          const marker = markersRef.current[pin.pinId];
          marker.setIcon(icon).setLatLng([pin.latitude, pin.longitude]);
          marker.setTooltipContent(createBattlePreview(pin, pinBattle));
          marker.off("click").on("click", () => onSelectPinRef.current(pin));
          marker.getElement()?.setAttribute("aria-label", pinBattle?.title ?? pin.label);
        } else {
          addMarker(L, map, pin, isSelected, markersRef, onSelectPinRef, pinBattle);
        }
      });
    });
  }, [pins, selectedPinId, mapReady, battle, battles]);

  const targetPin = pins.find((item) => item.pinId === selectedPinId);
  const targetLatitude = targetPin?.latitude;
  const targetLongitude = targetPin?.longitude;

  // One camera effect prevents overview and selection animations competing.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || isAdding) return;
    const frame = requestAnimationFrame(() => {
      map.stop();
      map.invalidateSize({ pan: false });
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!panelDismissed && typeof targetLatitude === "number" && Number.isFinite(targetLatitude) && typeof targetLongitude === "number" && Number.isFinite(targetLongitude)) {
        map.flyTo([targetLatitude, targetLongitude], 9, { duration: 1.2, animate: !reducedMotion });
      } else {
        map.flyTo(VIETNAM_INITIAL_VIEW.center, VIETNAM_INITIAL_VIEW.zoom, { duration: 1.2, animate: !reducedMotion });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedPinId, targetLatitude, targetLongitude, panelDismissed, mapReady, isAdding]);

  return (
    <>
      <div className="relative w-full h-full historical-map-shell">
        <div
          ref={containerRef}
          className={cn(
            "w-full h-full historical-leaflet-map",
            isAdding && "cursor-crosshair",
          )}
          aria-label="Bản đồ tương tác Việt Nam"
        />
        <div className="historical-map-compass" aria-hidden="true">
          <span className="historical-map-compass-n">N</span>
          <span className="historical-map-compass-line" />
          <span className="historical-map-compass-dot" />
        </div>
        <div className="historical-map-scale" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

    </>
  );
}

// ── Helpers ────────────────────────────────────────────────

async function drawVietnamBasemap(
  L: typeof import("leaflet"),
  map: LeafletMapInstance,
): Promise<LayerGroup> {
  const layer = L.layerGroup().addTo(map);

  L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  ).addTo(map);

  const [vietnamGeoJson, provinceGeoJson] = await Promise.all([
    fetch("/data/vietnam-adm0.geojson").then((response) => {
      if (!response.ok) {
        throw new Error("Unable to load Vietnam boundary GeoJSON");
      }
      return response.json() as Promise<GeoJsonObject>;
    }),
    fetch("/data/vietnam-adm1.geojson").then((response) => {
      if (!response.ok) {
        throw new Error("Unable to load Vietnam province GeoJSON");
      }
      return response.json() as Promise<GeoJsonObject>;
    }),
  ]);

  L.geoJSON(vietnamGeoJson, {
    interactive: false,
    style: {
      color: "#8f2f22",
      weight: 3,
      opacity: 0.95,
      fillColor: "#c6863f",
      fillOpacity: 0.42,
    },
  }).addTo(layer);

  const provinceLabelLayer = L.layerGroup().addTo(layer);
  L.geoJSON(provinceGeoJson, {
    interactive: false,
    style: {
      color: "#74391f",
      weight: 0.8,
      opacity: 0.5,
      fillOpacity: 0,
    },
    onEachFeature: (feature, featureLayer) => {
      const provinceName = getProvinceName(feature.properties);
      const boundsLayer = featureLayer as typeof featureLayer & {
        getBounds?: () => { getCenter: () => LatLngExpression };
      };
      const center = boundsLayer.getBounds?.().getCenter();

      if (!provinceName || !center) return;
      L.marker(center, {
        interactive: false,
        icon: L.divIcon({
          className: "historical-province-label-wrapper",
          html: `<div class="historical-province-label">${provinceName}</div>`,
          iconSize: [92, 28],
          iconAnchor: [46, 14],
        }),
      }).addTo(provinceLabelLayer);
    },
  }).addTo(layer);

  updateProvinceLabelVisibility(map);
  map.on("zoomend", () => updateProvinceLabelVisibility(map));

  addSeaTexture(L, layer);

  L.polyline(
    [
      [16.2, 108.2],
      [16.45, 110.0],
      [16.55, 111.6],
      [16.35, 112.45],
    ],
    {
      color: "#6a3f1c",
      dashArray: "6 8",
      opacity: 0.42,
      weight: 1.4,
      interactive: false,
    },
  ).addTo(layer);

  L.polyline(
    [
      [11.0, 109.0],
      [10.45, 111.4],
      [10.05, 113.0],
      [9.65, 114.35],
    ],
    {
      color: "#6a3f1c",
      dashArray: "6 8",
      opacity: 0.42,
      weight: 1.4,
      interactive: false,
    },
  ).addTo(layer);

  addIslandCluster(L, layer, HOANG_SA_ISLANDS);
  addIslandCluster(L, layer, TRUONG_SA_ISLANDS);

  addMapLabel(L, layer, [16.6, 106.4], "Việt Nam", "country");
  addMapLabel(L, layer, [21.1, 105.7], "Bắc Bộ", "region");
  addMapLabel(L, layer, [16.2, 107.7], "Trung Bộ", "region");
  addMapLabel(L, layer, [10.4, 106.1], "Nam Bộ", "region");
  addMapLabel(L, layer, [17.05, 112.95], "Hoàng Sa");
  addMapLabel(L, layer, [10.85, 114.75], "Trường Sa");
  addMapLabel(L, layer, [13.5, 112.1], "Biển Đông", "sea");

  return layer;
}

function addSeaTexture(L: typeof import("leaflet"), layer: LayerGroup) {
  const lineStyle = {
    color: "#6a3f1c",
    opacity: 0.15,
    weight: 1,
    interactive: false,
  };

  [
    [
      [21.0, 109.6],
      [18.4, 110.8],
      [15.7, 111.4],
      [12.8, 111.0],
      [9.8, 110.0],
    ],
    [
      [20.4, 111.6],
      [17.6, 112.7],
      [14.8, 113.1],
      [11.8, 112.5],
      [8.9, 111.5],
    ],
    [
      [18.8, 113.8],
      [16.3, 114.5],
      [13.5, 114.8],
      [10.6, 114.1],
      [8.2, 113.2],
    ],
  ].forEach((points) => {
    L.polyline(points as LatLngExpression[], lineStyle).addTo(layer);
  });

  [
    { center: [18.2, 111.6] as LatLngExpression, radius: 260000 },
    { center: [13.2, 113.1] as LatLngExpression, radius: 340000 },
    { center: [9.7, 114.1] as LatLngExpression, radius: 220000 },
  ].forEach(({ center, radius }) => {
    L.circle(center, {
      radius,
      color: "#6a3f1c",
      opacity: 0.12,
      weight: 1,
      fill: false,
      interactive: false,
    }).addTo(layer);
  });
}

function updateProvinceLabelVisibility(map: LeafletMapInstance) {
  map
    .getContainer()
    .classList.toggle("show-province-labels", map.getZoom() >= 6.15);
}

function getProvinceName(properties: unknown) {
  if (!properties || typeof properties !== "object") return "";
  const value = (properties as Record<string, unknown>).shapeName;
  return typeof value === "string" ? escapeHtml(value) : "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addIslandCluster(
  L: typeof import("leaflet"),
  layer: LayerGroup,
  points: LatLngExpression[],
) {
  points.forEach((point) => {
    L.circleMarker(point, {
      radius: 4,
      color: "#5d3517",
      weight: 1.4,
      fillColor: "#c4934c",
      fillOpacity: 0.92,
      className: "historical-island-dot",
      interactive: false,
    }).addTo(layer);
  });
}

function addMapLabel(
  L: typeof import("leaflet"),
  layer: LayerGroup,
  position: LatLngExpression,
  label: string,
  variant?: "country" | "region" | "sea",
) {
  const variantClass =
    variant === "country"
      ? "historical-map-label--country"
      : variant === "region"
        ? "historical-map-region-label"
        : variant === "sea"
          ? "historical-map-sea-label"
          : "";

  L.marker(position, {
    interactive: false,
    icon: L.divIcon({
      className: "historical-map-label-wrapper",
      html: `<div class="historical-map-label ${variantClass}">${label}</div>`,
      iconSize: [120, 28],
      iconAnchor: [60, 14],
    }),
  }).addTo(layer);
}

function createCustomIcon(
  L: typeof import("leaflet"),
  pin: MapPin,
  isSelected: boolean,
  battle?: HistoricalEvent,
): DivIcon {
  const title = battle?.title || pin.label;
  const year = battle?.year ?? pin.pinYear;
  return L.divIcon({
    html: `<div class="battle-pin ${isSelected ? "battle-pin--selected" : ""}">
      <div class="battle-pin-photo"><img src="${escapeHtml(battle?.imageUrl || "/war.jpg")}" alt="" /></div>
      <span class="battle-pin-year">${year < 0 ? `${Math.abs(year)} TCN` : year}</span>
      <span class="battle-pin-name">${escapeHtml(title)}</span>
    </div>`,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
    className: "landmark-marker",
  });
}

function createBattlePreview(pin: MapPin, battle?: HistoricalEvent) {
  const preview = document.createElement("div");
  preview.className = "battle-preview-content";
  const image = document.createElement("img");
  image.className = "battle-preview-image";
  image.src = battle?.imageUrl || "/war.jpg";
  image.alt = "";
  image.addEventListener("error", () => { image.src = "/war.jpg"; }, { once: true });
  const copy = document.createElement("div");
  copy.className = "battle-preview-copy";
  const title = document.createElement("strong");
  title.className = "battle-preview-heading";
  title.textContent = battle?.title || pin.label;
  const meta = document.createElement("div");
  meta.className = "battle-preview-meta";
  const year = battle?.year ?? pin.pinYear;
  meta.textContent = [year < 0 ? `${Math.abs(year)} TCN` : String(year), battle?.location].filter(Boolean).join(" · ");
  const summary = document.createElement("p");
  summary.className = "battle-preview-summary";
  summary.textContent = battle?.summary || pin.description || "";
  copy.append(title, meta, summary);
  preview.append(image, copy);
  return preview;
}

function addMarker(
  L: typeof import("leaflet"),
  map: LeafletMapInstance,
  pin: MapPin,
  isSelected: boolean,
  markersRef: React.MutableRefObject<Record<string, Marker>>,
  onSelectRef: React.MutableRefObject<(pin: MapPin) => void>,
  battle?: HistoricalEvent,
) {
  const icon = createCustomIcon(L, pin, isSelected, battle);
  const marker = L.marker([pin.latitude, pin.longitude], {
    icon,
    zIndexOffset: 1000,
    bubblingMouseEvents: false,
    alt: battle?.title || pin.label,
  });

  marker.on("click", () => {
    onSelectRef.current(pin);
  });

  marker.bindTooltip(
    createBattlePreview(pin, battle),
    { direction: "top", offset: [0, -34], className: "battle-preview", opacity: 1 },
  );

  marker.addTo(map);
  markersRef.current[pin.pinId] = marker;
}

function fadeOutAndRemove(marker: Marker, map: LeafletMapInstance) {
  const el: HTMLElement | undefined = marker.getElement?.();
  if (el) {
    el.style.transition = "opacity 250ms ease, transform 250ms ease";
    el.style.opacity = "0";
    el.style.transform = `${el.style.transform} translateY(-8px)`;
    setTimeout(() => {
      try {
        map.removeLayer(marker);
      } catch {}
    }, 260);
  } else {
    try {
      map.removeLayer(marker);
    } catch {}
  }
}


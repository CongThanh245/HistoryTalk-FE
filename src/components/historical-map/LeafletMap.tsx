"use client";

// components/historical-map/LeafletMap.tsx
// Leaflet map shell and the API-backed map pin layer.

import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type {
  DivIcon,
  LayerGroup,
  LatLngExpression,
  Map as LeafletMapInstance,
  Marker,
} from "leaflet";
import type { GeoJsonObject } from "geojson";
import type { MapPin } from "@/services/map-pin.service";
import { cn } from "@/lib/utils/cn";

interface LeafletMapProps {
  pins: MapPin[];
  selectedPinId: string | null;
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
  pins,
  selectedPinId,
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

        map.setView(VIETNAM_INITIAL_VIEW.center, VIETNAM_INITIAL_VIEW.zoom);
        map.on("drag", () => {
          map.panInsideBounds(vietnamBounds, { animate: false });
        });
        map.on("moveend", () => {
          map.panInsideBounds(vietnamBounds, { animate: true });
        });
        map.on("click", (event) => {
          onMapClickRef.current?.({
            latitude: event.latlng.lat,
            longitude: event.latlng.lng,
          });
        });

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
        const isSelected = pin.pinId === selectedPinId;
        const icon = createCustomIcon(L, pin, isSelected);

        if (markersRef.current[pin.pinId]) {
          markersRef.current[pin.pinId].setIcon(icon);
        } else {
          addMarker(L, map, pin, isSelected, markersRef, onSelectPinRef);
        }
      });
    });
  }, [pins, selectedPinId, mapReady]);

  // ── Fly to selected landmark ──────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !selectedPinId) return;
    const pin = pins.find((item) => item.pinId === selectedPinId);
    if (pin) {
      mapRef.current.flyTo([pin.latitude, pin.longitude], 9, { duration: 1 });
    }
  }, [selectedPinId, pins]);

  return (
    <>
      <div className="relative w-full h-full historical-map-shell">
        <div
          ref={containerRef}
          className={cn(
            "w-full h-full historical-leaflet-map",
            onMapClick && "cursor-crosshair",
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
      <style>{`
        .historical-map-shell {
          background:
            radial-gradient(circle at 46% 36%, rgba(246, 233, 198, 0.72), transparent 34%),
            linear-gradient(135deg, #8fa8a6 0%, #cbd2bd 38%, #d3bc82 100%);
          overflow: hidden;
        }
        .historical-map-shell::before {
          content: "";
          position: absolute;
          inset: 18px;
          z-index: 460;
          pointer-events: none;
          border: 1px solid rgba(83, 52, 24, 0.28);
          box-shadow:
            inset 0 0 0 1px rgba(255, 239, 196, 0.28),
            inset 0 0 72px rgba(66, 39, 16, 0.2);
        }
        .historical-map-shell::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 461;
          pointer-events: none;
          background:
            radial-gradient(circle at 50% 42%, transparent 0 48%, rgba(52, 31, 13, 0.2) 100%),
            linear-gradient(rgba(78, 49, 23, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(78, 49, 23, 0.04) 1px, transparent 1px);
          background-size: auto, 72px 72px, 72px 72px;
          mix-blend-mode: multiply;
        }
        .historical-leaflet-map {
          background:
            radial-gradient(circle at 42% 32%, rgba(255, 244, 207, 0.75), transparent 31%),
            radial-gradient(circle at 66% 70%, rgba(112, 151, 147, 0.32), transparent 34%),
            linear-gradient(145deg, #9db8a7 0%, #d7d0aa 52%, #c6a96f 100%);
        }
        .historical-leaflet-map .leaflet-container {
          background: transparent;
          font-family: inherit;
        }
        .historical-leaflet-map .leaflet-tile-pane {
          filter: sepia(0.26) saturate(0.68) contrast(0.94) brightness(1.02);
          opacity: 0.72;
        }
        .historical-leaflet-map .leaflet-control-zoom {
          border: 1px solid rgba(76, 44, 18, 0.28) !important;
          border-radius: 6px !important;
          box-shadow: 0 8px 20px rgba(72, 42, 16, 0.18) !important;
        }
        .historical-leaflet-map .leaflet-control-zoom a {
          background: rgba(250, 231, 184, 0.95) !important;
          color: #4f2f15 !important;
          border-bottom-color: rgba(76, 44, 18, 0.2) !important;
        }
        .historical-leaflet-map .leaflet-control-zoom a:hover {
          background: #f6dda7 !important;
        }
        .historical-map-label {
          color: #563114;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
          text-shadow:
            0 1px 0 rgba(255, 236, 184, 0.85),
            0 3px 10px rgba(68, 38, 14, 0.16);
          white-space: nowrap;
        }
        .historical-map-label--country {
          font-size: 18px;
          letter-spacing: 0;
        }
        .historical-island-dot {
          filter: drop-shadow(0 3px 5px rgba(71, 42, 16, 0.22));
        }
        .historical-map-sea-label {
          color: rgba(67, 56, 34, 0.52);
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0;
          white-space: nowrap;
          text-shadow: 0 1px 0 rgba(251, 237, 194, 0.72);
        }
        .historical-map-region-label {
          color: rgba(79, 47, 21, 0.46);
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0;
          white-space: nowrap;
          text-shadow: 0 1px 0 rgba(251, 237, 194, 0.72);
        }
        .historical-province-label {
          color: rgba(58, 38, 20, 0.76);
          font-family: inherit;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0;
          line-height: 1.05;
          max-width: 92px;
          text-align: center;
          text-shadow:
            0 1px 0 rgba(255, 242, 204, 0.95),
            0 -1px 0 rgba(255, 242, 204, 0.72),
            1px 0 0 rgba(255, 242, 204, 0.72),
            -1px 0 0 rgba(255, 242, 204, 0.72);
          white-space: normal;
        }
        .historical-province-label-wrapper {
          opacity: 0;
          transition: opacity 180ms ease;
        }
        .historical-leaflet-map.show-province-labels .historical-province-label-wrapper {
          opacity: 1;
        }
        .historical-map-compass {
          position: absolute;
          right: 28px;
          top: 28px;
          z-index: 470;
          width: 54px;
          height: 72px;
          color: #513019;
          opacity: 0.76;
          pointer-events: none;
        }
        .historical-map-compass-n {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          font-weight: 800;
        }
        .historical-map-compass-line {
          position: absolute;
          left: 50%;
          top: 18px;
          width: 1px;
          height: 48px;
          background: linear-gradient(#513019, rgba(81, 48, 25, 0.12));
          transform: translateX(-50%);
        }
        .historical-map-compass-line::before,
        .historical-map-compass-line::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 15px;
          width: 1px;
          height: 28px;
          background: rgba(81, 48, 25, 0.55);
          transform-origin: top;
        }
        .historical-map-compass-line::before {
          transform: rotate(48deg);
        }
        .historical-map-compass-line::after {
          transform: rotate(-48deg);
        }
        .historical-map-compass-dot {
          position: absolute;
          left: 50%;
          top: 39px;
          width: 8px;
          height: 8px;
          border: 1px solid rgba(81, 48, 25, 0.55);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: rgba(248, 224, 168, 0.62);
        }
        .historical-map-scale {
          position: absolute;
          left: 32px;
          bottom: 30px;
          z-index: 470;
          display: flex;
          width: 112px;
          height: 14px;
          border-bottom: 2px solid rgba(81, 48, 25, 0.62);
          pointer-events: none;
          opacity: 0.72;
        }
        .historical-map-scale span {
          flex: 1;
          border-left: 2px solid rgba(81, 48, 25, 0.62);
        }
        .historical-map-scale span:last-child {
          border-right: 2px solid rgba(81, 48, 25, 0.62);
        }
        /* Fade-in animation for new markers */
        .leaflet-marker-icon.landmark-marker { transition: opacity 180ms ease-out; }
      `}</style>
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
): DivIcon {
  const isPersonal = pin.pinOwnerType === "USER";
  const isEnemy = pin.pinType === "ENEMY_FORCE";
  const color = isPersonal ? "#2563a6" : isEnemy ? "#9f2f2f" : "#316a48";
  const symbol = isPersonal ? "●" : isEnemy ? "E" : "A";
  const size = isSelected ? 42 : 34;
  const borderColor = isSelected ? "#fff4cf" : "#4f2f15";
  const shadow = isSelected
    ? `0 7px 20px ${color}66, 0 0 0 5px rgba(255, 244, 207, 0.38)`
    : "0 4px 10px rgba(67,38,16,0.32)";

  const html = `
    <div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2.5px solid ${borderColor};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
      transition:all 0.2s;
      outline:1px solid rgba(255,255,255,0.35);
    ">
      <span style="transform:rotate(45deg);font-size:${isSelected ? 14 : 12}px;line-height:1;color:white;font-weight:900;">
        ${symbol}
      </span>
    </div>
    ${
      isSelected
        ? `<div style="
      position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);
      background:#4c2c12;color:#f8dfaa;
      font-size:10px;font-weight:600;white-space:nowrap;
      padding:3px 7px;border-radius:3px;
      border:1px solid rgba(248,223,170,0.35);
      font-family:inherit;
      box-shadow:0 6px 14px rgba(67,38,16,0.22);
    ">${escapeHtml(pin.label)}</div>`
        : ""
    }
  `;

  return L.divIcon({
    html: `<div style="position:relative;">${html}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    className: "landmark-marker",
  });
}

function addMarker(
  L: typeof import("leaflet"),
  map: LeafletMapInstance,
  pin: MapPin,
  isSelected: boolean,
  markersRef: React.MutableRefObject<Record<string, Marker>>,
  onSelectRef: React.MutableRefObject<(pin: MapPin) => void>,
) {
  const icon = createCustomIcon(L, pin, isSelected);
  const marker = L.marker([pin.latitude, pin.longitude], {
    icon,
    zIndexOffset: 1000,
  });

  marker.on("click", () => {
    onSelectRef.current(pin);
  });

  marker.bindTooltip(
    `<div style="font-family:inherit;font-size:12px;font-weight:700;color:#4c2c12;padding:5px 9px;">
      ${escapeHtml(pin.label)}
    </div>`,
    { direction: "top", offset: [0, -36], className: "leaflet-tooltip-custom" },
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

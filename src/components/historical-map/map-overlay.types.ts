import type { ReactNode } from "react";

export type MapCoordinates = { latitude: number; longitude: number };

/** Look of an overlay marker; each maps to a `.map-overlay-pin--<variant>` class in historical-map.css. */
export type OverlayPinVariant = "class" | "assignment" | "local" | "personal";

/** A marker drawn above the battle map by a custom layer (class map, personal notes…). */
export interface OverlayPin {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  variant: OverlayPinVariant;
  /** Extra line in the hover tooltip (year, due date…). */
  meta?: string;
  /** Marks a past-due assignment pin. */
  muted?: boolean;
}

/**
 * Optional custom layers rendered on top of the global battle map. Everything is opt-in, so the
 * battle map behaves exactly as before when no overlay is given.
 */
export interface MapOverlay {
  pins: OverlayPin[];
  selectedId?: string | null;
  onSelectPin?: (id: string) => void;
  /** Placement mode: map clicks go to `onMapClick` instead of deselecting the battle. */
  placing?: boolean;
  /** Unsaved overlay position shown with the draft marker. */
  draft?: MapCoordinates | null;
  /** Every map click (placement or background click). */
  onMapClick?: (coordinates: MapCoordinates) => void;
  /** Called first on Escape while the map screen is shown; return true when handled. */
  onEscape?: () => boolean;
  /** Camera target; a new `key` re-centres the map on it. */
  focus?: (MapCoordinates & { key: string }) | null;
  /** Hide the battle pins (the global layer is unticked). */
  hideBattlePins?: boolean;
  /** Floating controls inside the map area (layer control, detail panel…). */
  renderControls?: (info: { battleCount: number }) => ReactNode;
  /** Extra content in the map header (e.g. a scope indicator). */
  headerSlot?: ReactNode;
  /** Slim bar between the header and the map (e.g. the mock-data notice). */
  topSlot?: ReactNode;
}

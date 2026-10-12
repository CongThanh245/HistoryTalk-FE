import type { ReactNode } from "react";

export type MapCoordinates = { latitude: number; longitude: number };

/** The map's pannable area (Leaflet `maxBounds`); overlay pins must sit inside it. */
export const MAP_BOUNDS = {
  south: 5.7,
  west: 97.4,
  north: 24.6,
  east: 117.2,
} as const;

export const isInsideMapBounds = (c: MapCoordinates) =>
  Number.isFinite(c.latitude) &&
  Number.isFinite(c.longitude) &&
  c.latitude >= MAP_BOUNDS.south &&
  c.latitude <= MAP_BOUNDS.north &&
  c.longitude >= MAP_BOUNDS.west &&
  c.longitude <= MAP_BOUNDS.east;

/** Look of an overlay marker; each maps to a `.map-overlay-pin--<variant>` class in historical-map.css. */
export type OverlayPinVariant = "class" | "assignment" | "local" | "personal";

/** Colour override of a marker (personal notes); maps to `.map-overlay-pin--tone-<tone>`. */
export type OverlayPinTone = "jade" | "crimson" | "gold" | "men-lam" | "ink";

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
  /** Small corner badge (due countdown "2N", "!" overdue, "✓" handed in). */
  badge?: { text: string; tone: "soon" | "overdue" | "done" };
  tone?: OverlayPinTone;
}

/** One battle of the global layer, summarised for the search box and the admin overview list. */
export interface BattleOverviewItem {
  id: string;
  title: string;
  year: number;
  location?: string;
  /** Position of the admin pin; missing = not pinned on the map yet. */
  coordinates: MapCoordinates | null;
  /** Narration exists (phase narration or the legacy pin description). */
  hasNarration: boolean;
  /** A lược đồ with symbols or an image exists. */
  hasBattleMap: boolean;
}

/** One of the viewer's own study notes (USER map pin), anchored to a battle and its year. */
export interface StudyNoteSummary {
  pinId: string;
  contextId: string;
  label: string;
  note?: string | null;
  battleTitle: string;
  year: number;
  latitude: number;
  longitude: number;
}

export interface MapControlsInfo {
  /** Battle pins currently drawn. */
  battleCount: number;
  /** Battles the viewer may select (admins: all; learners: pinned only). */
  battles: BattleOverviewItem[];
  battlesLoading: boolean;
  battlesError: boolean;
  retryBattles: () => void;
  selectedBattleId: string | null;
  /** Selects a battle (opens its side panel and flies to it). */
  selectBattle: (id: string) => void;
  /** The viewer may keep study notes on battles (CUSTOMER, SCHOOL_STUDENT, TEACHER; not in admin preview). */
  canTakeNotes: boolean;
  /** The viewer's saved study notes across all battles (from the API). */
  studyNotes: StudyNoteSummary[];
  studyNotesLoading: boolean;
  selectedStudyNoteId: string | null;
  /** Selects the note's battle and opens the note in the side panel. */
  openStudyNote: (note: StudyNoteSummary) => void;
  /** Starts placing a new note on the selected battle; null when no battle is selected or a note is open. */
  addStudyNote: (() => void) | null;
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
  /** Hide the viewer's battle study notes (the "Ghi chú của tôi" layer is unticked). */
  hideStudyNotes?: boolean;
  /** Content Admin previews the map as a learner: no editing controls on the global layer. */
  previewAsLearner?: boolean;
  /** Floating controls inside the map area (layer control, detail panel…). */
  renderControls?: (info: MapControlsInfo) => ReactNode;
  /** Extra content in the map header (e.g. a scope indicator). */
  headerSlot?: ReactNode;
  /** Slim bar between the header and the map (e.g. the mock-data notice). */
  topSlot?: ReactNode;
}

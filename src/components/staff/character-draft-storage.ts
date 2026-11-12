import type { CharacterDraft } from "./staff-character-detail-view.types";

// Unsaved "create character" form, kept in this browser so a reload or closed tab does not lose it.
// Picked files (image/3D/video/PDF) cannot be stored and are not restored.
const PREFIX = "historytalk:character-draft:v1:";

const STRING_KEYS = [
  "name",
  "title",
  "background",
  "image",
  "modelUrl",
  "videoUrl",
  "personality",
  "voiceId",
  "selfPronoun",
  "addressPronoun",
  "bornYear",
  "bornMonth",
  "bornDay",
  "deathYear",
  "deathMonth",
  "deathDay",
  "documentTitle",
  "documentContent",
] as const satisfies readonly (keyof CharacterDraft)[];

const BOOLEAN_KEYS = ["isBornBc", "isDeathBc", "isActive", "isPublished"] as const satisfies readonly (keyof CharacterDraft)[];

export type StoredCharacterDraft = Partial<Pick<CharacterDraft, (typeof STRING_KEYS)[number] | (typeof BOOLEAN_KEYS)[number]>>;

export function characterDraftKey(uid: string | null | undefined): string | null {
  return uid ? `${PREFIX}${uid}` : null;
}

/** True when the user has typed anything worth keeping. */
export function hasCharacterDraftContent(draft: StoredCharacterDraft): boolean {
  return STRING_KEYS.some((k) => !!draft[k]?.trim());
}

export function loadCharacterDraft(key: string | null): StoredCharacterDraft | null {
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { draft?: Record<string, unknown> };
    if (!saved?.draft) return null;
    const out: StoredCharacterDraft = {};
    for (const k of STRING_KEYS) if (typeof saved.draft[k] === "string") out[k] = saved.draft[k] as string;
    for (const k of BOOLEAN_KEYS) if (typeof saved.draft[k] === "boolean") out[k] = saved.draft[k] as boolean;
    return hasCharacterDraftContent(out) ? out : null;
  } catch {
    return null;
  }
}

export function saveCharacterDraft(key: string | null, draft: CharacterDraft): void {
  if (!key) return;
  try {
    const out: StoredCharacterDraft = {};
    for (const k of STRING_KEYS) out[k] = draft[k] ?? "";
    for (const k of BOOLEAN_KEYS) out[k] = draft[k];
    if (hasCharacterDraftContent(out)) {
      window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), draft: out }));
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Storage full or blocked (private mode): the form still works, it just is not kept.
  }
}

export function clearCharacterDraft(key: string | null): void {
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

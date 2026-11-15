/**
 * Backgrounds and speakers of the story editor and player.
 * Stories themselves are stored on the historical context (see story-repo.ts).
 */
import type { StoryBackground, StoryCharacter } from "./types";

export const STORY_BACKGROUNDS: StoryBackground[] = [
  {
    id: "river-dawn",
    name: "Sông lúc bình minh",
    css: "linear-gradient(180deg,#F7C98B 0%,#E58B5A 34%,#9B5A4A 50%,#2F4A5C 64%,#14232E 100%)",
  },
  {
    id: "river-night",
    name: "Sông về đêm",
    css: "radial-gradient(ellipse at 70% 20%,#3B5670 0%,transparent 45%),linear-gradient(180deg,#0E1824 0%,#1B2C3D 55%,#0A121A 100%)",
  },
  {
    id: "camp",
    name: "Doanh trại",
    css: "radial-gradient(ellipse at 50% 85%,#E0844A 0%,#7A3A1E 30%,transparent 62%),linear-gradient(180deg,#1E1612 0%,#3A2418 60%,#140E0B 100%)",
  },
  {
    id: "battle",
    name: "Trận chiến",
    css: "radial-gradient(ellipse at 30% 70%,#C2482F 0%,transparent 50%),radial-gradient(ellipse at 80% 30%,#5A2A1E 0%,transparent 55%),linear-gradient(180deg,#2A1410 0%,#16090A 100%)",
  },
  {
    id: "palace",
    name: "Cung điện",
    css: "radial-gradient(ellipse at 50% 30%,#E8C26A 0%,transparent 55%),linear-gradient(180deg,#7A1F12 0%,#4A120B 70%,#2A0A06 100%)",
  },
  {
    id: "scroll",
    name: "Giấy dó",
    css: "radial-gradient(ellipse at 50% 50%,#F5F2EA 0%,#E2DCCF 70%,#C9BFA8 100%)",
  },
  { id: "banner", name: "Ảnh: Anh hùng dân tộc", css: "url(/banner.png) center/cover no-repeat" },
  { id: "war", name: "Ảnh: Chiến trận", css: "url(/war.jpg) center/cover no-repeat" },
];

export const DEFAULT_BACKGROUND = "scroll";

// Speakers are the context's real characters (backend ids). They are kept in memory for the player and in
// localStorage for the editor, so a story still shows its speakers right after a reload.
const CHARACTERS_KEY = "historytalk:story-characters:v1";
const memory = new Map<string, StoryCharacter>();

function readStored(): StoryCharacter[] {
  if (typeof window === "undefined") return [];
  try {
    const list = JSON.parse(localStorage.getItem(CHARACTERS_KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function registerCharacters(characters: StoryCharacter[]) {
  for (const c of characters) memory.set(c.id, c);
  const byId = new Map(readStored().map((c) => [c.id, c]));
  for (const c of characters) byId.set(c.id, c);
  try {
    localStorage.setItem(CHARACTERS_KEY, JSON.stringify([...byId.values()]));
  } catch {
    // Storage full or blocked: the in-memory list still serves this page.
  }
}

/** Characters known to this page; `onlyIds` narrows to one context's cast. */
export function storyCharacters(onlyIds?: Iterable<string>): StoryCharacter[] {
  const byId = new Map(readStored().map((c) => [c.id, c]));
  for (const [id, c] of memory) byId.set(id, c);
  const all = [...byId.values()];
  if (!onlyIds) return all;
  const ids = new Set(onlyIds);
  return all.filter((c) => ids.has(c.id));
}

export function findCharacter(id: string | null | undefined) {
  if (!id) return null;
  return memory.get(id) ?? readStored().find((c) => c.id === id) ?? null;
}

export function findBackground(id: string | null | undefined) {
  return STORY_BACKGROUNDS.find((b) => b.id === id) ?? STORY_BACKGROUNDS.find((b) => b.id === DEFAULT_BACKGROUND)!;
}

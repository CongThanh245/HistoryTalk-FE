/**
 * Stories live on the historical context (`storyScript`, one per context).
 *
 * Until the backend stores that field, a PUT still succeeds (unknown fields are ignored) but the response has no
 * `storyScript`. We detect that and keep the story in this browser instead, so nothing is lost; the editor then
 * says so. Once the backend supports it, the next save moves the local copy to the server.
 */
import { characterService } from "@/services/character.service";
import { eventService, type HistoricalEvent } from "@/services/event.service";
import { registerCharacters } from "./story-assets";
import { docToScript, isStoryScript, newStoryDoc, scriptToDoc } from "./story-script";
import type { StoryCharacter, StoryDoc, StoryScript } from "./types";

export type StoryStorage = "server" | "local";

const LOCAL_PREFIX = "historytalk.story.";

function readLocal(contextId: string): StoryScript | null {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + contextId);
    const parsed = raw ? JSON.parse(raw) : null;
    return isStoryScript(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocal(contextId: string, script: StoryScript | null) {
  try {
    if (script) localStorage.setItem(LOCAL_PREFIX + contextId, JSON.stringify(script));
    else localStorage.removeItem(LOCAL_PREFIX + contextId);
  } catch {
    /* storage blocked: the story only lives in this tab */
  }
}

const ACCENTS = ["#B8321F", "#9A7426", "#3D6B63", "#2F4A5C", "#7A1F12", "#6F6A62"];

export function toStoryCharacter(c: { id: string; name: string; title?: string | null; imageUrl?: string | null }, i = 0): StoryCharacter {
  return { id: c.id, name: c.name, title: c.title ?? "", portraitUrl: c.imageUrl ?? null, accent: ACCENTS[i % ACCENTS.length] };
}

/** Load a context's characters into the speaker list (editor pickers and the player). */
export async function loadContextCharacters(contextId: string): Promise<StoryCharacter[]> {
  const list = await characterService.getByContext(contextId).catch(() => []);
  const characters = list.map((c, i) => toStoryCharacter(c, i));
  registerCharacters(characters);
  return characters;
}

const contextRef = (c: HistoricalEvent) => ({ id: c.id, name: c.title });

export type StoryEntry = {
  context: HistoricalEvent;
  script: StoryScript | null;
  storage: StoryStorage;
};

export const storyRepo = {
  /** Every context with its story (or none). */
  async list(): Promise<{ entries: StoryEntry[]; serverSupported: boolean }> {
    const res = await eventService.getAllClient({ page: 1, limit: 200 });
    const serverSupported = res.content.some((c) => c.storyScript !== undefined);
    const entries = res.content.map((context) => {
      const local = readLocal(context.id);
      const server = context.storyScript ?? null;
      // A local copy only wins while the server cannot store stories.
      if (!serverSupported && local) return { context, script: local, storage: "local" as const };
      return { context, script: server ?? local, storage: server ? ("server" as const) : local ? ("local" as const) : ("server" as const) };
    });
    return { entries, serverSupported };
  },

  /** The context's story, a local draft, or a new one. */
  async load(contextId: string): Promise<{ doc: StoryDoc; storage: StoryStorage; isNew: boolean; cast: string[] }> {
    const [context, characters] = await Promise.all([eventService.getById(contextId), loadContextCharacters(contextId)]);
    const supported = context.storyScript !== undefined;
    const local = readLocal(contextId);
    const script = (supported ? context.storyScript : null) ?? local;
    return {
      doc: script ? scriptToDoc(script, contextRef(context)) : newStoryDoc(contextRef(context)),
      storage: supported ? "server" : "local",
      isNew: !script,
      cast: characters.map((c) => c.id),
    };
  },

  async save(doc: StoryDoc): Promise<StoryStorage> {
    const script = docToScript(doc);
    const updated = await eventService.update(doc.contextId, { storyScript: script });
    if (updated.storyScript === undefined) {
      writeLocal(doc.contextId, script);
      return "local";
    }
    writeLocal(doc.contextId, null);
    return "server";
  },

  async remove(contextId: string) {
    writeLocal(contextId, null);
    await eventService.update(contextId, { storyScript: null });
  },
};

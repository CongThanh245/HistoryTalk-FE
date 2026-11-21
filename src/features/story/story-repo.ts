/**
 * Stories live on the historical context (`storyScript`, one per context).
 *
 * Until the backend stores that field, a PUT still succeeds (unknown fields are ignored) but the response has no
 * `storyScript`. We detect that and keep the story in this browser instead, so nothing is lost; the editor then
 * says so. Once the backend supports it, the next save moves the local copy to the server.
 */
import { ROUTES } from "@/constants/routes";
import { characterService } from "@/services/character.service";
import { eventService, type HistoricalEvent } from "@/services/event.service";
import { localContentService } from "@/services/local-content.service";
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

/** Where the story editor loads and saves a context's story: HistoryTalk's contexts, or a teacher's local ones. */
export type StoryRepo = {
  load(contextId: string): Promise<{ doc: StoryDoc; storage: StoryStorage; isNew: boolean; cast: string[] }>;
  save(doc: StoryDoc): Promise<StoryStorage>;
  /** Contexts the AI dialog may write from. */
  listContexts(): Promise<{ id: string; name: string }[]>;
  /** A context's characters (speakers). */
  listCharacters(contextId: string): Promise<StoryCharacter[]>;
  backHref: string;
  backLabel: string;
};

export const storyRepo = {
  backHref: ROUTES.STAFF.STORIES,
  backLabel: "Về danh sách kịch bản",

  async listContexts() {
    const res = await eventService.getAllClient({ page: 1, limit: 200 });
    return res.content.map(contextRef);
  },

  listCharacters: loadContextCharacters,

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

// Teachers' local contexts (B2B): the story is stored on the local context through the teacher API.

const LOCAL_LIST_SIZE = 100;

/** Local characters linked to a local context (mine + colleagues' school-wide ones). */
export async function loadLocalContextCharacters(contextId: string): Promise<StoryCharacter[]> {
  const page = await localContentService.list("CHARACTER", { page: 1, size: LOCAL_LIST_SIZE }).catch(() => null);
  const characters = (page?.items ?? [])
    .filter((c) => c.contextIds?.includes(contextId))
    .map((c, i) => toStoryCharacter({ id: c.id, name: c.name, title: c.title, imageUrl: c.imageUrl }, i));
  registerCharacters(characters);
  return characters;
}

export function localStoryRepo(contextId: string): StoryRepo {
  return {
    backHref: ROUTES.TEACHING.LOCAL_EDIT(contextId, "CONTEXT"),
    backLabel: "Về bối cảnh",

    async load(id) {
      const [context, characters] = await Promise.all([localContentService.get("CONTEXT", id), loadLocalContextCharacters(id)]);
      const ref = { id: context.id, name: context.name };
      const script = isStoryScript(context.storyScript) ? context.storyScript : null;
      return {
        doc: script ? scriptToDoc(script, ref) : newStoryDoc(ref),
        storage: "server",
        isNew: !script,
        cast: characters.map((c) => c.id),
      };
    },

    async save(doc) {
      await localContentService.updateContext(doc.contextId, { storyScript: docToScript(doc) });
      return "server";
    },

    async listContexts() {
      const page = await localContentService.list("CONTEXT", { page: 1, size: LOCAL_LIST_SIZE });
      return page.items.map((c) => ({ id: c.id, name: c.name }));
    },

    listCharacters: loadLocalContextCharacters,
  };
}


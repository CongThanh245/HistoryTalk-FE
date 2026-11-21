"use client";

/* eslint-disable @next/next/no-img-element -- portrait cut-outs of any size */
import { useMemo, useState } from "react";
import { Play, SkipForward } from "lucide-react";
import { findBackground, registerCharacters } from "@/features/story/story-assets";
import { toStoryCharacter } from "@/features/story/story-repo";
import type { StoryScript } from "@/features/story/types";
import { StoryPlayer } from "./story-player";

type CastMember = { id: string; name: string; title?: string | null; imageUrl?: string | null };

function firstBackground(script: StoryScript) {
  for (const n of script.nodes) if (n.data.kind === "line" && n.data.background) return n.data.background;
  return null;
}

/**
 * The learner's intro to a historical context when it has a published story: a cover with a start button
 * (a click also lets the browser voice play), then the visual-novel player. Replaces the intro video.
 */
export function ContextStoryIntro({
  script,
  contextTitle,
  characters,
  onFinish,
  onOpenChat,
  autoStart = false,
}: {
  script: StoryScript;
  contextTitle: string;
  /** The context's characters: names and portraits of the speakers. */
  characters: CastMember[];
  /** Skip, or the end screen's main button: go on to the characters. */
  onFinish: () => void;
  onOpenChat: (characterId: string) => void;
  /** Skip this cover and play at once (the learner already chose the story elsewhere). */
  autoStart?: boolean;
}) {
  const [started, setStarted] = useState(autoStart);

  const cast = useMemo(() => characters.map((c, i) => toStoryCharacter(c, i)), [characters]);
  // The player looks speakers up by id while rendering, so they are registered before it renders
  // (a plain call: idempotent, and not a hook result the compiler could drop).
  registerCharacters(cast);

  const narrator = cast.find((c) => c.id === script.narratorId) ?? null;
  const bg = findBackground(firstBackground(script));

  if (started) {
    return (
      <div className="relative h-full w-full">
        <StoryPlayer
          nodes={script.nodes}
          edges={script.edges}
          title={script.title}
          onOpenChat={(c) => onOpenChat(c.id)}
          onComplete={onFinish}
          completeLabel="Gặp các nhân vật"
          reserveTopRight
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black text-[#F5F2EA]">
      <div className="absolute inset-0" style={{ background: bg.css }} />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35)_0%,transparent_30%,rgba(0,0,0,0.85)_100%)]" />
      {narrator?.portraitUrl && (
        <img
          src={narrator.portraitUrl}
          alt=""
          className="story-portrait-in pointer-events-none absolute bottom-0 left-[6%] h-[82%] w-auto object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)] max-md:left-1/2 max-md:h-[70%] max-md:-translate-x-1/2 max-md:opacity-60"
        />
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-4 p-6 md:items-end md:p-10 md:text-right">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
            {narrator ? `${narrator.name} kể chuyện` : "Kể chuyện"}
          </p>
          <p className="mt-1 font-display text-[28px] font-bold leading-[1.1] drop-shadow-lg md:text-[34px]">{script.title || contextTitle}</p>
          <p className="mt-2 max-w-sm text-[13px] text-white/70 md:ml-auto">
            Nghe kể, chọn hướng câu chuyện và trả lời câu hỏi. Bạn có thể hỏi nhân vật bất cứ lúc nào.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onFinish}
            className="flex h-11 cursor-pointer items-center gap-1.5 rounded-sm border border-white/40 bg-black/40 px-4 text-[12px] font-bold uppercase tracking-[0.1em] text-white/90 backdrop-blur hover:bg-white hover:text-black"
          >
            <SkipForward className="size-3.5" /> Bỏ qua
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => setStarted(true)}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-sm bg-[var(--accent-gold)] px-5 text-[14px] font-bold text-white transition-transform hover:scale-[1.03] hover:bg-[var(--accent-bronze)]"
          >
            <Play className="size-4 fill-white" /> Bắt đầu nghe kể
          </button>
        </div>
      </div>
    </div>
  );
}

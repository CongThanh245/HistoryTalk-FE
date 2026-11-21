"use client";

/* eslint-disable @next/next/no-img-element -- context covers and portraits come from any host */
import { BookOpenText, ChevronRight, Clapperboard, Clock, GitBranch, CircleHelp, Play, Users } from "lucide-react";
import { storyStats } from "@/features/story/graph-utils";
import { findBackground } from "@/features/story/story-assets";
import type { StoryScript } from "@/features/story/types";
import type { HistoricalEvent } from "@/services/event.service";
import "@/features/story/story.css";

type Narrator = { name: string; imageUrl?: string | null } | null;

function firstBackground(script: StoryScript | null) {
  for (const n of script?.nodes ?? []) if (n.data.kind === "line" && n.data.background) return n.data.background;
  return null;
}

function minutes(seconds: number) {
  return seconds < 60 ? "dưới 1 phút" : `~${Math.round(seconds / 60)} phút`;
}

/**
 * First screen of a historical context: how to discover it. A published story is the main way in, the intro video
 * the second; the characters are always one click away. Shown only when there is a story or a video.
 */
export function ContextIntroCover({
  event,
  script,
  narrator,
  onStory,
  onVideo,
  onCharacters,
}: {
  event: HistoricalEvent;
  script: StoryScript | null;
  narrator: Narrator;
  onStory: () => void;
  onVideo: () => void;
  onCharacters: () => void;
}) {
  const hasVideo = !!event.videoUrl;
  const counts = script
    ? {
        ...storyStats(script.nodes),
        choices: script.nodes.filter((n) => n.data.kind === "choice").length,
        quizzes: script.nodes.filter((n) => n.data.kind === "quiz").length,
      }
    : null;
  const cover = event.imageUrl ? `url("${event.imageUrl}") center/cover no-repeat` : findBackground(firstBackground(script)).css;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-black text-[#F5F2EA]">
      <div className="absolute inset-0 scale-105" style={{ background: cover }} />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.2)_30%,rgba(0,0,0,0.88)_75%,rgba(0,0,0,0.95)_100%)]" />
      {script && narrator?.imageUrl && (
        <img
          src={narrator.imageUrl}
          alt=""
          className="story-portrait-in pointer-events-none absolute bottom-0 right-[3%] h-[78%] w-auto object-contain object-bottom opacity-90 drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)] max-md:hidden"
        />
      )}

      <div className="relative z-10 mt-auto flex w-full max-w-[560px] flex-col gap-4 overflow-y-auto p-5 pt-16 md:p-10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Tìm hiểu bối cảnh</p>
          <h2 className="mt-1 font-display text-[30px] font-bold leading-[1.05] drop-shadow-lg md:text-[40px]">{event.title}</h2>
        </div>

        <div className="flex flex-col gap-2.5">
          {script && counts && (
            <button
              type="button"
              autoFocus
              onClick={onStory}
              className="group flex w-full cursor-pointer items-center gap-4 rounded-md border border-[#D9B25C]/70 bg-[rgba(20,16,12,0.78)] p-4 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[#D9B25C] hover:bg-[rgba(32,25,16,0.9)] md:p-5"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-sm bg-[var(--accent-gold)] text-white transition-transform group-hover:scale-105">
                <BookOpenText className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[16px] font-bold md:text-[17px]">
                    {narrator ? `Nghe ${narrator.name} kể chuyện` : "Nghe kể chuyện"}
                  </span>
                  <span className="rounded-sm bg-[#D9B25C] px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-[#111]">Tương tác</span>
                </span>
                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-white/65">
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> {minutes(counts.seconds)}</span>
                  {counts.choices > 0 && <span className="flex items-center gap-1"><GitBranch className="size-3.5" /> {counts.choices} lựa chọn</span>}
                  {counts.quizzes > 0 && <span className="flex items-center gap-1"><CircleHelp className="size-3.5" /> {counts.quizzes} câu hỏi</span>}
                </span>
              </span>
              <Play className="size-5 shrink-0 fill-current text-[#D9B25C]" />
            </button>
          )}

          {hasVideo && (
            <button
              type="button"
              autoFocus={!script}
              onClick={onVideo}
              className={
                script
                  ? "group flex w-full cursor-pointer items-center gap-3 rounded-md border border-white/20 bg-black/45 px-4 py-3 text-left backdrop-blur-md transition-colors hover:border-white/60"
                  : "group flex w-full cursor-pointer items-center gap-4 rounded-md border border-white/40 bg-[rgba(20,16,12,0.78)] p-4 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-white md:p-5"
              }
            >
              <span
                className={
                  script
                    ? "grid size-9 shrink-0 place-items-center rounded-sm border border-white/30"
                    : "grid size-12 shrink-0 place-items-center rounded-sm bg-[var(--accent-gold)] text-white"
                }
              >
                <Clapperboard className={script ? "size-4" : "size-6"} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={script ? "block text-[14px] font-semibold" : "block text-[16px] font-bold"}>Xem video giới thiệu</span>
                {!script && <span className="mt-0.5 block text-[12px] text-white/65">Video ngắn về bối cảnh</span>}
              </span>
              <Play className="size-4 shrink-0 fill-current opacity-70" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onCharacters}
          className="flex w-fit cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-white/75 underline-offset-4 hover:text-white hover:underline"
        >
          <Users className="size-4" /> Gặp các nhân vật ngay <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

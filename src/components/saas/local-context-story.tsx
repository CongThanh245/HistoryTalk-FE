"use client";

/* eslint-disable @next/next/no-img-element -- character portraits come from any host */
import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { MessageCircle, RotateCcw, UserRound, X } from "lucide-react";

import { ContextIntroCover } from "@/components/event/context-intro-cover";
import { ContextStoryIntro } from "@/components/story/player/context-story-intro";
import { ROUTES } from "@/constants/routes";
import { useStudentLocalContent, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import { isPlayableScript } from "@/features/story/story-script";
import { getYouTubeEmbedUrl } from "@/lib/utils/video-url";
import type { HistoricalEvent } from "@/services/event.service";
import type { LocalItem } from "@/services/local-content.service";

type Stage = "story" | "video" | "characters";

/** The local context in the shape the intro cover reads (title, cover image, video). */
function asEvent(item: LocalItem): HistoricalEvent {
  return {
    id: item.id,
    title: item.name,
    summary: item.description,
    year: item.year ?? 0,
    imageUrl: item.imageUrl ?? null,
    videoUrl: item.videoUrl ?? null,
  };
}

/**
 * How a student discovers a local context, as on HistoryTalk's contexts: a cover to listen to the published story,
 * watch the intro video or meet the characters, each opening full screen. After the story come the characters to
 * chat with, and a way to listen again. Renders nothing when the context has neither a story nor a video.
 */
export function LocalContextStory({ item, teacher }: { item: LocalItem; teacher?: boolean }) {
  const script = item.type === "CONTEXT" && isPlayableScript(item.storyScript) ? item.storyScript : null;
  const hasVideo = item.type === "CONTEXT" && !!item.videoUrl;
  const [stage, setStage] = React.useState<Stage | null>(null);
  const router = useRouter();

  // Characters are the local characters linked to this context (students: published ones of their classes).
  const enabled = item.type === "CONTEXT" && (!!script || hasVideo);
  const student = useStudentLocalContent(!teacher && enabled);
  const mine = useTeacherLocalContent(!!teacher && enabled);
  const pool = teacher ? mine.characters : student.items.filter((i) => i.type === "CHARACTER");
  const characters = pool.filter((c) => c.contextIds?.includes(item.id));
  const narrator = script ? characters.find((c) => c.id === script.narratorId) ?? null : null;

  const close = React.useCallback(() => setStage(null), []);
  React.useEffect(() => {
    if (!stage) return;
    // The story player handles Esc itself (it closes its log first).
    if (stage === "story") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, close]);

  if (!enabled) return null;
  const openChat = (id: string) => router.push(ROUTES.CHAT(id));
  const embed = hasVideo ? getYouTubeEmbedUrl(item.videoUrl, { autoplay: true }) : null;

  return (
    <>
      <div className="h-[420px] overflow-hidden rounded-sm border border-[var(--text-primary)] max-sm:h-[460px]">
        <ContextIntroCover
          event={asEvent(item)}
          script={script}
          narrator={narrator ? { name: narrator.name, imageUrl: narrator.imageUrl } : null}
          onStory={() => setStage("story")}
          onVideo={() => setStage("video")}
          onCharacters={() => setStage("characters")}
        />
      </div>

      {stage &&
        createPortal(
          <div className="fixed inset-0 z-[70] bg-black text-[#F5F2EA]" role="dialog" aria-modal="true" aria-label={item.name}>
            {stage === "story" && script && (
              <ContextStoryIntro
                script={script}
                contextTitle={item.name}
                characters={characters}
                onFinish={() => setStage("characters")}
                onOpenChat={openChat}
                autoStart
              />
            )}

            {stage === "video" && item.videoUrl && (
              <div className="grid h-full place-items-center p-4 pt-16 md:p-12">
                {embed ? (
                  <iframe
                    className="aspect-video w-full max-w-5xl"
                    src={embed}
                    title={`${item.name} video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video src={item.videoUrl} controls autoPlay className="max-h-full w-full max-w-5xl" onEnded={() => setStage("characters")} />
                )}
              </div>
            )}

            {stage === "characters" && (
              <div className="flex h-full flex-col overflow-y-auto px-5 pb-10 pt-16 md:px-12">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F4B3A3]">Nhân vật trong bối cảnh</p>
                <h2 className="mt-1 font-display text-[30px] font-bold leading-tight md:text-[36px]">{item.name}</h2>
                {(script || hasVideo) && (
                  <button
                    type="button"
                    onClick={() => setStage(script ? "story" : "video")}
                    className="mt-2 flex w-fit cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-[#F4B3A3] underline-offset-4 hover:underline"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> {script ? "Nghe lại kể chuyện" : "Xem lại video giới thiệu"}
                  </button>
                )}

                {characters.length === 0 ? (
                  <p className="mt-8 text-[14px] text-white/65">Bối cảnh này chưa có nhân vật để trò chuyện.</p>
                ) : (
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {characters.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => openChat(c.id)}
                          className="group flex w-full cursor-pointer items-center gap-3 rounded-md border border-white/20 bg-white/5 p-3 text-left transition-colors hover:border-[#D9B25C] hover:bg-white/10"
                        >
                          {c.imageUrl ? (
                            <img src={c.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-sm object-cover object-top" />
                          ) : (
                            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-sm bg-[var(--accent-gold)]">
                              <UserRound className="h-7 w-7" aria-hidden="true" />
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[15px] font-bold">{c.name}</span>
                            {c.title && <span className="block truncate text-[12.5px] text-white/60">{c.title}</span>}
                            <span className="mt-1 flex items-center gap-1 text-[12.5px] font-semibold text-[#D9B25C]">
                              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> Trò chuyện
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* The story player has its own "Bỏ qua" there; leaving it leads to the characters, which have this. */}
            {stage !== "story" && <button
              type="button"
              onClick={close}
              aria-label="Đóng"
              className="absolute right-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-sm border border-white/40 bg-black/50 text-white hover:bg-black/80"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>}
          </div>,
          document.body,
        )}
    </>
  );
}

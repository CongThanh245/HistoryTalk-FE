"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { BookOpen, Play, X } from "lucide-react";

import { Panel } from "@/components/saas/saas-ui";
import { ContextStoryIntro } from "@/components/story/player/context-story-intro";
import { ROUTES } from "@/constants/routes";
import { useStudentLocalContent, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import { isPlayableScript } from "@/features/story/story-script";
import type { LocalItem } from "@/services/local-content.service";

/**
 * A local context's published visual-novel story, as on HistoryTalk's contexts: a card with a play button that opens
 * the player full screen. Renders nothing when the context has no playable story.
 */
export function LocalContextStory({ item, teacher }: { item: LocalItem; teacher?: boolean }) {
  const script = item.type === "CONTEXT" && isPlayableScript(item.storyScript) ? item.storyScript : null;
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // Speakers are the local characters linked to this context (students: published ones of their classes).
  const student = useStudentLocalContent(!teacher && !!script);
  const mine = useTeacherLocalContent(!!teacher && !!script);
  const pool = teacher ? mine.characters : student.items.filter((i) => i.type === "CHARACTER");
  const characters = pool.filter((c) => c.contextIds?.includes(item.id));

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!script) return null;
  const narrator = characters.find((c) => c.id === script.narratorId);

  return (
    <Panel className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <BookOpen className="h-7 w-7 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-[16px] font-bold text-content-heading">{script.title || `Chuyện kể: ${item.name}`}</h3>
        <p className="text-[13px] leading-relaxed text-content-muted">
          {narrator ? `${narrator.name} kể lại sự kiện` : "Câu chuyện kể lại sự kiện"}, có lựa chọn và câu hỏi xen giữa.
        </p>
      </div>
      <button type="button" className="btn-crimson shrink-0" onClick={() => setOpen(true)}>
        <Play className="h-4 w-4" aria-hidden="true" /> Nghe kể chuyện
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70] bg-black" role="dialog" aria-modal="true" aria-label={script.title || item.name}>
            <ContextStoryIntro
              script={script}
              contextTitle={item.name}
              characters={characters}
              onFinish={() => setOpen(false)}
              onOpenChat={(id) => router.push(ROUTES.CHAT(id))}
              autoStart
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              className="absolute right-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-sm border border-white/40 bg-black/50 text-white hover:bg-black/80"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>,
          document.body,
        )}
    </Panel>
  );
}

"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { localContentService, type LocalStoryUsage } from "@/services/local-content.service";

/*
 * A published local story only shows characters its students can see. Hiding, deleting or unlinking such a character
 * (or narrowing its classes) makes the backend move the story back to draft, content kept. These helpers warn first.
 */

type Who = "teacher" | "school";

async function fetchUsages(characterIds: string[], who: Who): Promise<LocalStoryUsage[]> {
  const get = who === "school" ? localContentService.characterPublishedStoriesForSchool : localContentService.characterPublishedStories;
  const lists = await Promise.all(characterIds.map((id) => get(id)));
  const byContext = new Map(lists.flat().map((u) => [u.contextId, u]));
  return [...byContext.values()];
}

/** The stories that would go back to draft, for a dialog that already exists. */
export function useStoryUsages(characterIds: string[], who: Who, enabled: boolean) {
  const query = useQuery({
    queryKey: ["local-content", "story-usages", who, ...characterIds],
    queryFn: () => fetchUsages(characterIds, who),
    enabled: enabled && characterIds.length > 0,
    staleTime: 0,
  });
  return enabled ? query.data ?? [] : [];
}

export function StoryCascadeNotice({ usages }: { usages: LocalStoryUsage[] }) {
  if (!usages.length) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-sm border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-3 text-sm">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold text-content-heading">
          {usages.length === 1 ? "Kịch bản kể chuyện này" : `${usages.length} kịch bản kể chuyện này`} sẽ chuyển về bản nháp, học sinh không nghe được nữa:
        </p>
        <ul className="list-disc space-y-0.5 pl-4 text-content-muted">
          {usages.map((u) => (
            <li key={u.contextId}>
              {u.storyTitle || "Kịch bản chưa đặt tên"} <span className="text-xs">· bối cảnh “{u.contextName}”</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-content-muted">Nội dung kịch bản được giữ nguyên; sửa nhân vật xong có thể xuất bản lại trong tab “Kể chuyện”.</p>
      </div>
    </div>
  );
}

/**
 * For actions without a confirm dialog of their own: `guard(ids, label, run)` runs at once when no published story
 * uses the characters, otherwise asks first. If the lookup fails the action still runs (the backend cascades anyway).
 */
export function useStoryCascadeGuard(who: Who = "teacher") {
  const [pending, setPending] = React.useState<{ usages: LocalStoryUsage[]; label: string; run: () => void } | null>(null);

  const guard = React.useCallback(
    async (characterIds: string[], label: string, run: () => void, only?: (u: LocalStoryUsage) => boolean) => {
      let usages: LocalStoryUsage[] = [];
      try {
        usages = await fetchUsages(characterIds, who);
      } catch {
        usages = [];
      }
      if (only) usages = usages.filter(only);
      if (!usages.length) run();
      else setPending({ usages, label, run });
    },
    [who],
  );

  const dialog = (
    <ConfirmDialog
      open={!!pending}
      onOpenChange={(open) => !open && setPending(null)}
      variant="warning"
      title="Kịch bản kể chuyện sẽ chuyển về nháp"
      confirmLabel={pending ? `Vẫn ${pending.label}` : "Tiếp tục"}
      onConfirm={() => {
        pending?.run();
        setPending(null);
      }}
    >
      {pending && <StoryCascadeNotice usages={pending.usages} />}
    </ConfirmDialog>
  );

  return { guard, dialog };
}

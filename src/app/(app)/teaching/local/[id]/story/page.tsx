"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { StoryEditor } from "@/components/story/editor/story-editor";
import { localKeys } from "@/features/saas/hooks-local-content";
import { localStoryRepo } from "@/features/story/story-repo";

/** Teacher: visual-novel story of one of their local contexts (same editor as HistoryTalk's contexts). */
export default function LocalStoryEditorPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  // The editor saves straight through the service; mark the cached local content stale after each save, or the
  // "Kể chuyện" tab (5 min cache, no refetch on mount) would still show the old story.
  const repo = useMemo(() => {
    const base = localStoryRepo(id);
    return {
      ...base,
      save: async (doc: Parameters<typeof base.save>[0]) => {
        const where = await base.save(doc);
        void queryClient.invalidateQueries({ queryKey: localKeys.all });
        return where;
      },
    };
  }, [id, queryClient]);

  return (
    // map-page: the app shell drops its max width and padding, so the canvas fills the main area.
    <div className="map-page staff-theme absolute inset-0">
      <StoryEditor storyId={id} repo={repo} />
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { ROUTES } from "@/constants/routes";
import { StoryListPage, type StoryListSource } from "@/components/story/story-list-page";
import { loadContextCharacters, storyRepo } from "@/features/story/story-repo";

/** Content Admin: stories of HistoryTalk's historical contexts. */
export default function StoriesPageContent() {
  const source = useMemo<StoryListSource>(
    () => ({
      eyebrow: "Thay cho video giới thiệu",
      title: "Kịch bản kể chuyện",
      description:
        "Nhân vật lịch sử trực tiếp kể lại bối cảnh theo kiểu visual novel. Bối cảnh có kịch bản đã xuất bản sẽ phát kịch bản thay cho video giới thiệu.",
      audience: "Người học",
      async list() {
        const res = await storyRepo.list();
        return {
          serverSupported: res.serverSupported,
          entries: res.entries.map((e) => ({
            id: e.context.id,
            name: e.context.title,
            imageUrl: e.context.imageUrl,
            videoUrl: e.context.videoUrl,
            script: e.script,
            storage: e.storage,
          })),
        };
      },
      editorHref: ROUTES.STAFF.STORY_EDITOR,
      remove: (id) => storyRepo.remove(id),
      loadCharacters: loadContextCharacters,
    }),
    [],
  );
  return <StoryListPage source={source} />;
}

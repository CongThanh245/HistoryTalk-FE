"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { StoryListPage, type StoryListSource } from "@/components/story/story-list-page";
import { ROUTES } from "@/constants/routes";
import { localKeys } from "@/features/saas/hooks-local-content";
import { isStoryScript } from "@/features/story/story-script";
import { loadLocalContextCharacters } from "@/features/story/story-repo";
import { localContentService, type LocalItem } from "@/services/local-content.service";
import { useAuthStore } from "@/store/auth.store";

const LIST_SIZE = 100;

/** Why students cannot hear a published story of this context yet. */
function warningOf(item: LocalItem, published: boolean) {
  if (item.status === "INACTIVE") return "Bối cảnh đang bị ẩn nên học sinh chưa thấy kịch bản.";
  if (!item.isPublished) return published ? "Bối cảnh chưa xuất bản nên học sinh chưa thấy kịch bản." : "Bối cảnh chưa xuất bản: cần xuất bản bối cảnh trước khi xuất bản kịch bản.";
  return null;
}

/** Teacher: stories of the local contexts they created (only the author may edit a context's story). */
export default function TeacherStoriesPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  const queryClient = useQueryClient();

  const source = useMemo<StoryListSource>(
    () => ({
      eyebrow: "Tư liệu của trường",
      title: "Kịch bản kể chuyện",
      description:
        "Nhân vật trong bối cảnh bạn soạn sẽ kể lại sự kiện cho học sinh theo kiểu visual novel, có chỗ rẽ nhánh và câu hỏi xen giữa. Chỉ bối cảnh do bạn tạo mới soạn kịch bản được.",
      audience: "Học sinh",
      async list() {
        const page = await localContentService.list("CONTEXT", { page: 1, size: LIST_SIZE });
        const mine = page.items.filter((c) => !uid || c.createdBy?.uid === uid);
        return {
          serverSupported: true,
          entries: mine.map((c) => {
            const script = isStoryScript(c.storyScript) ? c.storyScript : null;
            return {
              id: c.id,
              name: c.name,
              imageUrl: c.imageUrl,
              videoUrl: c.videoUrl,
              script,
              storage: "server" as const,
              warning: script || !c.isPublished || c.status === "INACTIVE" ? warningOf(c, script?.status === "published") : null,
            };
          }),
        };
      },
      editorHref: ROUTES.TEACHING.LOCAL_STORY,
      async remove(id) {
        await localContentService.updateContext(id, { storyScript: null });
        void queryClient.invalidateQueries({ queryKey: localKeys.all });
      },
      loadCharacters: loadLocalContextCharacters,
      toolbar: (
        <Link
          href={ROUTES.TEACHING.LOCAL_NEW("CONTEXT")}
          className="flex h-10 items-center gap-2 rounded-sm border border-[var(--text-primary)] px-4 text-[14px] font-semibold hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
        >
          <Plus className="size-4" /> Bối cảnh mới
        </Link>
      ),
      emptyText: "Bạn chưa tạo bối cảnh nào. Tạo bối cảnh trước, rồi soạn kịch bản kể chuyện cho nó.",
    }),
    [uid, queryClient],
  );

  return (
    <div className="staff-theme">
      <StoryListPage source={source} />
    </div>
  );
}

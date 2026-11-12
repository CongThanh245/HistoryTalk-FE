"use client";

/* eslint-disable @next/next/no-img-element -- transparent portrait cut-outs */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, Clapperboard, Clock, MessageSquareText, MousePointerClick, Play, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { ROUTES } from "@/constants/routes";
import { formatDuration, storyStats, validateStory } from "@/features/story/graph-utils";
import { MOCK_CONTEXTS, findBackground, findCharacter, storyRepo } from "@/features/story/mock-data";
import type { StoryDoc } from "@/features/story/types";
import { StoryPlayer } from "@/components/story/player/story-player";
import { ScaledStage } from "@/components/story/player/scaled-stage";

function firstBackground(story: StoryDoc) {
  for (const n of story.nodes) if (n.data.kind === "line" && n.data.background) return n.data.background;
  return null;
}

function StoryCard({ story, onPreview, onDelete }: { story: StoryDoc; onPreview: () => void; onDelete: () => void }) {
  const narrator = findCharacter(story.narratorId);
  const stats = storyStats(story.nodes);
  const errors = validateStory(story.nodes, story.edges).filter((i) => i.level === "error").length;
  const published = story.status === "published";

  return (
    <article className="group flex flex-col overflow-hidden rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] transition-all hover:-translate-y-0.5 hover:border-[var(--text-primary)] hover:shadow-[0_14px_30px_-18px_rgba(0,0,0,0.5)]">
      <Link href={ROUTES.STAFF.STORY_EDITOR(story.id)} className="relative block aspect-[16/8] overflow-hidden" style={{ background: findBackground(firstBackground(story)).css }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {narrator?.portraitUrl && (
          <img src={narrator.portraitUrl} alt="" className="absolute bottom-0 left-4 h-[115%] w-auto object-contain object-top drop-shadow-xl transition-transform duration-300 group-hover:scale-[1.03]" />
        )}
        <span
          className={cn(
            "absolute right-3 top-3 rounded-sm px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider",
            published ? "bg-[#3D6B63] text-white" : "bg-black/50 text-white/85 backdrop-blur",
          )}
        >
          {published ? "Đã xuất bản" : "Nháp"}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-3 pl-[45%] text-right text-[#F5F2EA]">
          <p className="text-[11px] uppercase tracking-[0.12em] text-white/65">{story.contextName}</p>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={ROUTES.STAFF.STORY_EDITOR(story.id)} className="text-[16px] font-bold leading-snug hover:text-[var(--accent-gold)]">
          {story.title}
        </Link>
        <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">
          {narrator ? `Kể bởi ${narrator.name}` : "Người dẫn truyện"} · sửa {new Date(story.updatedAt).toLocaleDateString("vi-VN")}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1"><MessageSquareText className="size-3.5" /> {stats.lines} lời thoại</span>
          <span className="flex items-center gap-1"><MousePointerClick className="size-3.5" /> {stats.interactions} tương tác</span>
          <span className="flex items-center gap-1"><Clock className="size-3.5" /> ~{formatDuration(stats.seconds)}</span>
        </div>
        {errors > 0 && (
          <p className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-[var(--accent-gold)]">
            <CircleAlert className="size-3.5" /> {errors} lỗi cần sửa
          </p>
        )}
        <div className="mt-auto flex gap-2 pt-4">
          <Link
            href={ROUTES.STAFF.STORY_EDITOR(story.id)}
            className="flex h-9 flex-1 items-center justify-center rounded-sm bg-[var(--text-primary)] text-[13px] font-semibold text-[var(--text-inverse)] hover:bg-[var(--accent-gold)]"
          >
            Mở trình soạn
          </Link>
          <button
            type="button"
            onClick={onPreview}
            title="Xem thử"
            aria-label="Xem thử"
            className="grid size-9 cursor-pointer place-items-center rounded-sm border border-[var(--border-strong)] hover:border-[var(--text-primary)]"
          >
            <Play className="size-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Xóa"
            aria-label="Xóa"
            className="grid size-9 cursor-pointer place-items-center rounded-sm border border-[var(--border-strong)] text-[var(--text-tertiary)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function StoriesPageContent() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryDoc[] | null>(null);
  const [preview, setPreview] = useState<StoryDoc | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setStories(storyRepo.list());
  }, []);

  const refresh = () => setStories(storyRepo.list());

  const remove = (story: StoryDoc) => {
    storyRepo.remove(story.id);
    refresh();
    toast(`Đã xóa "${story.title}"`, {
      action: {
        label: "Hoàn tác",
        onClick: () => {
          storyRepo.save(story);
          refresh();
        },
      },
    });
  };

  const create = (contextId: string) => {
    const doc = storyRepo.create(contextId);
    router.push(ROUTES.STAFF.STORY_EDITOR(doc.id));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent-gold)]">
            <Clapperboard className="size-4" /> Thay cho video giới thiệu
          </p>
          <h1 className="mt-1 font-display text-[34px] font-extrabold leading-none">Kịch bản kể chuyện</h1>
          <p className="mt-2 max-w-2xl text-[14px] text-[var(--text-tertiary)]">
            Nhân vật lịch sử trực tiếp kể lại bối cảnh theo kiểu visual novel. Học sinh chọn nhánh, trả lời câu hỏi và hỏi lại nhân vật ngay trong câu chuyện.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-sm bg-[var(--accent-gold)] px-4 text-[14px] font-semibold text-[var(--text-inverse)] hover:bg-[var(--accent-bronze)]"
        >
          <Plus className="size-4" /> Tạo kịch bản
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-sm border border-dashed border-[var(--accent-brass)]/60 bg-[var(--accent-brass-soft)] px-4 py-2.5 text-[12.5px] text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--accent-brass)]">Bản dùng thử</span>
        Dữ liệu giả, lưu trên trình duyệt này, chưa nối backend.
        <button
          type="button"
          onClick={() => {
            storyRepo.reset();
            refresh();
            toast.success("Đã khôi phục dữ liệu mẫu");
          }}
          className="ml-auto flex cursor-pointer items-center gap-1 font-semibold text-[var(--text-primary)] hover:underline"
        >
          <RotateCcw className="size-3.5" /> Khôi phục dữ liệu mẫu
        </button>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stories === null
          ? Array.from({ length: 3 }, (_, i) => <div key={i} className="h-[360px] animate-pulse rounded-md bg-[var(--bg-deep)]" />)
          : stories.map((s) => <StoryCard key={s.id} story={s} onPreview={() => setPreview(s)} onDelete={() => remove(s)} />)}
        {stories !== null && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex min-h-[360px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[var(--border-strong)] text-[var(--text-tertiary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
          >
            <Plus className="size-7" />
            <span className="text-[14px] font-semibold">Kịch bản mới</span>
          </button>
        )}
      </div>

      {/* Create: pick the context it replaces the video of. */}
      {creating && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4" onClick={() => setCreating(false)}>
          <div className="story-fade-in w-full max-w-md rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center">
              <h2 className="text-[18px] font-bold">Kịch bản cho bối cảnh nào?</h2>
              <button type="button" aria-label="Đóng" onClick={() => setCreating(false)} className="ml-auto cursor-pointer rounded-sm p-1 hover:bg-[var(--bg-deep)]">
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">Kịch bản sẽ phát thay video giới thiệu của bối cảnh này.</p>
            <div className="mt-4 space-y-2">
              {MOCK_CONTEXTS.map((c) => {
                const used = stories?.some((s) => s.contextId === c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => create(c.id)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-sm border border-[var(--border-strong)] px-3.5 py-3 text-left text-[14px] font-semibold hover:border-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  >
                    {c.name}
                    {used && <span className="shrink-0 text-[11px] font-normal text-[var(--text-muted)]">đã có kịch bản</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[80] bg-[#0B0A09]/95 p-4 md:p-8">
          <ScaledStage>
            <StoryPlayer nodes={preview.nodes} edges={preview.edges} title={preview.title} onClose={() => setPreview(null)} />
          </ScaledStage>
        </div>
      )}
    </div>
  );
}

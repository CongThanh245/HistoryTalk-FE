"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CircleAlert,
  Clapperboard,
  Clock,
  HardDrive,
  Loader2,
  MessageSquareText,
  MousePointerClick,
  Play,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils/cn";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import { ROUTES } from "@/constants/routes";
import { formatDuration, storyStats, validateStory } from "@/features/story/graph-utils";
import { findBackground } from "@/features/story/story-assets";
import { loadContextCharacters, storyRepo, type StoryEntry } from "@/features/story/story-repo";
import { StoryPlayer } from "@/components/story/player/story-player";
import { ScaledStage } from "@/components/story/player/scaled-stage";

type Filter = "all" | "published" | "draft" | "none";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "published", label: "Đã xuất bản" },
  { id: "draft", label: "Nháp" },
  { id: "none", label: "Chưa có kịch bản" },
];

const filterOf = (e: StoryEntry): Exclude<Filter, "all"> => (!e.script ? "none" : e.script.status === "published" ? "published" : "draft");

function firstBackground(entry: StoryEntry) {
  for (const n of entry.script?.nodes ?? []) if (n.data.kind === "line" && n.data.background) return n.data.background;
  return null;
}

function StoryCard({
  entry,
  onPreview,
  onDelete,
}: {
  entry: StoryEntry;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const { context, script } = entry;
  const href = ROUTES.STAFF.STORY_EDITOR(context.id);
  const stats = script ? storyStats(script.nodes) : null;
  const errors = script ? validateStory(script.nodes, script.edges).filter((i) => i.level === "error").length : 0;
  const state = filterOf(entry);
  const cover = context.imageUrl ? `url("${context.imageUrl}") center/cover no-repeat` : findBackground(firstBackground(entry)).css;

  return (
    <article className="group flex flex-col overflow-hidden rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] transition-all hover:-translate-y-0.5 hover:border-[var(--text-primary)] hover:shadow-[0_14px_30px_-18px_rgba(0,0,0,0.5)]">
      <Link href={href} className="relative block aspect-[16/8] overflow-hidden" style={{ background: cover }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        <span
          className={cn(
            "absolute right-3 top-3 rounded-sm px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider",
            state === "published" && "bg-[#3D6B63] text-white",
            state === "draft" && "bg-black/55 text-white/90 backdrop-blur",
            state === "none" && "border border-white/40 bg-black/30 text-white/80 backdrop-blur",
          )}
        >
          {state === "published" ? "Đã xuất bản" : state === "draft" ? "Nháp" : "Chưa có kịch bản"}
        </span>
        {entry.storage === "local" && script && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-sm bg-[#D9B25C] px-2 py-0.5 text-[10.5px] font-bold text-[#111]" title="Chỉ lưu trên trình duyệt này">
            <HardDrive className="size-3" /> Trên máy này
          </span>
        )}
        <p className="absolute inset-x-0 bottom-0 p-3 font-display text-[19px] font-bold leading-tight text-[#F5F2EA]">{context.title}</p>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {script ? (
          <>
            <Link href={href} className="text-[15px] font-bold leading-snug hover:text-[var(--accent-gold)]">
              {script.title}
            </Link>
            <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">Sửa lần cuối {new Date(script.updatedAt).toLocaleDateString("vi-VN")}</p>
            {stats && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1"><MessageSquareText className="size-3.5" /> {stats.lines} lời thoại</span>
                <span className="flex items-center gap-1"><MousePointerClick className="size-3.5" /> {stats.interactions} tương tác</span>
                <span className="flex items-center gap-1"><Clock className="size-3.5" /> ~{formatDuration(stats.seconds)}</span>
              </div>
            )}
            {errors > 0 && (
              <p className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-[var(--accent-gold)]">
                <CircleAlert className="size-3.5" /> {errors} lỗi cần sửa
              </p>
            )}
          </>
        ) : (
          <p className="text-[13px] text-[var(--text-tertiary)]">
            {context.videoUrl ? "Học sinh đang xem video giới thiệu." : "Chưa có video hay kịch bản giới thiệu."} Soạn kịch bản để nhân vật kể lại bối cảnh này.
          </p>
        )}

        <div className="mt-auto flex gap-2 pt-4">
          <Link
            href={href}
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-sm text-[13px] font-semibold",
              script
                ? "bg-[var(--text-primary)] text-[var(--text-inverse)] hover:bg-[var(--accent-gold)]"
                : "border border-dashed border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]",
            )}
          >
            {script ? "Mở trình soạn" : <><Plus className="size-4" /> Soạn kịch bản</>}
          </Link>
          {script && (
            <>
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
                title="Xóa kịch bản"
                aria-label="Xóa kịch bản"
                className="grid size-9 cursor-pointer place-items-center rounded-sm border border-[var(--border-strong)] text-[var(--text-tertiary)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export default function StoriesPageContent() {
  const [entries, setEntries] = useState<StoryEntry[] | null>(null);
  const [serverSupported, setServerSupported] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [preview, setPreview] = useState<StoryEntry | null>(null);
  const [deleting, setDeleting] = useState<StoryEntry | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const refresh = useCallback(() => {
    setLoadError("");
    storyRepo
      .list()
      .then((res) => {
        setEntries(res.entries);
        setServerSupported(res.serverSupported);
      })
      .catch((e) => setLoadError(getApiErrorMessage(e, "Vui lòng thử lại.")));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, published: 0, draft: 0, none: 0 };
    for (const e of entries ?? []) {
      c.all++;
      c[filterOf(e)]++;
    }
    return c;
  }, [entries]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (entries ?? [])
      .filter((e) => filter === "all" || filterOf(e) === filter)
      .filter((e) => !q || e.context.title.toLowerCase().includes(q) || e.script?.title.toLowerCase().includes(q))
      // Contexts with a story first, most recently edited on top.
      .sort((a, b) => Number(!!b.script) - Number(!!a.script) || (b.script?.updatedAt ?? "").localeCompare(a.script?.updatedAt ?? ""));
  }, [entries, filter, search]);

  const openPreview = async (entry: StoryEntry) => {
    await loadContextCharacters(entry.context.id);
    setPreview(entry);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      await storyRepo.remove(deleting.context.id);
      toast.success(`Đã xóa kịch bản của "${deleting.context.title}"`);
      setDeleting(null);
      refresh();
    } catch (e) {
      toast.error("Không xóa được kịch bản", { description: getApiErrorMessage(e, "Vui lòng thử lại.") });
    } finally {
      setBusyDelete(false);
    }
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
            Nhân vật lịch sử trực tiếp kể lại bối cảnh theo kiểu visual novel. Bối cảnh có kịch bản đã xuất bản sẽ phát kịch bản thay cho video giới thiệu.
          </p>
        </div>
      </div>

      {!serverSupported && entries && (
        <div className="mt-5 flex flex-wrap items-start gap-2 rounded-sm border border-[var(--accent-brass)]/60 bg-[var(--accent-brass-soft)] px-4 py-3 text-[13px] text-[var(--text-secondary)]">
          <HardDrive className="mt-0.5 size-4 shrink-0 text-[var(--accent-brass)]" />
          <p className="min-w-0 flex-1">
            <span className="font-semibold text-[var(--accent-brass)]">Máy chủ chưa hỗ trợ lưu kịch bản.</span> Kịch bản đang được giữ tạm trên trình duyệt này nên học sinh chưa xem được. Khi backend có trường <code>storyScript</code>, lần lưu tiếp theo sẽ tự chuyển kịch bản lên máy chủ.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm bối cảnh hoặc kịch bản…"
            className="h-10 w-full rounded-sm border border-[var(--border-strong)] bg-[var(--bg-elevated)] pl-9 pr-3 text-[14px] outline-none hover:border-[var(--text-primary)] focus:border-[var(--text-primary)]"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-9 cursor-pointer rounded-sm border px-3 text-[13px] font-semibold",
                filter === f.id
                  ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                  : "border-[var(--border-strong)] hover:border-[var(--text-primary)]",
              )}
            >
              {f.label} <span className="ml-1 opacity-60">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {loadError ? (
        <div className="mt-10 text-center">
          <p className="font-semibold">Không tải được danh sách bối cảnh</p>
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">{loadError}</p>
          <button type="button" onClick={refresh} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-semibold text-[var(--accent-gold)] hover:underline">
            <RotateCcw className="size-4" /> Thử lại
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {entries === null
            ? Array.from({ length: 6 }, (_, i) => <div key={i} className="h-[340px] animate-pulse rounded-md bg-[var(--bg-deep)]" />)
            : visible.map((e) => (
                <StoryCard key={e.context.id} entry={e} onPreview={() => void openPreview(e)} onDelete={() => setDeleting(e)} />
              ))}
          {entries !== null && visible.length === 0 && (
            <p className="col-span-full py-10 text-center text-[14px] text-[var(--text-muted)]">Không có bối cảnh nào khớp.</p>
          )}
        </div>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && !busyDelete && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa kịch bản của &quot;{deleting?.context.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Học sinh sẽ thấy lại video giới thiệu (nếu có). Không thể hoàn tác thao tác này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyDelete}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={busyDelete}
            >
              {busyDelete && <Loader2 className="size-4 animate-spin" />} Xóa kịch bản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {preview?.script && (
        <div className="fixed inset-0 z-[80] bg-[#0B0A09]/95 p-4 md:p-8">
          <ScaledStage>
            <StoryPlayer nodes={preview.script.nodes} edges={preview.script.edges} title={preview.script.title} onClose={() => setPreview(null)} />
          </ScaledStage>
        </div>
      )}
    </div>
  );
}

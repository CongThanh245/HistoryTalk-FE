"use client";

// Bối cảnh & nhân vật: API Sprint 6 (local-contents). BE chưa có API câu đố do giáo viên soạn nên màn này không có mục câu đố.
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpRight, BookMarked, Globe, Image as ImageIcon, Lock, Map as MapIcon, MoreHorizontal, NotebookPen, Pencil, Plus, Trash2, UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaasShell, SearchInput, formatDate, normalizeText } from "@/components/saas/saas-ui";
import { ERA_LABEL, LocalReviewBadge, QueryState, REVIEW_STATE_LABELS, lifeYears, reviewState, type LocalReviewState } from "@/components/saas/local-content-ui";
import { SegmentedFilter, TableShell, TD, TH, TR } from "@/components/saas/teaching-ui";
import { StaffImageHoverPreview } from "@/components/staff/staff-media-preview";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage, useMyApiClassrooms } from "@/features/saas/hooks-api";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { LOCAL_KINDS, localYears, useLocalContentMutations, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import { LOCAL_KIND_LABELS } from "@/features/saas/hooks-teaching";
import type { LocalItem, LocalKind } from "@/services/local-content.service";
import { useAuthStore } from "@/store/auth.store";
import { useEvents } from "@/features/events/hooks";
import { useCharacters } from "@/features/characters/hooks";

const STATES: LocalReviewState[] = ["DRAFT", "PUBLISHED", "HIDDEN"];

/**
 * Kho tư liệu (Role Matrix rows 12–14): the teacher's own contexts / characters and colleagues'
 * school-wide ones. Teachers publish their own content; the School Admin only oversees it.
 */
export default function LocalHistoryPage() {
  const [kind, setKind] = React.useState<LocalKind>("CONTEXT");
  return (
    <SaasShell
      variant="app"
      live
      title="Soạn tư liệu"
      description="Bối cảnh và nhân vật bạn soạn cho lớp. Tạo xong là học sinh thấy và bạn giao bài được ngay."
    >
      <LocalHistory kind={kind} setKind={setKind} />
    </SaasShell>
  );
}

function LocalHistory({ kind, setKind }: { kind: LocalKind; setKind: (k: LocalKind) => void }) {
  const api = useTeacherLocalContent();
  const counts: Record<LocalKind, number> = { CONTEXT: api.contexts.length, CHARACTER: api.characters.length };
  const contextNames = React.useMemo(() => new Map(api.contexts.map((c) => [c.id, c.name])), [api.contexts]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={kind} onValueChange={(v) => setKind(v as LocalKind)}>
          <TabsList className="h-10 w-full sm:w-fit">
            {LOCAL_KINDS.map((k) => (
              <TabsTrigger key={k} value={k}>
                {LOCAL_KIND_LABELS[k]}
                <span className="text-xs font-normal tabular-nums text-content-subtle">{counts[k]}</span>
              </TabsTrigger>
            ))}
            {/* Ban do can toan man hinh (cong cu ghim, camera) nen mo trang rieng thay vi nhung vao tab. */}
            <Link
              href={ROUTES.CLASS_MAP}
              className="-mb-px inline-flex h-full items-center justify-center gap-1.5 border-b-2 border-transparent px-0.5 text-sm font-medium whitespace-nowrap text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" /> Bản đồ
              <ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
            </Link>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Link href={ROUTES.TEACHING.LOCAL_TRASH} className="btn-line" aria-label="Thùng rác" title="Thùng rác">
            <Trash2 className="h-4 w-4" aria-hidden="true" /> <span className="hidden lg:inline">Thùng rác</span>
          </Link>
          <Link href={ROUTES.TEACHING.LOCAL_NEW(kind)} className="btn-crimson flex-1 sm:flex-none">
            <Plus className="h-4 w-4" aria-hidden="true" /> Soạn {LOCAL_KIND_LABELS[kind].toLowerCase()} mới
          </Link>
        </div>
      </div>

      <QueryState isLoading={api.isLoading} isError={api.isError} error={api.error} onRetry={api.refetch}>
        <ApiList key={kind} kind={kind} items={kind === "CONTEXT" ? api.contexts : api.characters} truncated={api.truncated} contextNames={contextNames} />
      </QueryState>
    </div>
  );
}

const ALL_STATES = "ALL";

function ApiList({ kind, items, truncated, contextNames }: { kind: LocalKind; items: LocalItem[]; truncated: boolean; contextNames: Map<string, string> }) {
  const myUid = useAuthStore((s) => s.user?.uid);
  // Cung nguon lop voi trang soan (useMyApiClassrooms) de ten lop khop.
  const { classes } = useMyApiClassrooms("TEACHER");
  const classNames = React.useMemo(() => new Map(classes.map((c) => [c.id, c.className])), [classes]);
  const [state, setState] = React.useState<LocalReviewState | typeof ALL_STATES>(ALL_STATES);
  const [owner, setOwner] = React.useState<Owner>("MINE");
  const [search, setSearch] = React.useState("");

  const library = useLibrary(kind).data?.totalElements;
  const mine = items.filter((c) => c.createdBy?.uid === myUid);
  const others = items.filter((c) => c.createdBy?.uid !== myUid);
  const ofOwner = owner === "MINE" ? mine : others;
  const q = normalizeText(search);
  const rows = ofOwner
    .filter((c) => (state === ALL_STATES || reviewState(c) === state) && (!q || normalizeText(c.name).includes(q)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SegmentedFilter
          variant="pills"
          label="Người soạn"
          value={owner}
          onChange={setOwner}
          options={[
            { value: "MINE", label: "Chỉ mình tôi", count: mine.length },
            { value: "OTHERS", label: "Trường của tôi", count: others.length },
            { value: "HISTORYTALK", label: "HistoryTalk", count: library },
          ]}
        />
        <div className="hidden flex-1 sm:block" />
        {owner !== "HISTORYTALK" && (
        <StaffFormSelect
          value={state}
          onValueChange={setState}
          className="w-full sm:w-44"
          options={[
            { value: ALL_STATES, label: "Mọi trạng thái" },
            ...STATES.map((s) => ({ value: s, label: `${REVIEW_STATE_LABELS[s]} (${ofOwner.filter((c) => reviewState(c) === s).length})` })),
          ]}
        />
        )}
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên..." />
      </div>

      {truncated && owner !== "HISTORYTALK" && <p className="text-xs text-content-muted">Đang hiển thị 100 mục mới nhất mỗi loại.</p>}

      {owner === "HISTORYTALK" ? (
        <HistoryTalkList kind={kind} search={search} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title={ofOwner.length ? "Không có mục phù hợp" : `Chưa có ${LOCAL_KIND_LABELS[kind].toLowerCase()} nào`}
          description={owner === "MINE" ? "Soạn nội dung mới để giao bài cho lớp." : "Giáo viên khác trong trường chưa chia sẻ nội dung nào cho toàn trường."}
        />
      ) : (
        // Cung bo cot voi bang noi dung cua Content Admin (staff/contexts, staff/characters), them cot Lop vi noi dung giao vien gan theo lop.
        <TableShell className="[&_td]:px-3 [&_th]:px-3">
          <thead>
            <tr>
              <th className={TH}>{kind === "CONTEXT" ? "Ảnh" : "Nhân vật"}</th>
              {kind === "CONTEXT" && <th className={TH}>Tiêu đề</th>}
              <th className={TH}>Trạng thái</th>
              <th className={TH}>Thao tác</th>
              <th className={TH}>Lớp</th>
              {kind === "CONTEXT" ? (
                <>
                  <th className={TH}>Thời đại</th>
                  <th className={TH}>Năm</th>
                  <th className={TH}>Địa điểm</th>
                </>
              ) : (
                <>
                  <th className={TH}>Bối cảnh</th>
                  <th className={TH}>Thời gian sống</th>
                </>
              )}
              <th className={TH}>Cập nhật</th>
              {owner === "OTHERS" && <th className={TH}>Người tạo</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const wide = c.contentScope === "SCHOOL_WIDE";
              const cls = (c.classIds ?? []).map((id) => classNames.get(id)).filter(Boolean);
              const href = ROUTES.TEACHING.LOCAL_EDIT(c.id, kind);
              const ctxNames = (c.contextIds ?? []).map((id) => contextNames.get(id)).filter(Boolean);
              const thumb = (
                <StaffImageHoverPreview
                  src={c.imageUrl}
                  alt={c.name}
                  thumbClassName={kind === "CONTEXT" ? "h-11 w-16 rounded-md border" : "h-10 w-10 rounded-full border"}
                  previewClassName={kind === "CONTEXT" ? "h-48 w-72" : "h-64 w-48"}
                  sizes="80px"
                  previewSizes="288px"
                  fallback={kind === "CONTEXT" ? <ImageIcon className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                />
              );
              return (
                <tr key={c.id} className={TR}>
                  {kind === "CONTEXT" ? (
                    <>
                      <td className={TD}>{thumb}</td>
                      <td className={TD}>
                        <Link href={href} className="block w-[190px] truncate font-semibold text-content-heading hover:text-[var(--accent-gold)]" title={c.name}>
                          {c.name}
                        </Link>
                        <p className="mt-0.5 w-[190px] truncate text-xs text-content-muted" title={c.description}>
                          {c.description || "—"}
                        </p>
                      </td>
                    </>
                  ) : (
                    <td className={TD}>
                      <div className="flex items-center gap-3">
                        {thumb}
                        <div className="w-[180px] min-w-0">
                          <Link href={href} className="block truncate font-semibold text-content-heading hover:text-[var(--accent-gold)]" title={c.name}>
                            {c.name}
                          </Link>
                          <p className="mt-0.5 truncate text-xs text-content-muted">{c.title || "—"}</p>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className={TD}>{owner === "MINE" ? <PublishToggle item={c} kind={kind} /> : <LocalReviewBadge item={c} />}</td>
                  <td className={TD}>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={href}
                        className="inline-flex h-8 items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 text-[13px] font-semibold text-content-heading transition-colors hover:border-[var(--border-strong)]"
                      >
                        {owner === "MINE" ? "Chỉnh sửa" : "Xem"}
                      </Link>
                      {owner === "MINE" && <RowMenu item={c} kind={kind} />}
                    </div>
                  </td>
                  <td className={TD}>
                    <span
                      className="inline-flex max-w-[140px] items-center gap-1.5 text-[13px] text-content-text"
                      title={wide ? "Học sinh và giáo viên cả trường đều thấy" : "Chỉ học sinh các lớp được gán thấy"}
                    >
                      {wide ? <Globe className="h-3.5 w-3.5 shrink-0 text-[var(--men-lam)]" aria-hidden="true" /> : <Lock className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />}
                      <span className="truncate">{wide ? "Toàn trường" : cls.length ? cls.join(", ") : c.classIds?.length ? "Riêng lớp" : "Chưa gán lớp"}</span>
                    </span>
                  </td>
                  {kind === "CONTEXT" ? (
                    <>
                      <td className={cn(TD, "text-[13px] text-content-text")}>{c.era ? ERA_LABEL[c.era] : "—"}</td>
                      <td className={cn(TD, "whitespace-nowrap text-[13px] tabular-nums text-content-muted")}>{localYears(c) ?? "—"}</td>
                      <td className={TD}>
                        <span className="block max-w-[120px] truncate text-[13px] text-content-muted" title={c.location ?? undefined}>{c.location || "—"}</span>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className={TD}>
                        <span className="block max-w-[170px] truncate text-[13px] text-content-text" title={ctxNames.join(", ")}>{ctxNames.length ? ctxNames.join(", ") : "—"}</span>
                      </td>
                      <td className={cn(TD, "whitespace-nowrap text-[13px] tabular-nums text-content-muted")}>{lifeYears(c) ?? "—"}</td>
                    </>
                  )}
                  <td className={cn(TD, "whitespace-nowrap text-xs tabular-nums text-content-muted")}>
                    {formatDate(c.updatedAt)}
                  </td>
                  {owner === "OTHERS" && <td className={cn(TD, "text-[13px] text-content-muted")}>{c.createdBy?.fullName ?? "—"}</td>}
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

/* ───────────────────────── HistoryTalk library ───────────────────────── */

/** Chỉ mình tôi / Trường của tôi (giáo viên khác chia sẻ toàn trường) / HistoryTalk (thư viện chính thức, chỉ xem và giao). */
type Owner = "MINE" | "OTHERS" | "HISTORYTALK";

/** Cung tham so voi o chon noi dung cua trang giao bai nen dung chung cache. */
const LIBRARY_PARAMS = { page: 1, limit: 100 };

function useLibrary(kind: LocalKind) {
  const events = useEvents(LIBRARY_PARAMS);
  const characters = useCharacters(LIBRARY_PARAMS, undefined, { enabled: kind === "CHARACTER" });
  return kind === "CONTEXT" ? events : characters;
}

const yearText = (y: number | undefined) => (y == null ? null : y < 0 ? `${-y} TCN` : String(y));

/** Official HistoryTalk contexts / characters: open them in the library, or assign them straight away. */
function HistoryTalkList({ kind, search }: { kind: LocalKind; search: string }) {
  const events = useEvents(LIBRARY_PARAMS);
  const characters = useCharacters(LIBRARY_PARAMS, undefined, { enabled: kind === "CHARACTER" });
  const query = kind === "CONTEXT" ? events : characters;
  const q = normalizeText(search);
  const rows =
    kind === "CONTEXT"
      ? (events.data?.content ?? []).map((e) => ({
          id: e.id,
          name: e.title,
          meta: [e.yearLabel ?? yearText(e.year), e.location].filter(Boolean).join(" · "),
          href: ROUTES.EVENT_DETAIL(e.id),
        }))
      : (characters.data?.content ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          meta: [c.title, c.era].filter(Boolean).join(" · "),
          href: ROUTES.CHAT(c.id),
        }));
  const shown = rows.filter((r) => !q || normalizeText(`${r.name} ${r.meta}`).includes(q));
  const assignType = kind === "CONTEXT" ? "CONTEXT_READING" : "AI_CHAT_ROLEPLAY";

  return (
    <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={() => void query.refetch()}>
      {shown.length === 0 ? (
        <EmptyState icon={BookMarked} title="Không có mục phù hợp" description="Thử từ khóa khác." />
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
          {shown.map((r) => (
            <li key={r.id} className="group relative flex items-center gap-4 py-3 pr-1 hover:bg-[var(--status-neutral-bg)]">
              <div className="min-w-0 flex-1 pl-1">
                <Link href={r.href} className="font-semibold text-content-heading after:absolute after:inset-0 group-hover:text-[var(--accent-gold)]">
                  {r.name}
                </Link>
                {r.meta && <p className="truncate text-xs text-content-muted">{r.meta}</p>}
              </div>
              <span className="hidden shrink-0 items-center gap-1.5 text-sm text-content-text sm:inline-flex" title="Mọi học sinh trên HistoryTalk đều thấy">
                <Globe className="h-3.5 w-3.5 shrink-0 text-[var(--men-lam)]" aria-hidden="true" /> Thư viện HistoryTalk
              </span>
              <Link
                href={`${ROUTES.TEACHING.ASSIGNMENT_NEW}?type=${assignType}&source=library&targetId=${encodeURIComponent(r.id)}`}
                className="relative z-10 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 text-[13px] font-semibold text-content-heading transition-colors hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
              >
                <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" /> Giao bài
              </Link>
            </li>
          ))}
        </ul>
      )}
    </QueryState>
  );
}

/**
 * Bat / tat hien thi ngay tren dong, khoi phai mo trang soan: bat = xuat ban (nhu nut "Lưu & xuất bản"), tat = an voi hoc sinh.
 * Noi dung chi danh cho lop ma chua gan lop nao thi khong bat duoc (hoc sinh khong ai thay).
 */
function PublishToggle({ item, kind }: { item: LocalItem; kind: LocalKind }) {
  const m = useLocalContentMutations();
  const update = item.type === "CONTEXT" ? m.updateContext : m.updateCharacter;
  const on = reviewState(item) === "PUBLISHED";
  const noAudience = !on && item.contentScope !== "SCHOOL_WIDE" && !item.classIds?.length;
  const busy = update.isPending || m.setStatus.isPending;

  const change = (next: boolean) => {
    const onError = (error: unknown) => toast.error(apiErrorMessage(error, next ? "Không xuất bản được. Vui lòng thử lại." : "Không ẩn được nội dung. Vui lòng thử lại."));
    if (next) {
      update.mutate(
        { id: item.id, payload: { isPublished: true } },
        { onSuccess: () => toast.success(`Đã xuất bản “${item.name}”`), onError },
      );
    } else {
      m.setStatus.mutate(
        { kind, id: item.id, payload: { status: "INACTIVE" } },
        { onSuccess: () => toast.success(`Đã ẩn “${item.name}” với học sinh`), onError },
      );
    }
  };

  return (
    <label
      className={cn("relative z-10 inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg", noAudience ? "cursor-not-allowed" : "cursor-pointer")}
      title={noAudience ? "Chưa gán lớp nào: mở trang soạn để chọn lớp trước khi xuất bản" : on ? "Học sinh đang thấy. Tắt để ẩn" : "Bật để học sinh thấy"}
    >
      <Switch
        checked={on}
        onCheckedChange={change}
        disabled={busy || noAudience}
        aria-label={`Hiển thị “${item.name}” với học sinh`}
        className="h-5 w-9 data-[state=checked]:bg-[var(--status-success)] data-[state=unchecked]:bg-[var(--border-strong)]"
      />
      <span className={cn("text-[13px]", on ? "font-medium text-[var(--status-success)]" : "text-content-muted")}>
        {busy ? "Đang lưu..." : REVIEW_STATE_LABELS[reviewState(item)]}
      </span>
    </label>
  );
}

/** Thao tac phu cua mot dong (chia se toan truong / thoi chia se) gom vao menu "…". */
function RowMenu({ item, kind }: { item: LocalItem; kind: LocalKind }) {
  const m = useLocalContentMutations();
  const update = item.type === "CONTEXT" ? m.updateContext : m.updateCharacter;
  const wide = item.contentScope === "SCHOOL_WIDE";

  const toggle = () =>
    update.mutate(
      { id: item.id, payload: { contentScope: wide ? "CLASS_ONLY" : "SCHOOL_WIDE" } },
      {
        onSuccess: () => toast.success(wide ? `Đã thôi chia sẻ “${item.name}”` : `Đã chia sẻ “${item.name}” toàn trường`),
        onError: (error) => toast.error(apiErrorMessage(error, "Không đổi được phạm vi chia sẻ. Vui lòng thử lại.")),
      },
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-sm text-content-muted hover:bg-[var(--bg-elevated)] hover:text-content-heading"
          aria-label={`Thao tác với ${item.name}`}
          disabled={update.isPending}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={ROUTES.TEACHING.LOCAL_EDIT(item.id, kind)}>
            <Pencil className="h-4 w-4" aria-hidden="true" /> Chỉnh sửa
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={toggle}>
          {wide ? <Lock className="h-4 w-4" aria-hidden="true" /> : <Globe className="h-4 w-4" aria-hidden="true" />}
          {wide ? "Thôi chia sẻ toàn trường" : "Chia sẻ toàn trường"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

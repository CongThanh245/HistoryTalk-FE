"use client";

// Bối cảnh & nhân vật: API Sprint 6 (local-contents). BE chưa có API câu đố do giáo viên soạn nên màn này không có mục câu đố.
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BookMarked, Globe, Lock, Map as MapIcon, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaasShell, SearchInput, formatDate, normalizeText } from "@/components/saas/saas-ui";
import { LocalReviewBadge, QueryState, REVIEW_STATE_LABELS, localMeta, reviewState, type LocalReviewState } from "@/components/saas/local-content-ui";
import { SegmentedFilter } from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage, useMyApiClassrooms } from "@/features/saas/hooks-api";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { LOCAL_KINDS, useLocalContentMutations, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import { LOCAL_KIND_LABELS } from "@/features/saas/hooks-teaching";
import type { LocalItem, LocalKind } from "@/services/local-content.service";
import { useAuthStore } from "@/store/auth.store";

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
      title="Kho tư liệu"
      description="Soạn bối cảnh và nhân vật cho lớp. Bản nháp chỉ bạn thấy; xuất bản rồi mới giao bài được."
    >
      <LocalHistory kind={kind} setKind={setKind} />
    </SaasShell>
  );
}

function LocalHistory({ kind, setKind }: { kind: LocalKind; setKind: (k: LocalKind) => void }) {
  const api = useTeacherLocalContent();
  const counts: Record<LocalKind, number> = { CONTEXT: api.contexts.length, CHARACTER: api.characters.length };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={kind} onValueChange={(v) => setKind(v as LocalKind)}>
          <TabsList className="h-10 w-full sm:w-fit">
            {LOCAL_KINDS.map((k) => (
              <TabsTrigger key={k} value={k} className="px-4">
                {LOCAL_KIND_LABELS[k]}
                <span className="tabular-nums opacity-70">{counts[k]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Link href={ROUTES.TEACHING.LOCAL_NEW(kind)} className="btn-crimson">
          <Plus className="h-4 w-4" aria-hidden="true" /> Soạn {LOCAL_KIND_LABELS[kind].toLowerCase()} mới
        </Link>
      </div>

      <QueryState isLoading={api.isLoading} isError={api.isError} error={api.error} onRetry={api.refetch}>
        <ApiList key={kind} kind={kind} items={kind === "CONTEXT" ? api.contexts : api.characters} truncated={api.truncated} />
      </QueryState>
    </div>
  );
}

const ALL_STATES = "ALL";

function ApiList({ kind, items, truncated }: { kind: LocalKind; items: LocalItem[]; truncated: boolean }) {
  const myUid = useAuthStore((s) => s.user?.uid);
  // Cung nguon lop voi trang soan (useMyApiClassrooms) de ten lop khop.
  const { classes } = useMyApiClassrooms("TEACHER");
  const classNames = React.useMemo(() => new Map(classes.map((c) => [c.id, c.className])), [classes]);
  const [state, setState] = React.useState<LocalReviewState | typeof ALL_STATES>(ALL_STATES);
  const [owner, setOwner] = React.useState<"MINE" | "OTHERS">("MINE");
  const [search, setSearch] = React.useState("");

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
          label="Người soạn"
          value={owner}
          onChange={setOwner}
          options={[
            { value: "MINE", label: "Của tôi", count: mine.length },
            { value: "OTHERS", label: "Đồng nghiệp chia sẻ", count: others.length },
          ]}
        />
        <div className="hidden flex-1 sm:block" />
        <StaffFormSelect
          value={state}
          onValueChange={setState}
          className="w-full sm:w-44"
          options={[
            { value: ALL_STATES, label: "Mọi trạng thái" },
            ...STATES.map((s) => ({ value: s, label: `${REVIEW_STATE_LABELS[s]} (${ofOwner.filter((c) => reviewState(c) === s).length})` })),
          ]}
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên..." />
      </div>

      {truncated && <p className="text-xs text-content-muted">Đang hiển thị 100 mục mới nhất mỗi loại.</p>}

      {rows.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title={ofOwner.length ? "Không có mục phù hợp" : `Chưa có ${LOCAL_KIND_LABELS[kind].toLowerCase()} nào`}
          description={owner === "MINE" ? "Soạn nội dung mới rồi xuất bản để giao bài cho lớp." : "Đồng nghiệp chưa chia sẻ nội dung nào cho toàn trường."}
        />
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
          {rows.map((c) => {
            const wide = c.contentScope === "SCHOOL_WIDE";
            const cls = (c.classIds ?? []).map((id) => classNames.get(id)).filter(Boolean);
            const st = reviewState(c);
            return (
              <li key={c.id} className="group relative flex items-center gap-4 py-3 pr-1 hover:bg-[var(--status-neutral-bg)]">
                <div className="min-w-0 flex-1 pl-1">
                  <Link
                    href={ROUTES.TEACHING.LOCAL_EDIT(c.id, kind)}
                    className="font-semibold text-content-heading after:absolute after:inset-0 group-hover:text-[var(--accent-gold)]"
                  >
                    {c.name}
                  </Link>
                  <p className="truncate text-xs text-content-muted">
                    {localMeta(c)}
                    {owner === "OTHERS" && c.createdBy?.fullName ? ` · ${c.createdBy.fullName}` : ""}
                  </p>
                </div>
                {st !== "PUBLISHED" && <LocalReviewBadge item={c} />}
                <span
                  className="hidden w-44 shrink-0 items-center gap-1.5 truncate text-xs text-content-muted sm:inline-flex"
                  title={wide ? "Học sinh và giáo viên cả trường đều thấy" : "Chỉ học sinh các lớp được gán thấy"}
                >
                  {wide ? <Globe className="h-3.5 w-3.5 shrink-0 text-[var(--men-lam)]" aria-hidden="true" /> : <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                  {wide ? "Toàn trường" : cls.length ? `Lớp ${cls.join(", ")}` : c.classIds?.length ? "Riêng lớp" : "Chưa gán lớp"}
                </span>
                <span className="hidden w-20 shrink-0 text-right text-xs tabular-nums text-content-muted md:block">{formatDate(c.updatedAt)}</span>
                {owner === "MINE" ? <RowMenu item={c} kind={kind} /> : <span className="w-8 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}

      <p className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-xs">
        <Link href={ROUTES.CLASS_MAP} className="archive-link text-content-muted">
          <MapIcon className="h-3.5 w-3.5" aria-hidden="true" /> Xem trên bản đồ
        </Link>
        <Link href={ROUTES.TEACHING.LOCAL_TRASH} className="archive-link text-content-muted">
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Thùng rác
        </Link>
      </p>
    </div>
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
          className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-[2px] text-content-muted hover:bg-[var(--bg-elevated)] hover:text-content-heading"
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

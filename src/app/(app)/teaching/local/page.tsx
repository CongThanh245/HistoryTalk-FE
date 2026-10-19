"use client";

// Bối cảnh & nhân vật: API Sprint 6 (local-contents). BE chưa có API câu đố do giáo viên soạn nên màn này không có mục câu đố.
import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookMarked, Plus } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaasShell, SearchInput, formatDate, normalizeText } from "@/components/saas/saas-ui";
import { LocalReviewBadge, LocalScopeTag, QueryState, REVIEW_STATE_LABELS, localMeta, reviewState, type LocalReviewState } from "@/components/saas/local-content-ui";
import { SegmentedFilter } from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import { LOCAL_KINDS, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import { LOCAL_KIND_LABELS } from "@/features/saas/hooks-teaching";
import type { LocalItem, LocalKind } from "@/services/local-content.service";
import { useAuthStore } from "@/store/auth.store";

const STATES: LocalReviewState[] = ["DRAFT", "PUBLISHED", "HIDDEN"];

/**
 * Tư liệu lớp & trường (Role Matrix rows 12–14): the teacher's own contexts / characters and colleagues'
 * school-wide ones. Teachers publish their own content; the School Admin only oversees it.
 */
export default function LocalHistoryPage() {
  const [kind, setKind] = React.useState<LocalKind>("CONTEXT");
  return (
    <SaasShell
      variant="app"
      live
      title="Tư liệu lớp & trường"
      description="Soạn bối cảnh và nhân vật lịch sử như Thư viện HistoryTalk, dùng cho lớp hoặc toàn trường. Bạn tự xuất bản, học sinh thấy ngay mà không cần chờ duyệt."
    >
      <LocalHistory kind={kind} setKind={setKind} />
    </SaasShell>
  );
}

function LocalHistory({ kind, setKind }: { kind: LocalKind; setKind: (k: LocalKind) => void }) {
  const api = useTeacherLocalContent();
  const counts: Record<LocalKind, number> = { CONTEXT: api.contexts.length, CHARACTER: api.characters.length };

  return (
    <div className="space-y-5">
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

function ApiList({ kind, items, truncated }: { kind: LocalKind; items: LocalItem[]; truncated: boolean }) {
  const myUid = useAuthStore((s) => s.user?.uid);
  const [state, setState] = React.useState<LocalReviewState | "ALL">("ALL");
  const [owner, setOwner] = React.useState<"MINE" | "OTHERS">("MINE");
  const [search, setSearch] = React.useState("");

  const ofOwner = items.filter((c) => (owner === "MINE") === (c.createdBy?.uid === myUid));
  const q = normalizeText(search);
  const rows = ofOwner
    .filter((c) => (state === "ALL" || reviewState(c) === state) && (!q || normalizeText(c.name).includes(q)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedFilter
          label="Lọc theo trạng thái"
          value={state}
          onChange={setState}
          options={[
            { value: "ALL" as const, label: "Tất cả", count: ofOwner.length },
            ...STATES.map((s) => ({ value: s, label: REVIEW_STATE_LABELS[s], count: ofOwner.filter((c) => reviewState(c) === s).length })),
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <SegmentedFilter
            label="Người soạn"
            value={owner}
            onChange={setOwner}
            options={[
              { value: "MINE", label: "Tôi soạn" },
              { value: "OTHERS", label: "Đồng nghiệp (toàn trường)" },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên..." />
        </div>
      </div>

      {truncated && <p className="text-xs text-content-muted">Đang hiển thị 100 mục mới nhất mỗi loại.</p>}

      {rows.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title={`Chưa có ${LOCAL_KIND_LABELS[kind].toLowerCase()} nào`}
          description={
            owner === "MINE"
              ? "Soạn nội dung mới rồi xuất bản để học sinh thấy."
              : "Đồng nghiệp chưa chia sẻ nội dung nào cho toàn trường."
          }
          action={
            owner === "MINE" ? (
              <Link href={ROUTES.TEACHING.LOCAL_NEW(kind)} className="btn-ink">
                Soạn mới
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
          {rows.map((c) => (
            <li key={c.id} className="py-3">
              <Link href={ROUTES.TEACHING.LOCAL_EDIT(c.id, kind)} className="group flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <LocalScopeTag item={c} />
                    <LocalReviewBadge item={c} />
                    <span className="text-xs text-content-muted">Cập nhật {formatDate(c.updatedAt)}</span>
                  </div>
                  <p className="mt-1 font-semibold text-content-heading group-hover:text-[var(--accent-gold)]">{c.name}</p>
                  <p className="text-xs text-content-muted">{localMeta(c)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                  {owner === "OTHERS" && <span className="text-xs text-content-muted">{c.createdBy?.fullName ?? "Đồng nghiệp"}</span>}
                  <span className="archive-link">
                    {owner === "MINE" ? "Chỉnh sửa" : "Xem"} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

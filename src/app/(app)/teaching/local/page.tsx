"use client";

// Bối cảnh & nhân vật: API Sprint 6 (local-contents). Câu đố vẫn chạy dữ liệu mẫu (src/features/saas/store.ts) — BE chưa có API.
import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookMarked, MessageSquareWarning, Plus } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaasShell, SearchInput, formatDate, normalizeText } from "@/components/saas/saas-ui";
import { ContentSourceTag } from "@/components/saas/content-source-tag";
import { LocalReviewBadge, LocalScopeTag, QueryState, REVIEW_STATE_LABELS, localMeta, reviewState, type LocalReviewState } from "@/components/saas/local-content-ui";
import { LocalStatusBadge, SegmentedFilter } from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import { LEVEL_LABELS, LOCAL_KIND_LABELS, LOCAL_STATUS_LABELS, useTeachingData } from "@/features/saas/hooks-teaching";
import type { LocalContentKind, LocalContentStatus, LocalQuiz } from "@/features/saas/types";
import type { LocalItem, LocalKind } from "@/services/local-content.service";
import { useAuthStore } from "@/store/auth.store";

const KINDS: LocalContentKind[] = ["CONTEXT", "CHARACTER", "QUIZ"];
const STATES: LocalReviewState[] = ["PENDING", "PUBLISHED", "HIDDEN"];

/**
 * Tư liệu lớp & trường (Role Matrix rows 12–14): the teacher's own contexts / characters and colleagues'
 * school-wide ones. Everything starts as a draft the School Admin publishes.
 */
export default function LocalHistoryPage() {
  const [kind, setKind] = React.useState<LocalContentKind>("CONTEXT");
  return (
    <SaasShell
      variant="app"
      live={kind !== "QUIZ"}
      title="Tư liệu lớp & trường"
      description="Soạn bối cảnh và nhân vật lịch sử địa phương. Quản trị trường duyệt trước khi học sinh thấy. Tách biệt với nội dung chính thức của HistoryTalk."
    >
      <LocalHistory kind={kind} setKind={setKind} />
    </SaasShell>
  );
}

function LocalHistory({ kind, setKind }: { kind: LocalContentKind; setKind: (k: LocalContentKind) => void }) {
  const api = useTeacherLocalContent();
  const role = useRole();
  const quizzes = useTeachingData(role).localContent.filter((c): c is LocalQuiz => c.kind === "QUIZ");
  const counts: Record<LocalContentKind, number> = { CONTEXT: api.contexts.length, CHARACTER: api.characters.length, QUIZ: quizzes.length };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={kind} onValueChange={(v) => setKind(v as LocalContentKind)}>
          <TabsList className="h-10 w-full sm:w-fit">
            {KINDS.map((k) => (
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

      {kind === "QUIZ" ? (
        <MockQuizList quizzes={quizzes} />
      ) : (
        <QueryState isLoading={api.isLoading} isError={api.isError} error={api.error} onRetry={api.refetch}>
          <ApiList key={kind} kind={kind} items={kind === "CONTEXT" ? api.contexts : api.characters} truncated={api.truncated} />
        </QueryState>
      )}
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
              ? "Soạn nội dung mới rồi chờ quản trị trường duyệt để học sinh thấy."
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

/* ───────────── Câu đố: dữ liệu mẫu (chưa có API) ───────────── */

const QUIZ_STATUSES: LocalContentStatus[] = ["DRAFT", "PENDING", "PUBLISHED", "INACTIVE", "TRASH"];

function MockQuizList({ quizzes }: { quizzes: LocalQuiz[] }) {
  const [status, setStatus] = React.useState<LocalContentStatus | "ALL">("ALL");
  const [search, setSearch] = React.useState("");
  const q = normalizeText(search);
  const rows = quizzes
    .filter((c) => (status === "ALL" || c.status === status) && (!q || normalizeText(c.title).includes(q)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedFilter
          label="Lọc theo trạng thái"
          value={status}
          onChange={setStatus}
          options={[
            { value: "ALL" as const, label: "Tất cả", count: quizzes.length },
            ...QUIZ_STATUSES.map((s) => ({ value: s, label: LOCAL_STATUS_LABELS[s], count: quizzes.filter((c) => c.status === s).length })),
          ]}
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên..." />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={BookMarked} title="Chưa có câu đố nào" />
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
          {rows.map((item) => (
            <li key={item.id} className="py-3">
              <Link href={ROUTES.TEACHING.LOCAL_EDIT(item.id)} className="group flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ContentSourceTag source={item.scope} />
                    <LocalStatusBadge status={item.status} />
                    <span className="text-xs text-content-muted">Cập nhật {formatDate(item.updatedAt)}</span>
                  </div>
                  <p className="mt-1 font-semibold text-content-heading group-hover:text-[var(--accent-gold)]">{item.title}</p>
                  <p className="text-xs text-content-muted">
                    {item.questions.length} câu · {item.durationMinutes} phút · {LEVEL_LABELS[item.level]}
                  </p>
                  {item.reviewNote && (
                    <p className="mt-2 flex items-start gap-2 rounded-[2px] border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)]">
                      <MessageSquareWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
                      <span>
                        <span className="font-bold">Quản trị trường:</span> {item.reviewNote}
                      </span>
                    </p>
                  )}
                </div>
                <span className="archive-link shrink-0">
                  {item.status === "DRAFT" ? "Chỉnh sửa" : "Xem"} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

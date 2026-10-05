"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, BookMarked, MessageSquareWarning, Plus } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaasShell, SearchInput, formatDate, normalizeText } from "@/components/saas/saas-ui";
import { LocalStatusBadge, SegmentedFilter } from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import {
  LEVEL_LABELS,
  LOCAL_KIND_LABELS,
  LOCAL_STATUS_LABELS,
  formatYear,
  localTitle,
  useTeachingData,
} from "@/features/saas/hooks-teaching";
import type { LocalContent, LocalContentKind, LocalContentStatus } from "@/features/saas/types";

const KINDS: LocalContentKind[] = ["CONTEXT", "CHARACTER", "QUIZ"];
const STATUSES: LocalContentStatus[] = ["DRAFT", "PENDING", "PUBLISHED", "INACTIVE", "TRASH"];

/** Lịch sử địa phương: the teacher drafts, School Admin reviews (Role Matrix rows 12–14). */
export default function LocalHistoryPage() {
  return (
    <SaasShell
      variant="app"
      title="Lịch sử địa phương"
      description="Soạn bối cảnh, nhân vật và câu đố về lịch sử địa phương. Quản trị trường duyệt trước khi học sinh nhìn thấy."
    >
      <LocalHistory />
    </SaasShell>
  );
}

function LocalHistory() {
  const role = useRole();
  const data = useTeachingData(role);
  const [kind, setKind] = React.useState<LocalContentKind>("CONTEXT");
  const [status, setStatus] = React.useState<LocalContentStatus | "ALL">("ALL");
  const [scope, setScope] = React.useState<"MINE" | "CLASSES">("MINE");
  const [search, setSearch] = React.useState("");

  const inScope = data.localContent.filter((c) => (scope === "MINE" ? c.authorId === data.teacherId : c.authorId !== data.teacherId));
  const ofKind = inScope.filter((c) => c.kind === kind);
  const q = normalizeText(search);
  const rows = ofKind
    .filter((c) => (status === "ALL" || c.status === status) && (!q || normalizeText(localTitle(c)).includes(q)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={kind} onValueChange={(v) => setKind(v as LocalContentKind)}>
          <TabsList className="h-10 w-full sm:w-fit">
            {KINDS.map((k) => (
              <TabsTrigger key={k} value={k} className="px-4">
                {LOCAL_KIND_LABELS[k]}
                <span className="tabular-nums opacity-70">{inScope.filter((c) => c.kind === k).length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Link href={ROUTES.TEACHING.LOCAL_NEW(kind)} className="btn-crimson">
          <Plus className="h-4 w-4" aria-hidden="true" /> Soạn {LOCAL_KIND_LABELS[kind].toLowerCase()} mới
        </Link>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedFilter
          label="Lọc theo trạng thái"
          value={status}
          onChange={setStatus}
          options={[
            { value: "ALL" as const, label: "Tất cả", count: ofKind.length },
            ...STATUSES.map((s) => ({ value: s, label: LOCAL_STATUS_LABELS[s], count: ofKind.filter((c) => c.status === s).length })),
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SegmentedFilter
            label="Phạm vi"
            value={scope}
            onChange={setScope}
            options={[
              { value: "MINE", label: "Tôi soạn" },
              { value: "CLASSES", label: "Đồng nghiệp · lớp tôi" },
            ]}
          />
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên..." />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title={`Chưa có ${LOCAL_KIND_LABELS[kind].toLowerCase()} nào`}
          description={scope === "MINE" ? "Soạn nội dung mới rồi gửi quản trị trường duyệt." : "Đồng nghiệp chưa chia sẻ nội dung nào cho lớp của bạn."}
          action={
            scope === "MINE" ? (
              <Link href={ROUTES.TEACHING.LOCAL_NEW(kind)} className="btn-ink">
                Soạn mới
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
          {rows.map((c) => (
            <LocalRow key={c.id} item={c} classNames={c.classIds.map((id) => data.classById.get(id)?.name).filter(Boolean) as string[]} />
          ))}
        </ul>
      )}
    </div>
  );
}

function LocalRow({ item, classNames }: { item: LocalContent; classNames: string[] }) {
  const meta =
    item.kind === "CONTEXT"
      ? `${item.location} · ${formatYear(item.year)}`
      : item.kind === "CHARACTER"
        ? `${item.title}${item.bornYear != null ? ` · ${formatYear(item.bornYear)}–${formatYear(item.deathYear)}` : ""}`
        : `${item.questions.length} câu · ${item.durationMinutes} phút · ${LEVEL_LABELS[item.level]}`;
  return (
    <li className="py-3">
      <Link href={ROUTES.TEACHING.LOCAL_EDIT(item.id)} className="group flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <LocalStatusBadge status={item.status} />
            <span className="text-xs text-content-muted">Cập nhật {formatDate(item.updatedAt)}</span>
          </div>
          <p className="mt-1 font-semibold text-content-heading group-hover:text-[var(--accent-gold)]">{localTitle(item)}</p>
          <p className="text-xs text-content-muted">{meta}</p>
          {item.reviewNote && (
            <p className="mt-2 flex items-start gap-2 rounded-[2px] border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)]">
              <MessageSquareWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
              <span>
                <span className="font-bold">Quản trị trường:</span> {item.reviewNote}
              </span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
          <span className="text-xs text-content-muted">{classNames.length ? classNames.map((n) => `Lớp ${n}`).join(", ") : "Chưa chọn lớp"}</span>
          <span className="archive-link">
            {item.status === "DRAFT" ? "Chỉnh sửa" : "Xem"} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </li>
  );
}

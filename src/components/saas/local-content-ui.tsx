"use client";

import * as React from "react";
import { AlertTriangle, Loader2, Map as MapIcon, MessageSquareText } from "lucide-react";

import { BattlePreview } from "@/components/historical-map/BattlePreview";
import { isBattleMap } from "@/components/historical-map/battle-map.types";

import { ContentSourceTag } from "@/components/saas/content-source-tag";
import { LOCAL_ERA_OPTIONS } from "@/features/saas/hooks-teaching";
import { LOCAL_SCOPE_LABEL, localYears, scopeSource } from "@/features/saas/hooks-local-content";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import { isHidden, type LocalCategory, type LocalItem } from "@/services/local-content.service";
import { cn } from "@/lib/utils/cn";

/* Shared bits for the API-backed local content screens (Sprint 6). */

const PILL = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2 py-0.5 text-[11px] font-bold";
const SUCCESS = "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]";
const DANGER = "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]";
const NEUTRAL = "border-[var(--border-strong)] bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]";

/**
 * DRAFT = not published yet (or sent back), PUBLISHED = ACTIVE, HIDDEN = INACTIVE. Teachers publish their own content,
 * so rows still PENDING_REVIEW from the old approval flow count as drafts.
 */
export type LocalReviewState = "DRAFT" | "PUBLISHED" | "HIDDEN";

export const reviewState = (item: LocalItem): LocalReviewState => {
  if (item.isPublished || item.status === "ACTIVE") return "PUBLISHED";
  return isHidden(item) ? "HIDDEN" : "DRAFT";
};

export const REVIEW_STATE_LABELS: Record<LocalReviewState, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Đã xuất bản",
  HIDDEN: "Đã ẩn",
};

const REVIEW_STATE_CLASS: Record<LocalReviewState, string> = { DRAFT: NEUTRAL, PUBLISHED: SUCCESS, HIDDEN: DANGER };

export function LocalReviewBadge({ item }: { item: LocalItem }) {
  const state = reviewState(item);
  return <span className={cn(PILL, REVIEW_STATE_CLASS[state])}>{REVIEW_STATE_LABELS[state]}</span>;
}

/** School Admin note from the last status change, if any. */
export function ReviewNote({ item, className }: { item: Pick<LocalItem, "reviewNote" | "approvedBy">; className?: string }) {
  if (!item.reviewNote?.trim()) return null;
  return (
    <div className={cn("flex items-start gap-2 rounded-[2px] border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-3 text-sm", className)}>
      <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
      <div className="min-w-0 space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--status-warning)]">Ghi chú của quản trị trường</p>
        <p className="whitespace-pre-line break-words text-content-text">{item.reviewNote}</p>
      </div>
    </div>
  );
}

/** `label`: ghi de nhan khi nguoi xem khong phai tac gia (vd. school admin: "Riêng lớp 10A1" thay "Riêng tôi"). */
export function LocalScopeTag({ item, label }: { item: Pick<LocalItem, "contentScope">; label?: string }) {
  return <ContentSourceTag source={scopeSource(item.contentScope)} label={label ?? LOCAL_SCOPE_LABEL[item.contentScope]} />;
}

export const ERA_LABEL = Object.fromEntries(LOCAL_ERA_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;

export const CATEGORY_LABEL: Record<LocalCategory, string> = {
  WAR: "Chiến tranh",
  POLITICS: "Chính trị",
  CULTURE: "Văn hóa",
  SCIENCE: "Khoa học",
  RELIGION: "Tôn giáo",
  OTHER: "Khác",
};

/** Character life span, e.g. "14 – 43" or "? – 43 TCN". */
export function lifeYears(item: Pick<LocalItem, "bornYear" | "isBornBc" | "deathYear" | "isDeathBc">) {
  if (item.bornYear == null && item.deathYear == null) return null;
  const fmt = (y: number | null | undefined, bc: boolean | null | undefined) => (y == null ? "?" : bc ? `${y} TCN` : String(y));
  return `${fmt(item.bornYear, item.isBornBc)} – ${fmt(item.deathYear, item.isDeathBc)}`;
}

/** One-line summary under a title: "Cổ đại · 40 – 43 · Mê Linh" or the character's title. */
export function localMeta(item: LocalItem) {
  if (item.type === "CHARACTER") return item.title || "Nhân vật";
  return [item.era ? ERA_LABEL[item.era] : null, localYears(item), item.location].filter(Boolean).join(" · ") || "Bối cảnh";
}

export function QueryState({
  isLoading,
  isError,
  error,
  onRetry,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-sm text-content-muted">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-gold)]" aria-hidden="true" />
        Đang tải dữ liệu...
      </div>
    );
  }
  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center text-sm">
        <AlertTriangle className="h-6 w-6 text-[var(--accent-danger)]" aria-hidden="true" />
        <p className="text-content-text">{apiErrorMessage(error, "Không tải được dữ liệu. Vui lòng thử lại.")}</p>
        <button type="button" className="btn-line" onClick={onRetry}>
          Thử lại
        </button>
      </div>
    );
  }
  return <>{children}</>;
}

function Meta({ items }: { items: [string, React.ReactNode][] }) {
  const shown = items.filter(([, v]) => v != null && v !== "");
  if (!shown.length) return null;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-y border-[var(--border-default)] py-3 text-sm">
      {shown.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-content-muted">{k}</dt>
          <dd className="min-w-0 break-words font-medium text-content-heading">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{title}</h4>
      <div className="whitespace-pre-line text-sm leading-relaxed text-content-text">{children}</div>
    </div>
  );
}

/** Read-only body of a context / character (School Admin drawer, student view). */
export function LocalItemPreview({ item }: { item: LocalItem }) {
  const link = (url: string | null | undefined) =>
    url ? (
      <a href={url} target="_blank" rel="noreferrer" className="archive-link break-all">
        {url}
      </a>
    ) : null;
  return (
    <div className="space-y-4">
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- teacher-provided URL of any host
        <img src={item.imageUrl} alt="" className="max-h-64 w-full rounded-[2px] border border-[var(--border-default)] object-cover" />
      )}
      {item.type === "CONTEXT" ? (
        <>
          <Meta
            items={[
              ["Thời kỳ", item.era ? ERA_LABEL[item.era] : null],
              ["Chủ đề", item.category ? CATEGORY_LABEL[item.category] : null],
              ["Năm", localYears(item)],
              ["Địa điểm", item.location],
              ["Tọa độ", item.latitude != null && item.longitude != null ? `${item.latitude}, ${item.longitude}` : null],
              ["Video", link(item.videoUrl)],
            ]}
          />
          <Block title="Nội dung">{item.description}</Block>
          <BattleMapBlock item={item} />
        </>
      ) : (
        <>
          <Meta items={[["Danh hiệu", item.title], ["Năm sinh – năm mất", lifeYears(item)], ["Mô hình 3D", link(item.modelUrl)]]} />
          <Block title="Tiểu sử">{item.description}</Block>
          {item.personality && <Block title="Tính cách khi trò chuyện với AI">{item.personality}</Block>}
        </>
      )}
    </div>
  );
}

/** Battle map of a local context: thumbnail + full-screen playback (same player as the official battles). */
function BattleMapBlock({ item }: { item: LocalItem }) {
  const [open, setOpen] = React.useState(false);
  const map = isBattleMap(item.battleMap) ? item.battleMap : null;
  if (!map?.imageUrl) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Lược đồ trận đánh</h4>
      {/* eslint-disable-next-line @next/next/no-img-element -- uploaded battle map image */}
      <img src={map.imageUrl} alt={`Lược đồ ${item.name}`} className="max-h-56 w-full rounded-[2px] border border-[var(--border-default)] object-cover" />
      <button type="button" className="btn-ink" onClick={() => setOpen(true)}>
        <MapIcon className="h-4 w-4" aria-hidden="true" /> Xem diễn biến trận đánh
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] overflow-auto bg-[var(--bg-main)]">
          <BattlePreview value={map} title={item.name} legacyNarration={item.description ?? ""} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

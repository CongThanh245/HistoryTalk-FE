"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Link2, Loader2, Map as MapIcon, Plus, Trash2, Unlink } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { BattleMapEditor } from "@/components/historical-map/BattleMapEditor";
import { ContextMapFocusManager } from "@/components/staff/context-map-focus-manager";
import { emptyBattleMap, isBattleMap } from "@/components/historical-map/battle-map.types";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { Field, IconAction, Panel, SectionHeading, formatDate } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import {
  useCharacterContextLinks,
  useCharacterContexts,
  useContextQuizzes,
  useLocalContentMutations,
  useTeacherLocalContent,
} from "@/features/saas/hooks-local-content";
import { LEVEL_LABELS } from "@/features/saas/hooks-teaching";
import type { LocalItem } from "@/services/local-content.service";
import { cn } from "@/lib/utils/cn";

/* Sprint 7 additions to the teacher's local content editor: context links, battle map and quizzes. */

/* ───────────────────────── Character ↔ contexts ───────────────────────── */

/**
 * A saved character can join several contexts (POST/DELETE .../characters/{id}/contexts/{contextId}). The picker lists
 * the teacher's own contexts and colleagues' school-wide ones; the API also accepts official HistoryTalk contexts.
 */
export function LinkedContextsPanel({ characterId, canEdit }: { characterId: string; canEdit: boolean }) {
  const linked = useCharacterContexts(characterId);
  const { contexts } = useTeacherLocalContent(canEdit);
  const { link, unlink } = useCharacterContextLinks(characterId);
  const [pick, setPick] = React.useState("");

  const linkedIds = new Set((linked.data ?? []).map((c) => c.id));
  const options = contexts.filter((c) => !linkedIds.has(c.id)).map((c) => ({ value: c.id, label: c.name }));

  const add = () => {
    if (!pick) return;
    const name = contexts.find((c) => c.id === pick)?.name ?? "bối cảnh";
    link.mutate(pick, {
      onSuccess: () => {
        setPick("");
        toast.success(`Đã liên kết với “${name}”`);
      },
      onError: (e) => toast.error(apiErrorMessage(e, "Không liên kết được bối cảnh.")),
    });
  };

  return (
    <Panel>
      <SectionHeading
        title="Bối cảnh liên kết"
        description="Nhân vật xuất hiện trong các bối cảnh này. Học sinh chọn bối cảnh để trò chuyện với nhân vật trong đúng sự kiện."
      />
      {linked.isPending ? (
        <p className="text-sm text-content-muted">Đang tải...</p>
      ) : linked.isError ? (
        <p className="text-sm text-[var(--accent-danger)]">{apiErrorMessage(linked.error, "Không tải được bối cảnh liên kết.")}</p>
      ) : (linked.data ?? []).length === 0 ? (
        <p className="text-sm text-content-muted">Chưa liên kết bối cảnh nào.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-strong)]">
          {(linked.data ?? []).map((c) => (
            <li key={c.id} className="flex items-center gap-3 py-2.5">
              <Link2 className="h-4 w-4 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-content-heading">{c.name}</span>
              {c.year != null && <span className="text-xs tabular-nums text-content-muted">{c.year}</span>}
              {canEdit && (
                <IconAction
                  label={`Bỏ liên kết ${c.name}`}
                  tone="danger"
                  onClick={() =>
                    unlink.mutate(c.id, {
                      onSuccess: () => toast.success(`Đã bỏ liên kết “${c.name}”`),
                      onError: (e) => toast.error(apiErrorMessage(e, "Không bỏ liên kết được.")),
                    })
                  }
                >
                  <Unlink className="h-4 w-4" />
                </IconAction>
              )}
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field label="Thêm bối cảnh" className="flex-1">
            <StaffFormSelect
              value={pick}
              onValueChange={setPick}
              placeholder={options.length ? "Chọn bối cảnh" : "Không còn bối cảnh nào để thêm"}
              options={options}
              disabled={!options.length}
              className="w-full"
            />
          </Field>
          <button type="button" className="btn-ink disabled:opacity-60" disabled={!pick || link.isPending} onClick={add}>
            {link.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />} Liên kết
          </button>
        </div>
      )}
    </Panel>
  );
}

/* ───────────────────────── Map: pins & camera focuses ───────────────────────── */

/**
 * Same as the Content Admin context "Bản đồ" tab: camera focuses of the context (/historical-contexts/{id}/map-focuses,
 * open to teachers of the school). Pins are placed on the Kho tư liệu map, like Content Admins do on the battle map.
 */
export function LocalMapPanel({ item }: { item: LocalItem }) {
  return (
    <div className="space-y-4">
      <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-content-heading">Ghim trên bản đồ</p>
          <p className="text-xs text-content-muted">
            Bản đồ Kho tư liệu mở sẵn “{item.name}”: đặt ghim, kể diễn biến và soạn lược đồ giống bản đồ trận đánh của HistoryTalk. Học sinh
            của trường thấy ghim khi bối cảnh đã xuất bản.
          </p>
        </div>
        <Link href={`${ROUTES.CLASS_MAP}?battle=${item.id}`} className="btn-crimson shrink-0">
          <MapIcon className="h-4 w-4" aria-hidden="true" /> Mở bản đồ
        </Link>
      </Panel>
      <Panel>
        <ContextMapFocusManager contextId={item.id} />
      </Panel>
    </div>
  );
}

/* ───────────────────────── Battle map ───────────────────────── */

/** Battle map of a local context, edited with the same editor Content Admin uses for official events. */
export function LocalBattleMapPanel({ item, canEdit }: { item: LocalItem; canEdit: boolean }) {
  const { updateContext } = useLocalContentMutations();
  const [editing, setEditing] = React.useState(false);
  const [clearOpen, setClearOpen] = React.useState(false);
  const map = isBattleMap(item.battleMap) ? item.battleMap : null;
  const hasMap = !!map?.imageUrl;

  const save = async (value: NonNullable<LocalItem["battleMap"]> | null) => {
    await updateContext.mutateAsync({ id: item.id, payload: { battleMap: value } });
  };

  return (
    <Panel>
      <SectionHeading
        title="Lược đồ trận đánh"
        description="Ảnh lược đồ kèm phe, ký hiệu và các giai đoạn diễn biến, giống lược đồ trận đánh của HistoryTalk. Học sinh xem diễn biến ngay trong bối cảnh."
      />
      {hasMap ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- uploaded battle map image */}
          <img src={map!.imageUrl} alt="Lược đồ trận đánh" className="max-h-40 w-full max-w-xs rounded-[2px] border border-[var(--border-default)] object-cover" />
          <p className="text-sm text-content-muted">
            {map!.factions.length} phe · {map!.symbols.length} ký hiệu{map!.phases?.length ? ` · ${map!.phases.length} giai đoạn` : ""}
          </p>
        </div>
      ) : (
        <p className="text-sm text-content-muted">Bối cảnh chưa có lược đồ trận đánh.</p>
      )}
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-crimson" onClick={() => setEditing(true)}>
            <MapIcon className="h-4 w-4" aria-hidden="true" /> {hasMap ? "Sửa lược đồ" : "Soạn lược đồ"}
          </button>
          {hasMap && (
            <button type="button" className="btn-line text-[var(--accent-danger)]" onClick={() => setClearOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Xóa lược đồ
            </button>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[60] overflow-auto bg-[var(--bg-main)]">
          <BattleMapEditor
            initialValue={map ?? emptyBattleMap()}
            title={item.name}
            onClose={() => setEditing(false)}
            onSave={async (value) => {
              try {
                await save(value);
                toast.success("Đã lưu lược đồ trận đánh");
              } catch (e) {
                toast.error(apiErrorMessage(e, "Không lưu được lược đồ."));
                throw e;
              }
            }}
          />
        </div>
      )}

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        variant="danger"
        title="Xóa lược đồ trận đánh?"
        description="Ảnh lược đồ, phe, ký hiệu và các giai đoạn của bối cảnh này sẽ bị xóa."
        confirmLabel="Xóa lược đồ"
        onConfirm={() =>
          void save(null).then(
            () => toast.success("Đã xóa lược đồ"),
            (e) => toast.error(apiErrorMessage(e, "Không xóa được lược đồ.")),
          )
        }
      />
    </Panel>
  );
}

/* ───────────────────────── Quizzes ───────────────────────── */

/** Quizzes the teacher wrote for one local context (GET/POST .../contexts/{id}/quizzes). */
export function ContextQuizzesPanel({ contextId, canEdit }: { contextId: string; canEdit: boolean }) {
  const quizzes = useContextQuizzes(contextId);

  const rows = quizzes.data?.items ?? [];

  return (
    <Panel>
      <SectionHeading
        title={`Bộ đề (${rows.length})`}
        description="Bộ câu hỏi ôn tập cho bối cảnh này. Có thể giao cho lớp ở mục Bài tập."
        actions={
          canEdit && (
            // BE bat buoc >= 1 cau hoi khi tao, nen soan o trang rieng roi tao 1 lan.
            <Link href={ROUTES.TEACHING.LOCAL_QUIZ_NEW({ contextId })} className="btn-ink">
              <Plus className="h-4 w-4" aria-hidden="true" /> Tạo bộ đề
            </Link>
          )
        }
      />
      {quizzes.isPending ? (
        <p className="text-sm text-content-muted">Đang tải bộ đề...</p>
      ) : quizzes.isError ? (
        <p className="text-sm text-[var(--accent-danger)]">{apiErrorMessage(quizzes.error, "Không tải được bộ đề.")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-content-muted">Chưa có bộ đề nào.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
          {rows.map((q) => (
            <li key={q.quizId}>
              <Link href={ROUTES.TEACHING.LOCAL_QUIZ(q.quizId)} className="group flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-content-heading group-hover:text-[var(--accent-gold)]">{q.title}</p>
                  <p className="text-xs text-content-muted">
                    {LEVEL_LABELS[q.level] ?? q.level} · {q.questions.length} câu hỏi
                    {q.updatedDate ? ` · cập nhật ${formatDate(q.updatedDate)}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-[2px] border px-2 py-0.5 text-[11px] font-bold",
                    q.isPublished
                      ? "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]"
                      : "border-[var(--border-strong)] text-[var(--text-secondary)]",
                  )}
                >
                  {q.isPublished ? "Đã xuất bản" : "Nháp"}
                </span>
                <ArrowRight className="h-4 w-4 text-content-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}

    </Panel>
  );
}

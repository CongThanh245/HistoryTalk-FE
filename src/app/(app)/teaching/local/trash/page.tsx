"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryState, localMeta } from "@/components/saas/local-content-ui";
import { SaasShell, formatDate } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import { LOCAL_KINDS, useLocalTrash, useLocalTrashMutations } from "@/features/saas/hooks-local-content";
import { LOCAL_KIND_LABELS } from "@/features/saas/hooks-teaching";
import type { LocalItem, LocalKind } from "@/services/local-content.service";

/** Teacher: deleted contexts / characters of the school; restore or delete for good (Sprint 7). */
export default function LocalTrashPage() {
  const [kind, setKind] = React.useState<LocalKind>("CONTEXT");
  return (
    <SaasShell
      variant="app"
      live
      title="Thùng rác"
      description="Bối cảnh và nhân vật đã xóa khỏi Kho tư liệu. Khôi phục để dùng lại, hoặc xóa vĩnh viễn."
      backLink={
        <Link href={ROUTES.TEACHING.LOCAL} className="archive-link">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Kho tư liệu
        </Link>
      }
    >
      <div className="space-y-5">
        <Tabs value={kind} onValueChange={(v) => setKind(v as LocalKind)}>
          <TabsList className="h-10 w-full sm:w-fit">
            {LOCAL_KINDS.map((k) => (
              <TabsTrigger key={k} value={k} className="px-4">
                {LOCAL_KIND_LABELS[k]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <TrashList key={kind} kind={kind} />
      </div>
    </SaasShell>
  );
}

function TrashList({ kind }: { kind: LocalKind }) {
  const trash = useLocalTrash(kind);
  const { restore, purge } = useLocalTrashMutations();
  const [purging, setPurging] = React.useState<LocalItem | null>(null);
  const rows = trash.data?.items ?? [];

  return (
    <QueryState isLoading={trash.isLoading} isError={trash.isError} error={trash.error} onRetry={() => void trash.refetch()}>
      {rows.length === 0 ? (
        <EmptyState icon={Trash2} title="Thùng rác trống" description={`Chưa có ${LOCAL_KIND_LABELS[kind].toLowerCase()} nào bị xóa.`} />
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-content-heading">{c.name}</p>
                <p className="text-xs text-content-muted">
                  {c.description || c.title ? localMeta(c) : LOCAL_KIND_LABELS[kind]}
                  {c.deletedAt && ` · xóa ${formatDate(c.deletedAt)}`}
                  {c.createdBy?.fullName && ` · ${c.createdBy.fullName}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="btn-line disabled:opacity-60"
                  disabled={restore.isPending}
                  onClick={() =>
                    restore.mutate(
                      { kind, id: c.id },
                      {
                        onSuccess: () => toast.success(`Đã khôi phục “${c.name}”`),
                        onError: (e) => toast.error(apiErrorMessage(e, "Không khôi phục được.")),
                      },
                    )
                  }
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Khôi phục
                </button>
                <button type="button" className="btn-line text-[var(--accent-danger)]" onClick={() => setPurging(c)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Xóa vĩnh viễn
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!purging}
        onOpenChange={(o) => !o && setPurging(null)}
        variant="danger"
        title={`Xóa vĩnh viễn “${purging?.name ?? ""}”?`}
        description="Nội dung, tài liệu đính kèm và liên kết sẽ bị xóa hẳn khỏi hệ thống. Không thể hoàn tác."
        confirmLabel="Xóa vĩnh viễn"
        onConfirm={() => {
          const target = purging;
          setPurging(null);
          if (!target) return;
          purge.mutate(
            { kind, id: target.id },
            {
              onSuccess: () => toast.success(`Đã xóa vĩnh viễn “${target.name}”`),
              onError: (e) => toast.error(apiErrorMessage(e, "Không xóa được.")),
            },
          );
        }}
      />
    </QueryState>
  );
}

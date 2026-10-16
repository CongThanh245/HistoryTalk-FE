"use client";

// Bối cảnh & nhân vật (?kind=CONTEXT|CHARACTER): API Sprint 6. Thiếu kind thì không gọi được API chi tiết.
import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { SaasShell } from "@/components/saas/saas-ui";
import { QueryState } from "@/components/saas/local-content-ui";
import { LocalApiEditor } from "@/components/saas/teaching-local-api-editor";
import { ROUTES } from "@/constants/routes";
import { apiErrorStatus } from "@/features/saas/hooks-api";
import { useLocalItem } from "@/features/saas/hooks-local-content";
import type { LocalKind } from "@/services/local-content.service";

/** Edit / view local history content — Role Matrix rows 12–14. */
export default function LocalContentPage() {
  return (
    <React.Suspense fallback={null}>
      <LocalContentRoute />
    </React.Suspense>
  );
}

function LocalContentRoute() {
  const { id } = useParams<{ id: string }>();
  const raw = useSearchParams().get("kind");
  const kind: LocalKind | null = raw === "CONTEXT" || raw === "CHARACTER" ? raw : null;
  return (
    <SaasShell
      variant="app"
      live
      title="Tư liệu lớp & trường"
      description="Chỉnh sửa nội dung bạn soạn. Quản trị trường duyệt trước khi học sinh thấy."
    >
      {kind ? (
        <ApiDetail kind={kind} id={id} />
      ) : (
        <EmptyState title="Không tìm thấy nội dung" description="Đường dẫn thiếu loại nội dung (bối cảnh hoặc nhân vật)." action={backLink} />
      )}
    </SaasShell>
  );
}

const backLink = (
  <Link href={ROUTES.TEACHING.LOCAL} className="archive-link">
    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Tư liệu lớp &amp; trường
  </Link>
);

function ApiDetail({ kind, id }: { kind: LocalKind; id: string }) {
  const query = useLocalItem(kind, id);
  const status = apiErrorStatus(query.error);
  if (status === 403 || status === 404) {
    return (
      <EmptyState
        title="Không xem được nội dung"
        description={status === 403 ? "Nội dung riêng của giáo viên khác." : "Nội dung đã bị xóa hoặc không thuộc trường của bạn."}
        action={backLink}
      />
    );
  }
  return (
    <QueryState isLoading={query.isLoading} isError={query.isError} error={query.error} onRetry={query.refetch}>
      {query.data && <LocalApiEditor key={`${query.data.id}:${query.data.updatedAt}`} kind={kind} item={query.data} />}
    </QueryState>
  );
}

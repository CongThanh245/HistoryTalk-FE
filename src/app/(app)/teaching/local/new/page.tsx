"use client";

// FAKE UI: màn này chạy bằng dữ liệu mẫu (src/features/saas/store.ts), chưa có API — chờ BE sprint sau.
import * as React from "react";
import { useSearchParams } from "next/navigation";

import { SaasShell } from "@/components/saas/saas-ui";
import { LocalContentEditor } from "@/components/saas/teaching-local-editor";
import { useRole } from "@/features/auth/usePermission";
import { LOCAL_KIND_LABELS, useTeachingData } from "@/features/saas/hooks-teaching";
import type { LocalContentKind } from "@/features/saas/types";

const KINDS: LocalContentKind[] = ["CONTEXT", "CHARACTER", "QUIZ"];

/** Soạn nội dung lịch sử địa phương mới (?kind=CONTEXT|CHARACTER|QUIZ) — Role Matrix row 12. */
export default function NewLocalContentPage() {
  return (
    <React.Suspense fallback={null}>
      <NewLocalContent />
    </React.Suspense>
  );
}

function NewLocalContent() {
  const params = useSearchParams();
  const raw = params.get("kind");
  const kind: LocalContentKind = KINDS.includes(raw as LocalContentKind) ? (raw as LocalContentKind) : "CONTEXT";
  return (
    <SaasShell
      variant="app"
      title={`Soạn ${LOCAL_KIND_LABELS[kind].toLowerCase()} mới`}
      description="Lưu nháp để soạn tiếp. Nội dung cho lớp bạn tự xuất bản; nội dung cho toàn trường cần quản trị trường duyệt."
    >
      <Editor key={kind} kind={kind} />
    </SaasShell>
  );
}

function Editor({ kind }: { kind: LocalContentKind }) {
  const data = useTeachingData(useRole());
  return <LocalContentEditor kind={kind} data={data} />;
}

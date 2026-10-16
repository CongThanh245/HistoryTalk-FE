"use client";

// Bối cảnh & nhân vật: API Sprint 6. Câu đố vẫn chạy dữ liệu mẫu (src/features/saas/store.ts) — BE chưa có API.
import * as React from "react";
import { useSearchParams } from "next/navigation";

import { SaasShell } from "@/components/saas/saas-ui";
import { LocalApiEditor } from "@/components/saas/teaching-local-api-editor";
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
      live={kind !== "QUIZ"}
      title={`Soạn ${LOCAL_KIND_LABELS[kind].toLowerCase()} mới`}
      description={
        kind === "QUIZ"
          ? "Lưu nháp để soạn tiếp. Nội dung cho lớp bạn tự xuất bản; nội dung cho toàn trường cần quản trị trường duyệt."
          : "Nội dung được lưu thành bản nháp; quản trị trường duyệt trước khi học sinh thấy."
      }
    >
      {kind === "QUIZ" ? <MockQuizEditor /> : <LocalApiEditor key={kind} kind={kind} />}
    </SaasShell>
  );
}

function MockQuizEditor() {
  const data = useTeachingData(useRole());
  return <LocalContentEditor kind="QUIZ" data={data} />;
}

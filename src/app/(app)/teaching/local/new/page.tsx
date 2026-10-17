"use client";

// Bối cảnh & nhân vật: API Sprint 6. BE chưa có API câu đố do giáo viên soạn (?kind=QUIZ chỉ báo trống).
import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { SaasShell } from "@/components/saas/saas-ui";
import { LocalApiEditor } from "@/components/saas/teaching-local-api-editor";
import { ROUTES } from "@/constants/routes";
import { LOCAL_KINDS } from "@/features/saas/hooks-local-content";
import { LOCAL_KIND_LABELS } from "@/features/saas/hooks-teaching";
import type { LocalKind } from "@/services/local-content.service";

/** Soạn bối cảnh / nhân vật mới (?kind=CONTEXT|CHARACTER) — Role Matrix row 12. */
export default function NewLocalContentPage() {
  return (
    <React.Suspense fallback={null}>
      <NewLocalContent />
    </React.Suspense>
  );
}

function NewLocalContent() {
  const raw = useSearchParams().get("kind");
  if (raw === "QUIZ") {
    return (
      <SaasShell variant="app" live title="Soạn câu đố mới">
        <EmptyState
          title="Chưa soạn được câu đố"
          description="Hệ thống chưa hỗ trợ giáo viên soạn câu đố. Hiện chỉ soạn được bối cảnh và nhân vật."
          action={
            <Link href={ROUTES.TEACHING.LOCAL} className="archive-link">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Tư liệu lớp &amp; trường
            </Link>
          }
        />
      </SaasShell>
    );
  }
  const kind: LocalKind = LOCAL_KINDS.includes(raw as LocalKind) ? (raw as LocalKind) : "CONTEXT";
  return (
    <SaasShell
      variant="app"
      live
      title={`Soạn ${LOCAL_KIND_LABELS[kind].toLowerCase()} mới`}
      description="Nội dung được lưu thành bản nháp; gửi duyệt để quản trị trường xem xét trước khi học sinh thấy."
    >
      <LocalApiEditor key={kind} kind={kind} />
    </SaasShell>
  );
}

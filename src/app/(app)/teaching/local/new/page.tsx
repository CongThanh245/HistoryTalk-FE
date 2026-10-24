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
          title="Câu đố được soạn trong từng bối cảnh"
          description="Mở một bối cảnh trong Kho tư liệu, chọn thẻ “Câu đố” rồi bấm “Tạo câu đố”."
          action={
            <Link href={ROUTES.TEACHING.LOCAL} className="archive-link">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Soạn tư liệu
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
      // The editor has its own header bar (back, title, Tạo), like the Content Admin create screen.
      hideHeading
    >
      <LocalApiEditor key={kind} kind={kind} />
    </SaasShell>
  );
}

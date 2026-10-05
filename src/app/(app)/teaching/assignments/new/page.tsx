"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { SaasShell } from "@/components/saas/saas-ui";
import { AssignmentWizard } from "@/components/saas/teaching-assignment-wizard";
import { useRole } from "@/features/auth/usePermission";
import { useTeachingData } from "@/features/saas/hooks-teaching";
import type { AssignmentType } from "@/features/saas/types";

const TYPES: AssignmentType[] = ["EVENT", "CHAT", "TEST"];

/** Giao bài tập kèm deadline (Role Matrix row 16). Accepts ?classId= and ?type= to prefill. */
export default function NewAssignmentPage() {
  return (
    <SaasShell variant="app" title="Giao bài tập" description="Chọn lớp, loại bài và nội dung, rồi đặt thời gian mở và hạn nộp.">
      <React.Suspense fallback={null}>
        <NewAssignment />
      </React.Suspense>
    </SaasShell>
  );
}

function NewAssignment() {
  const role = useRole();
  const data = useTeachingData(role);
  const params = useSearchParams();
  const rawType = params.get("type");
  const type = TYPES.includes(rawType as AssignmentType) ? (rawType as AssignmentType) : null;

  if (data.classes.length === 0) {
    return <EmptyState title="Chưa có lớp giảng dạy" description="Bạn cần được phân công lớp trước khi giao bài." />;
  }
  return <AssignmentWizard data={data} initialClassId={params.get("classId")} initialType={type} />;
}

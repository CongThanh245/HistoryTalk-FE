"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { SaasShell } from "@/components/saas/saas-ui";
import { LocalContentEditor } from "@/components/saas/teaching-local-editor";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { useTeachingData } from "@/features/saas/hooks-teaching";

/** Edit (DRAFT) or view (PENDING / PUBLISHED / INACTIVE / TRASH) local history content — Role Matrix rows 12–14. */
export default function LocalContentPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <SaasShell variant="app" title="Nội dung địa phương" description="Bản nháp có thể chỉnh sửa; nội dung đã gửi duyệt chỉ xem được trạng thái và góp ý.">
      <LocalContentDetail id={id} />
    </SaasShell>
  );
}

function LocalContentDetail({ id }: { id: string }) {
  const data = useTeachingData(useRole());
  const item = data.localContent.find((c) => c.id === id);
  if (!item) {
    return (
      <EmptyState
        title="Không tìm thấy nội dung"
        description="Nội dung đã bị xóa hoặc không thuộc các lớp của bạn."
        action={
          <Link href={ROUTES.TEACHING.LOCAL} className="archive-link">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Lịch sử địa phương
          </Link>
        }
      />
    );
  }
  return <LocalContentEditor key={item.id} kind={item.kind} item={item} data={data} />;
}

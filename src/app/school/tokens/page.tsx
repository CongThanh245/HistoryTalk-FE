"use client";

import { Panel, SectionHeading } from "@/components/saas/saas-ui";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenBoostReviewList } from "@/components/saas/token-boost-ui";
import { useSchoolAdminDashboard } from "@/features/dashboard/hooks";
import { QuotaPanel, SubscriptionSummary } from "../_components/quota";
import { AcademicRolloverPanel, DailyQuotaPolicyPanel } from "../_components/token-policy";
import { ErrorBlock, SchoolShell } from "../_components/shared";

/**
 * School Admin (Sprint 7): school-year subscription, the shared token pool, the daily per-student limit,
 * students' boost requests and the academic-year rollover.
 */
export default function SchoolTokensPage() {
  const dashboard = useSchoolAdminDashboard();
  return (
    <SchoolShell
      title="Hạn mức token"
      description="Quỹ token chung của trường theo năm học (01/09 – 31/05), hạn mức mỗi học sinh mỗi ngày và yêu cầu xin thêm token."
    >
      <div className="space-y-6">
        <Panel>
          <SectionHeading title="Gói năm học" />
          {dashboard.isPending ? (
            <Skeleton className="h-16 w-full" />
          ) : dashboard.isError ? (
            <ErrorBlock error={dashboard.error} fallback="Không tải được thông tin gói." onRetry={() => void dashboard.refetch()} />
          ) : (
            <SubscriptionSummary data={dashboard.data} />
          )}
        </Panel>

        <QuotaPanel />

        <DailyQuotaPolicyPanel currentDefault={dashboard.data?.defaultDailyStudentQuota} />

        <Panel>
          <SectionHeading
            title="Yêu cầu xin thêm token"
            description="Học sinh hết hạn mức trong ngày gửi yêu cầu cho giáo viên lớp. Bạn cũng có thể duyệt thay. Token duyệt thêm chỉ có hiệu lực trong ngày."
          />
          <TokenBoostReviewList scopeHint="Yêu cầu của học sinh toàn trường sẽ hiện ở đây." />
        </Panel>

        <AcademicRolloverPanel />
      </div>
    </SchoolShell>
  );
}

"use client";

import { Panel, SectionHeading } from "@/components/saas/saas-ui";
import { TokenBoostReviewList } from "@/components/saas/token-boost-ui";
import { useSchoolAdminDashboard } from "@/features/dashboard/hooks";
import { PoolStrip } from "../_components/quota";
import { DailyQuotaPolicyPanel } from "../_components/token-policy";
import { SchoolShell } from "../_components/shared";

/**
 * School Admin (Sprint 7): hai viec can lam o day — duyet yeu cau xin them token va dat han muc moi ngay.
 * Quy chung + goi nam hoc nam o Tong quan truong; chuyen giao nam hoc nam o trang Lop hoc.
 */
export default function SchoolTokensPage() {
  const dashboard = useSchoolAdminDashboard();
  const pending = dashboard.data?.pendingTokenBoostRequests ?? 0;
  return (
    <SchoolShell title="Hạn mức token" description="Duyệt yêu cầu xin thêm token và đặt mức token mỗi học sinh, giáo viên được dùng mỗi ngày.">
      <div className="space-y-6">
        <PoolStrip />

        <Panel>
          <SectionHeading title={pending > 0 ? `Yêu cầu chờ duyệt (${pending})` : "Yêu cầu xin thêm token"} />
          <TokenBoostReviewList reviewer="SCHOOL_ADMIN" scopeHint="Hiện chưa có yêu cầu nào. Khi có, bạn sẽ thấy ở đây để duyệt hoặc từ chối." />
        </Panel>

        <DailyQuotaPolicyPanel currentDefault={dashboard.data?.defaultDailyStudentQuota} />
      </div>
    </SchoolShell>
  );
}

"use client";

import { SaasShell, Panel } from "@/components/saas/saas-ui";
import { TeacherQuotaPanel, TokenBoostReviewList } from "@/components/saas/token-boost-ui";

/**
 * Teacher (US-SP7-17): own daily limit, students' requests of the classes they teach and their own tickets.
 * Approving gives tokens from the teacher's own daily limit; when it is used up the request goes to the School Admin.
 */
export default function TeacherTokenRequestsPage() {
  return (
    <SaasShell
      variant="app"
      live
      title="Yêu cầu token"
      description="Học sinh xin thêm token, bạn cấp từ hạn mức hôm nay của mình. Khi hạn mức của bạn hết, chuyển yêu cầu lên quản trị trường để cấp từ quỹ chung."
    >
      <div className="space-y-6">
        <TeacherQuotaPanel />
        <Panel>
          <TokenBoostReviewList reviewer="TEACHER" scopeHint="Yêu cầu của học sinh các lớp bạn phụ trách và yêu cầu bạn gửi quản trị trường sẽ hiện ở đây." />
        </Panel>
      </div>
    </SaasShell>
  );
}

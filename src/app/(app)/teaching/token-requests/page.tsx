"use client";

import { SaasShell, Panel } from "@/components/saas/saas-ui";
import { TokenBoostReviewList } from "@/components/saas/token-boost-ui";

/** Teacher: daily token boost requests from students of the classes they teach (US-SP7-17). */
export default function TeacherTokenRequestsPage() {
  return (
    <SaasShell
      variant="app"
      live
      title="Yêu cầu token"
      description="Học sinh dùng hết hạn mức token AI trong ngày có thể xin thêm. Token bạn duyệt chỉ có hiệu lực trong hôm nay và được trừ dần từ quỹ chung của trường."
    >
      <Panel>
        <TokenBoostReviewList scopeHint="Yêu cầu của học sinh các lớp bạn phụ trách sẽ hiện ở đây." />
      </Panel>
    </SaasShell>
  );
}

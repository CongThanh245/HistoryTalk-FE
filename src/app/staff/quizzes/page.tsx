import { Suspense } from "react";
import PageContent from "./page-content";

export default function StaffQuizzesPage() {
  // PageContent reads ?create=1 (sidebar "Tạo" menu), which needs a Suspense boundary.
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}

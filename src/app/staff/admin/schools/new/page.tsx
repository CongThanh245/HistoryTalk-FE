"use client";

import { CreateSchoolForm } from "@/components/saas/admin-school-create";
import { SaasShell } from "@/components/saas/saas-ui";

/** System Admin: create a school, then its first School Admin. */
export default function NewSchoolPage() {
  return (
    <SaasShell live title="Thêm trường" description="Tạo trường trên gói Enterprise, sau đó cấp tài khoản quản trị trường đầu tiên.">
      <CreateSchoolForm />
    </SaasShell>
  );
}

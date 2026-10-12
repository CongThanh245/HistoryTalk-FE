"use client";

import Link from "next/link";
import { ArrowRight, Coins } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { Panel, SectionHeading } from "@/components/saas/saas-ui";
import { QuotaPanel } from "../_components/quota";
import { SchoolShell } from "../_components/shared";

const STEPS = [
  "Mở trang Học sinh, tìm hoặc lọc học sinh cần cấp.",
  "Đánh dấu một hoặc nhiều học sinh (hoặc chọn “Cấp thêm token” ở menu của một dòng).",
  "Bấm “Cấp token”, nhập số token mỗi học sinh. Tổng không được vượt quỹ chưa phân bổ.",
];

/** School Admin: the school's monthly token pool (GET /school-admin/token-quota) + entry point to per-student allocation. */
export default function SchoolTokensPage() {
  return (
    <SchoolShell title="Hạn mức token" description="Quỹ token theo gói của trường: tổng, đã cấp cho học sinh và phần chưa phân bổ.">
      <div className="space-y-6">
        <QuotaPanel />

        <Panel>
          <SectionHeading
            title="Cấp token cho học sinh"
            description="Token được chuyển từ quỹ chưa phân bổ của trường vào ví của từng học sinh."
          />
          <ol className="space-y-2 text-sm text-content-text">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-start gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center border border-[var(--text-primary)] text-xs font-bold tabular-nums">
                  {i + 1}
                </span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={ROUTES.SCHOOL.STUDENTS} className="btn-crimson w-full sm:w-auto">
              <Coins className="h-4 w-4" aria-hidden="true" /> Chọn học sinh để cấp token
            </Link>
            <Link href={ROUTES.SCHOOL.STUDENTS} className="archive-link self-start sm:self-center">
              Nhập học sinh mới <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </Panel>
      </div>
    </SchoolShell>
  );
}

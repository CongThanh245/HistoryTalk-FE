"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Clock } from "lucide-react";
import { toast } from "sonner";

import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { Field, Panel, PlanBadge, SaasShell, SectionHeading, TokenBar, formatNumber } from "@/components/saas/saas-ui";
import { useSchoolData } from "@/features/saas/hooks";
import { PLAN_DEFAULTS } from "@/features/saas/mock-data";
import { useDemoSchoolId, useSaasStore } from "@/features/saas/store";
import type { School, StudentAccount } from "@/features/saas/types";

/** School Admin: daily token quota for the school's accounts (Role Matrix row 20). */
export default function SchoolTokensPage() {
  return (
    <SaasShell title="Hạn mức token" description="Cấu hình số token mỗi học sinh và giáo viên được dùng trong một ngày, trong giới hạn của gói.">
      <TokensContent />
    </SaasShell>
  );
}

function TokensContent() {
  const schoolId = useDemoSchoolId();
  const { school, students, classByStudent } = useSchoolData(schoolId);
  const [topN, setTopN] = React.useState("15");

  const top = React.useMemo(
    () => [...students].filter((s) => s.tokensUsedToday > 0).sort((a, b) => b.tokensUsedToday - a.tokensUsedToday).slice(0, Number(topN)),
    [students, topN],
  );

  const quota = school?.dailyTokensPerStudent ?? 0;
  const columns = React.useMemo<ColumnDef<StudentAccount>[]>(
    () => [
      { id: "rank", header: "#", cell: ({ row }) => <span className="tabular-nums text-content-muted">{row.index + 1}</span> },
      {
        id: "name",
        accessorKey: "fullName",
        header: "Học sinh",
        cell: ({ row }) => (
          <div className="min-w-[170px]">
            <p className="text-sm font-semibold text-content-heading">{row.original.fullName}</p>
            <p className="text-xs text-content-muted">
              {row.original.studentCode} · {classByStudent.get(row.original.id)?.name ?? "Chưa xếp lớp"}
            </p>
          </div>
        ),
      },
      {
        id: "usage",
        header: "Đã dùng / hạn mức",
        cell: ({ row }) => {
          const used = row.original.tokensUsedToday;
          return (
            <div className="w-[220px] space-y-1">
              <TokenBar used={used} quota={quota} />
              <p className="text-xs tabular-nums">
                {formatNumber(used)} / {formatNumber(quota)}
                {used >= quota && <span className="ml-2 font-semibold text-[var(--accent-danger)]">Đã hết</span>}
              </p>
            </div>
          );
        },
      },
    ],
    [classByStudent, quota],
  );

  if (!school) return <p className="text-sm text-content-muted">Không tìm thấy dữ liệu trường.</p>;

  return (
    <div className="space-y-8">
      <QuotaForm key={`${school.dailyTokensPerStudent}-${school.dailyTokensPerTeacher}-${school.plan}`} school={school} />

      <div className="space-y-4">
        <SectionHeading title="Dùng nhiều nhất hôm nay" description="Học sinh dùng nhiều token nhất kể từ 00:00." />
        <div className="flex items-center gap-2">
          <span className="text-sm text-content-muted">Hiển thị</span>
          <StaffFormSelect
            value={topN}
            onValueChange={setTopN}
            options={[
              { value: "10", label: "Top 10" },
              { value: "15", label: "Top 15" },
              { value: "30", label: "Top 30" },
            ]}
            className="w-32"
          />
        </div>
        <StaffDataTable columns={columns} data={top} emptyMessage="Hôm nay chưa có học sinh nào dùng token." />
      </div>
    </div>
  );
}

function QuotaForm({ school }: { school: School }) {
  const updateSchool = useSaasStore((s) => s.updateSchool);
  const limits = PLAN_DEFAULTS[school.plan];
  const [student, setStudent] = React.useState(String(school.dailyTokensPerStudent));
  const [teacher, setTeacher] = React.useState(String(school.dailyTokensPerTeacher));

  const check = (v: string, max: number) => {
    const n = Number(v);
    if (!v.trim() || !Number.isInteger(n) || n < 0) return "Nhập số nguyên ≥ 0";
    if (n > max) return `Tối đa ${formatNumber(max)} theo gói`;
    return null;
  };
  const studentError = check(student, limits.dailyTokensPerStudent);
  const teacherError = check(teacher, limits.dailyTokensPerTeacher);
  const dirty = Number(student) !== school.dailyTokensPerStudent || Number(teacher) !== school.dailyTokensPerTeacher;

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PlanBadge plan={school.plan} />
          <span className="text-sm text-content-muted">Gói của trường do quản trị hệ thống cấp</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm text-content-muted">
          <Clock className="h-4 w-4" aria-hidden="true" /> Hạn mức reset mỗi ngày lúc 00:00
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Token mỗi học sinh / ngày"
          required
          error={studentError}
          hint={`Mặc định của gói: ${formatNumber(limits.dailyTokensPerStudent)} (cũng là mức tối đa)`}
        >
          <StaffFormInput type="number" inputMode="numeric" min={0} max={limits.dailyTokensPerStudent} step={500} value={student} onChange={(e) => setStudent(e.target.value)} />
        </Field>
        <Field
          label="Token mỗi giáo viên / ngày"
          required
          error={teacherError}
          hint={`Mặc định của gói: ${formatNumber(limits.dailyTokensPerTeacher)} (cũng là mức tối đa)`}
        >
          <StaffFormInput type="number" inputMode="numeric" min={0} max={limits.dailyTokensPerTeacher} step={1000} value={teacher} onChange={(e) => setTeacher(e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="btn-line"
          onClick={() => {
            setStudent(String(limits.dailyTokensPerStudent));
            setTeacher(String(limits.dailyTokensPerTeacher));
          }}
        >
          Dùng mặc định của gói
        </button>
        <button
          type="button"
          className="btn-crimson disabled:opacity-50"
          disabled={!dirty || !!studentError || !!teacherError}
          onClick={() => {
            updateSchool(school.id, { dailyTokensPerStudent: Number(student), dailyTokensPerTeacher: Number(teacher) });
            toast.success("Đã lưu hạn mức token");
          }}
        >
          Lưu hạn mức
        </button>
      </div>
    </Panel>
  );
}

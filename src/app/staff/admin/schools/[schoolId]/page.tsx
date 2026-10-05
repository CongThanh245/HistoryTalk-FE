"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, LockKeyhole, LockKeyholeOpen, MailPlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { StaffStatCard, StaffStatsGrid } from "@/components/staff/staff-stat-card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AccountStatusBadge,
  DIALOG_CLASS,
  DIALOG_TITLE_CLASS,
  Field,
  IconAction,
  Panel,
  SaasShell,
  SchoolStatusBadge,
  SectionHeading,
  formatDate,
  formatNumber,
  isValidEmail,
} from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { useSchoolData } from "@/features/saas/hooks";
import { PLAN_DEFAULTS, PLAN_LABELS } from "@/features/saas/mock-data";
import { useSaasStore } from "@/features/saas/store";
import type { Classroom, School, SchoolAdminAccount, SchoolPlan, TeacherAccount } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

/** System Admin: one school — plan & quotas, School Admin accounts (row 2), classes read-only (row 6 view). */
export default function AdminSchoolDetailPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  return (
    <SaasShell title="Chi tiết trường" description="Gói và hạn mức token, tài khoản quản trị trường và danh sách lớp.">
      <SchoolDetail schoolId={schoolId} />
    </SaasShell>
  );
}

function SchoolDetail({ schoolId }: { schoolId: string }) {
  const { school, admins, teachers, students, classes, teacherById } = useSchoolData(schoolId);

  if (!school) {
    return (
      <EmptyState
        title="Không tìm thấy trường"
        description="Trường có thể đã bị xóa hoặc đường dẫn không đúng."
        action={
          <Link href={ROUTES.STAFF.ADMIN.SCHOOLS} className="archive-link">
            Về danh sách trường
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <Link href={ROUTES.STAFF.ADMIN.SCHOOLS} className="archive-link">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Tất cả trường
      </Link>

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="archive-title is-plain text-3xl">{school.name}</p>
            <p className="mt-1 text-sm text-content-muted">
              <span className="font-mono">{school.code}</span> · {school.province}
              {school.address && ` · ${school.address}`}
            </p>
          </div>
          <SchoolStatusBadge status={school.status} />
        </div>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-content-muted">Ngày tạo</dt>
            <dd className="font-medium">{formatDate(school.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-content-muted">Hết hạn hợp đồng</dt>
            <dd className="font-medium">{formatDate(school.contractEndsAt)}</dd>
          </div>
          <div>
            <dt className="text-content-muted">Gói hiện tại</dt>
            <dd className="font-medium">{PLAN_LABELS[school.plan]}</dd>
          </div>
        </dl>
      </Panel>

      <StaffStatsGrid>
        <StaffStatCard label="Lớp học" value={classes.length} tone="gold" />
        <StaffStatCard label="Giáo viên" value={teachers.length} tone="blue" />
        <StaffStatCard label="Học sinh" value={`${formatNumber(students.length)}/${formatNumber(school.maxStudents)}`} tone="green" />
        <StaffStatCard label="Quản trị trường" value={admins.length} tone="muted" />
      </StaffStatsGrid>

      <div className="space-y-4">
        <SectionHeading title="Gói và hạn mức" description="Hạn mức token mỗi ngày (reset lúc 00:00) và số tài khoản học sinh tối đa." />
        <PlanForm key={`${school.plan}-${school.dailyTokensPerStudent}-${school.dailyTokensPerTeacher}-${school.maxStudents}-${school.contractEndsAt}`} school={school} />
      </div>

      <SchoolAdmins school={school} admins={admins} />

      <div className="space-y-4">
        <SectionHeading title="Lớp học" description="Chỉ xem. Quản trị trường quản lý lớp và học sinh." />
        <ClassesReadOnly classes={classes} teacherById={teacherById} />
      </div>
    </div>
  );
}

/* ───────────────────────── Plan & quotas ───────────────────────── */
function PlanForm({ school }: { school: School }) {
  const updateSchool = useSaasStore((s) => s.updateSchool);
  const [plan, setPlan] = React.useState<SchoolPlan>(school.plan);
  const [values, setValues] = React.useState({
    dailyTokensPerStudent: String(school.dailyTokensPerStudent),
    dailyTokensPerTeacher: String(school.dailyTokensPerTeacher),
    maxStudents: String(school.maxStudents),
    contractEndsAt: school.contractEndsAt,
  });
  const defaults = PLAN_DEFAULTS[plan];
  const { students } = useSchoolData(school.id);

  const num = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v) : NaN);
  const errors = {
    dailyTokensPerStudent: Number.isNaN(num(values.dailyTokensPerStudent)) ? "Nhập số nguyên ≥ 0" : null,
    dailyTokensPerTeacher: Number.isNaN(num(values.dailyTokensPerTeacher)) ? "Nhập số nguyên ≥ 0" : null,
    maxStudents: Number.isNaN(num(values.maxStudents))
      ? "Nhập số nguyên ≥ 0"
      : num(values.maxStudents) < students.length
        ? `Trường đang có ${students.length} học sinh`
        : null,
    contractEndsAt: values.contractEndsAt ? null : "Chọn ngày",
  };
  const hasError = Object.values(errors).some(Boolean);

  const input = (key: "dailyTokensPerStudent" | "dailyTokensPerTeacher" | "maxStudents", label: string) => (
    <Field label={label} required error={errors[key]} hint={`Mặc định ${PLAN_LABELS[plan]}: ${formatNumber(defaults[key])}`}>
      <StaffFormInput
        type="number"
        inputMode="numeric"
        min={0}
        value={values[key]}
        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
      />
    </Field>
  );

  return (
    <Panel>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Gói" hint="Đổi gói sẽ điền lại hạn mức mặc định của gói mới.">
          <StaffFormSelect
            value={plan}
            onValueChange={(p) => {
              setPlan(p);
              const d = PLAN_DEFAULTS[p];
              setValues((v) => ({
                ...v,
                dailyTokensPerStudent: String(d.dailyTokensPerStudent),
                dailyTokensPerTeacher: String(d.dailyTokensPerTeacher),
                maxStudents: String(d.maxStudents),
              }));
            }}
            options={(Object.keys(PLAN_LABELS) as SchoolPlan[]).map((p) => ({ value: p, label: PLAN_LABELS[p] }))}
            className="w-full"
          />
        </Field>
        <Field label="Hết hạn hợp đồng" required error={errors.contractEndsAt}>
          <StaffFormInput type="date" value={values.contractEndsAt} onChange={(e) => setValues((v) => ({ ...v, contractEndsAt: e.target.value }))} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {input("dailyTokensPerStudent", "Token / học sinh / ngày")}
        {input("dailyTokensPerTeacher", "Token / giáo viên / ngày")}
        {input("maxStudents", "Số học sinh tối đa")}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          className="btn-crimson w-full disabled:opacity-50 sm:w-auto"
          disabled={hasError}
          onClick={() => {
            updateSchool(school.id, {
              plan,
              dailyTokensPerStudent: num(values.dailyTokensPerStudent),
              dailyTokensPerTeacher: num(values.dailyTokensPerTeacher),
              maxStudents: num(values.maxStudents),
              contractEndsAt: values.contractEndsAt,
            });
            toast.success("Đã lưu gói và hạn mức");
          }}
        >
          Lưu gói và hạn mức
        </button>
      </div>
    </Panel>
  );
}

/* ───────────────────────── School Admin accounts ───────────────────────── */
function SchoolAdmins({ school, admins }: { school: School; admins: SchoolAdminAccount[] }) {
  const updateSchoolAdmin = useSaasStore((s) => s.updateSchoolAdmin);
  const removeSchoolAdmin = useSaasStore((s) => s.removeSchoolAdmin);
  const [addOpen, setAddOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<SchoolAdminAccount | null>(null);

  const columns = React.useMemo<ColumnDef<SchoolAdminAccount>[]>(
    () => [
      {
        id: "name",
        accessorKey: "fullName",
        header: "Quản trị trường",
        cell: ({ row }) => (
          <div className="min-w-[200px]">
            <p className="text-sm font-semibold text-content-heading">{row.original.fullName}</p>
            <p className="text-xs text-content-muted">{row.original.email}</p>
          </div>
        ),
      },
      { accessorKey: "phone", header: "Điện thoại", cell: ({ row }) => row.original.phone ?? <span className="text-content-muted">—</span> },
      { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <AccountStatusBadge status={row.original.status} /> },
      { accessorKey: "createdAt", header: "Ngày tạo", cell: ({ row }) => <span className="text-xs">{formatDate(row.original.createdAt)}</span> },
      {
        id: "actions",
        header: () => <div className="pr-2 text-right">Thao tác</div>,
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <IconAction label="Gửi lại email mời" onClick={() => toast.success(`Đã gửi lại email mời tới ${a.email}`)}>
                <MailPlus className="h-4 w-4" />
              </IconAction>
              {a.status === "LOCKED" ? (
                <IconAction
                  label="Mở khóa"
                  tone="success"
                  onClick={() => {
                    updateSchoolAdmin(a.id, { status: "ACTIVE" });
                    toast.success(`Đã mở khóa ${a.fullName}`);
                  }}
                >
                  <LockKeyholeOpen className="h-4 w-4" />
                </IconAction>
              ) : (
                <IconAction
                  label="Khóa tài khoản"
                  tone="danger"
                  onClick={() => {
                    updateSchoolAdmin(a.id, { status: "LOCKED" });
                    toast.success(`Đã khóa ${a.fullName}`);
                  }}
                >
                  <LockKeyhole className="h-4 w-4" />
                </IconAction>
              )}
              <IconAction label="Xóa tài khoản" tone="danger" onClick={() => setRemoveTarget(a)}>
                <Trash2 className="h-4 w-4" />
              </IconAction>
            </div>
          );
        },
      },
    ],
    [updateSchoolAdmin],
  );

  const activeCount = admins.filter((a) => a.status !== "LOCKED").length;

  return (
    <div className="space-y-4">
      <SectionHeading
        title="Tài khoản quản trị trường"
        description="Quản trị trường tạo tài khoản giáo viên, học sinh và quản lý lớp của trường."
        actions={
          <button type="button" className="btn-crimson w-full sm:w-auto" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Thêm quản trị trường
          </button>
        }
      />
      {activeCount === 0 && <p className="text-sm text-[var(--status-warning)]">Trường chưa có quản trị trường nào đang hoạt động.</p>}
      <StaffDataTable columns={columns} data={admins} emptyMessage="Chưa có tài khoản quản trị trường." />

      <AddAdminDialog open={addOpen} onOpenChange={setAddOpen} school={school} admins={admins} />
      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title="Xóa quản trị trường?"
        description={`Tài khoản ${removeTarget?.email ?? ""} sẽ bị xóa khỏi ${school.name}. Không thể hoàn tác.`}
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={() => {
          if (!removeTarget) return;
          removeSchoolAdmin(removeTarget.id);
          toast.success(`Đã xóa ${removeTarget.fullName}`);
          setRemoveTarget(null);
        }}
      />
    </div>
  );
}

function AddAdminDialog({
  open,
  onOpenChange,
  school,
  admins,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  school: School;
  admins: SchoolAdminAccount[];
}) {
  const addSchoolAdmin = useSaasStore((s) => s.addSchoolAdmin);
  const [form, setForm] = React.useState({ fullName: "", email: "", phone: "" });
  const [touched, setTouched] = React.useState(false);
  const close = (o: boolean) => {
    if (!o) {
      setForm({ fullName: "", email: "", phone: "" });
      setTouched(false);
    }
    onOpenChange(o);
  };
  const email = form.email.trim().toLowerCase();
  const errors = {
    fullName: form.fullName.trim() ? null : "Nhập họ và tên",
    email: !isValidEmail(email) ? "Email không hợp lệ" : admins.some((a) => a.email.toLowerCase() === email) ? "Email đã có trong trường" : null,
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>Thêm quản trị trường</DialogTitle>
          <DialogDescription className="text-content-muted">Tài khoản mới của {school.name} sẽ nhận email mời kích hoạt.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Họ và tên" required error={touched ? errors.fullName : null}>
            <StaffFormInput value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          </Field>
          <Field label="Email" required error={touched ? errors.email : null}>
            <StaffFormInput type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Số điện thoại">
            <StaffFormInput type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <button type="button" className="btn-line" onClick={() => close(false)}>
            Hủy
          </button>
          <button
            type="button"
            className="btn-crimson"
            onClick={() => {
              setTouched(true);
              if (errors.fullName || errors.email) return;
              addSchoolAdmin({ schoolId: school.id, fullName: form.fullName.trim(), email, phone: form.phone.trim() || undefined, status: "INVITED" });
              toast.success(`Đã gửi email mời tới ${email}`);
              close(false);
            }}
          >
            Tạo và gửi lời mời
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Classes (read-only) ───────────────────────── */
function ClassesReadOnly({ classes, teacherById }: { classes: Classroom[]; teacherById: Map<string, TeacherAccount> }) {
  const columns = React.useMemo<ColumnDef<Classroom>[]>(
    () => [
      { id: "name", accessorKey: "name", header: "Lớp", cell: ({ row }) => <span className="font-semibold text-content-heading">{row.original.name}</span> },
      { accessorKey: "grade", header: "Khối" },
      { accessorKey: "schoolYear", header: "Năm học" },
      {
        id: "homeroom",
        header: "Chủ nhiệm",
        cell: ({ row }) => {
          const t = row.original.homeroomTeacherId ? teacherById.get(row.original.homeroomTeacherId) : undefined;
          return t ? t.fullName : <span className="text-[var(--status-warning)]">Chưa phân công</span>;
        },
      },
      { id: "teachers", header: "Giáo viên", cell: ({ row }) => <span className="tabular-nums">{row.original.teacherIds.length}</span> },
      { id: "students", header: "Sĩ số", cell: ({ row }) => <span className="tabular-nums">{row.original.studentIds.length}</span> },
    ],
    [teacherById],
  );
  return <StaffDataTable columns={columns} data={classes} emptyMessage="Trường chưa có lớp nào." />;
}

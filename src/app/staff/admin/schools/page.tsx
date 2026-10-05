"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Ban, Building2, CheckCircle2, Eye, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { StaffStatCard, StaffStatsGrid } from "@/components/staff/staff-stat-card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DIALOG_CLASS,
  DIALOG_TITLE_CLASS,
  Field,
  IconAction,
  Panel,
  PlanBadge,
  SaasShell,
  SchoolStatusBadge,
  SearchInput,
  formatDate,
  formatNumber,
  isValidEmail,
  normalizeText,
} from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { useSchoolCounts } from "@/features/saas/hooks";
import { PLAN_DEFAULTS, PLAN_LABELS } from "@/features/saas/mock-data";
import { useSaasStore } from "@/features/saas/store";
import type { School, SchoolPlan } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

const PLANS = Object.keys(PLAN_LABELS) as SchoolPlan[];

/** System Admin: schools on the school package and their School Admin accounts (Role Matrix row 2). */
export default function AdminSchoolsPage() {
  return (
    <SaasShell title="Gói trường học" description="Danh sách trường đang dùng gói Enterprise, tạo trường mới cùng tài khoản quản trị trường.">
      <SchoolsContent />
    </SaasShell>
  );
}

function SchoolsContent() {
  const router = useRouter();
  const schools = useSaasStore((s) => s.schools);
  const updateSchool = useSaasStore((s) => s.updateSchool);
  const counts = useSchoolCounts();

  const [search, setSearch] = React.useState("");
  const [plan, setPlan] = React.useState<"ALL" | SchoolPlan>("ALL");
  const [status, setStatus] = React.useState<"ALL" | School["status"]>("ALL");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [toggleTarget, setToggleTarget] = React.useState<School | null>(null);

  const filtered = React.useMemo(() => {
    const q = normalizeText(search);
    return schools.filter(
      (s) =>
        (plan === "ALL" || s.plan === plan) &&
        (status === "ALL" || s.status === status) &&
        (!q || normalizeText(s.name).includes(q) || normalizeText(s.code).includes(q) || normalizeText(s.province).includes(q)),
    );
  }, [schools, search, plan, status]);

  const columns = React.useMemo<ColumnDef<School>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Trường",
        cell: ({ row }) => (
          <div className="min-w-[200px]">
            <Link href={ROUTES.STAFF.ADMIN.SCHOOL_DETAIL(row.original.id)} className="text-sm font-semibold text-content-heading hover:text-[var(--accent-gold)]" onClick={(e) => e.stopPropagation()}>
              {row.original.name}
            </Link>
            <p className="font-mono text-xs text-content-muted">{row.original.code}</p>
          </div>
        ),
      },
      { accessorKey: "province", header: "Tỉnh / thành" },
      { accessorKey: "plan", header: "Gói", cell: ({ row }) => <PlanBadge plan={row.original.plan} /> },
      {
        id: "students",
        header: "Học sinh",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatNumber(counts.students.get(row.original.id) ?? 0)}
            <span className="text-content-muted"> / {formatNumber(row.original.maxStudents)}</span>
          </span>
        ),
      },
      { id: "classes", header: "Lớp", cell: ({ row }) => <span className="tabular-nums">{counts.classes.get(row.original.id) ?? 0}</span> },
      { accessorKey: "contractEndsAt", header: "Hết hạn HĐ", cell: ({ row }) => <span className="text-xs">{formatDate(row.original.contractEndsAt)}</span> },
      { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <SchoolStatusBadge status={row.original.status} /> },
      {
        id: "actions",
        header: () => <div className="pr-2 text-right">Thao tác</div>,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <IconAction label="Xem chi tiết" onClick={() => router.push(ROUTES.STAFF.ADMIN.SCHOOL_DETAIL(s.id))}>
                <Eye className="h-4 w-4" />
              </IconAction>
              {s.status === "ACTIVE" ? (
                <IconAction label="Tạm ngưng" tone="danger" onClick={() => setToggleTarget(s)}>
                  <Ban className="h-4 w-4" />
                </IconAction>
              ) : (
                <IconAction label="Kích hoạt lại" tone="success" onClick={() => setToggleTarget(s)}>
                  <CheckCircle2 className="h-4 w-4" />
                </IconAction>
              )}
            </div>
          );
        },
      },
    ],
    [counts, router],
  );

  const totalStudents = schools.reduce((sum, s) => sum + (counts.students.get(s.id) ?? 0), 0);
  const totalClasses = schools.reduce((sum, s) => sum + (counts.classes.get(s.id) ?? 0), 0);

  return (
    <div className="space-y-6">
      <StaffStatsGrid>
        <StaffStatCard label="Trường" value={schools.length} icon={<Building2 className="h-5 w-5" />} tone="gold" />
        <StaffStatCard label="Đang hoạt động" value={schools.filter((s) => s.status === "ACTIVE").length} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" />
        <StaffStatCard label="Học sinh" value={formatNumber(totalStudents)} icon={<Users className="h-5 w-5" />} tone="blue" />
        <StaffStatCard label="Lớp học" value={totalClasses} tone="muted" />
      </StaffStatsGrid>

      <Panel>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên trường, mã, tỉnh..." />
          <StaffFormSelect
            value={plan}
            onValueChange={setPlan}
            options={[{ value: "ALL", label: "Tất cả gói" }, ...PLANS.map((p) => ({ value: p, label: PLAN_LABELS[p] }))]}
            className="w-full sm:w-44"
          />
          <StaffFormSelect
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "ALL", label: "Tất cả trạng thái" },
              { value: "ACTIVE", label: "Đang hoạt động" },
              { value: "SUSPENDED", label: "Tạm ngưng" },
            ]}
            className="w-full sm:w-48"
          />
          <div className="hidden flex-1 sm:block" />
          <button type="button" className="btn-crimson w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Thêm trường
          </button>
        </div>
        <p className="text-sm text-content-muted">{filtered.length} trường</p>
        <StaffDataTable
          columns={columns}
          data={filtered}
          emptyMessage="Không có trường phù hợp."
          onRowClick={(s) => router.push(ROUTES.STAFF.ADMIN.SCHOOL_DETAIL(s.id))}
        />
      </Panel>

      <CreateSchoolDialog open={createOpen} onOpenChange={setCreateOpen} schools={schools} />

      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(o) => !o && setToggleTarget(null)}
        title={toggleTarget?.status === "ACTIVE" ? "Tạm ngưng trường?" : "Kích hoạt lại trường?"}
        description={
          toggleTarget?.status === "ACTIVE"
            ? `Mọi tài khoản của ${toggleTarget?.name ?? ""} (quản trị, giáo viên, học sinh) sẽ không đăng nhập được cho đến khi kích hoạt lại.`
            : `${toggleTarget?.name ?? ""} sẽ dùng lại được gói ${toggleTarget ? PLAN_LABELS[toggleTarget.plan] : ""}.`
        }
        confirmLabel={toggleTarget?.status === "ACTIVE" ? "Tạm ngưng" : "Kích hoạt"}
        variant={toggleTarget?.status === "ACTIVE" ? "danger" : "primary"}
        onConfirm={() => {
          if (!toggleTarget) return;
          const next = toggleTarget.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
          updateSchool(toggleTarget.id, { status: next });
          toast.success(next === "ACTIVE" ? `Đã kích hoạt ${toggleTarget.name}` : `Đã tạm ngưng ${toggleTarget.name}`);
          setToggleTarget(null);
        }}
      />
    </div>
  );
}

const emptyForm = () => ({
  name: "",
  code: "",
  province: "",
  address: "",
  plan: "ENTERPRISE_1" as SchoolPlan,
  contractEndsAt: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
});

function CreateSchoolDialog({ open, onOpenChange, schools }: { open: boolean; onOpenChange: (o: boolean) => void; schools: School[] }) {
  const router = useRouter();
  const createSchool = useSaasStore((s) => s.createSchool);
  const [form, setForm] = React.useState(emptyForm);
  const [touched, setTouched] = React.useState(false);
  const set = (k: keyof ReturnType<typeof emptyForm>) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const close = (o: boolean) => {
    if (!o) {
      setForm(emptyForm());
      setTouched(false);
    }
    onOpenChange(o);
  };

  const code = form.code.trim().toUpperCase();
  const errors = {
    name: form.name.trim() ? null : "Nhập tên trường",
    code: !code ? "Nhập mã trường" : schools.some((s) => s.code.toUpperCase() === code) ? "Mã trường đã tồn tại" : null,
    province: form.province.trim() ? null : "Nhập tỉnh / thành phố",
    contractEndsAt: form.contractEndsAt ? null : "Chọn ngày hết hạn hợp đồng",
    adminName: form.adminName.trim() ? null : "Nhập họ tên quản trị trường",
    adminEmail: isValidEmail(form.adminEmail) ? null : "Email không hợp lệ",
  };
  const hasError = Object.values(errors).some(Boolean);
  const defaults = PLAN_DEFAULTS[form.plan];
  const err = (k: keyof typeof errors) => (touched ? errors[k] : null);

  function save() {
    setTouched(true);
    if (hasError) return;
    const school = createSchool(
      {
        name: form.name.trim(),
        code,
        province: form.province.trim(),
        address: form.address.trim() || undefined,
        plan: form.plan,
        ...defaults,
        status: "ACTIVE",
        contractEndsAt: form.contractEndsAt,
      },
      {
        fullName: form.adminName.trim(),
        email: form.adminEmail.trim().toLowerCase(),
        phone: form.adminPhone.trim() || undefined,
        status: "INVITED",
      },
    );
    toast.success(`Đã tạo ${school.name} và gửi email mời tới ${form.adminEmail.trim().toLowerCase()}`);
    close(false);
    router.push(ROUTES.STAFF.ADMIN.SCHOOL_DETAIL(school.id));
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-2xl")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>Thêm trường</DialogTitle>
          <DialogDescription className="text-content-muted">
            Tạo trường cùng tài khoản quản trị trường đầu tiên. Quản trị trường sẽ nhận email mời kích hoạt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <fieldset className="space-y-4">
            <legend className="mb-3 text-sm font-bold text-content-heading">Thông tin trường</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tên trường" required error={err("name")} className="sm:col-span-2">
                <StaffFormInput value={form.name} onChange={set("name")} placeholder="THPT Nguyễn Du" />
              </Field>
              <Field label="Mã trường" required error={err("code")}>
                <StaffFormInput value={form.code} onChange={set("code")} placeholder="ND-HCM" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tỉnh / thành" required error={err("province")}>
                <StaffFormInput value={form.province} onChange={set("province")} placeholder="TP. Hồ Chí Minh" />
              </Field>
              <Field label="Địa chỉ" className="sm:col-span-2">
                <StaffFormInput value={form.address} onChange={set("address")} placeholder="Số nhà, đường, quận" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Gói"
                required
                hint={`${formatNumber(defaults.dailyTokensPerStudent)} token/HS/ngày · ${formatNumber(defaults.maxStudents)} học sinh`}
              >
                <StaffFormSelect
                  value={form.plan}
                  onValueChange={(v) => setForm((f) => ({ ...f, plan: v }))}
                  options={PLANS.map((p) => ({ value: p, label: PLAN_LABELS[p] }))}
                  className="w-full"
                />
              </Field>
              <Field label="Hết hạn hợp đồng" required error={err("contractEndsAt")}>
                <StaffFormInput type="date" value={form.contractEndsAt} onChange={set("contractEndsAt")} />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-t border-[var(--border-default)] pt-4">
            <legend className="mb-3 text-sm font-bold text-content-heading">Quản trị trường</legend>
            <Field label="Họ và tên" required error={err("adminName")}>
              <StaffFormInput value={form.adminName} onChange={set("adminName")} placeholder="Nguyễn Thị B" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" required error={err("adminEmail")}>
                <StaffFormInput type="email" value={form.adminEmail} onChange={set("adminEmail")} placeholder="admin@truong.edu.vn" />
              </Field>
              <Field label="Số điện thoại">
                <StaffFormInput type="tel" value={form.adminPhone} onChange={set("adminPhone")} placeholder="0903 000 000" />
              </Field>
            </div>
          </fieldset>
        </div>

        <DialogFooter className="gap-2">
          <button type="button" className="btn-line" onClick={() => close(false)}>
            Hủy
          </button>
          <button type="button" className="btn-crimson" onClick={save}>
            Tạo trường
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

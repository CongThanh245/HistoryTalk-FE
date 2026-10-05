"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, KeyRound, LockKeyhole, LockKeyholeOpen, Plus, Trash2, Upload, Users } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { StaffStatCard, StaffStatsGrid } from "@/components/staff/staff-stat-card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ACCOUNT_STATUS_LABELS,
  AccountStatusBadge,
  DIALOG_CLASS,
  DIALOG_TITLE_CLASS,
  Field,
  GRADE_OPTIONS,
  IconAction,
  Panel,
  SaasShell,
  SearchInput,
  formatDate,
  formatNumber,
  normalizeText,
} from "@/components/saas/saas-ui";
import { StudentImportDialog, downloadStudentTemplate } from "@/components/saas/student-import-dialog";
import { useSchoolData } from "@/features/saas/hooks";
import { useDemoSchoolId, useSaasStore } from "@/features/saas/store";
import { parseDob } from "@/features/saas/student-import";
import type { AccountStatus, Classroom, School, StudentAccount } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

const NO_CLASS = "__none__";

/** School Admin: create and bulk-import Student accounts (Role Matrix row 4). */
export default function SchoolStudentsPage() {
  return (
    <SaasShell
      title="Học sinh"
      description="Tạo tài khoản học sinh, nhập hàng loạt từ file CSV, khóa / mở khóa và cấp lại mật khẩu."
    >
      <StudentsContent />
    </SaasShell>
  );
}

function StudentsContent() {
  const schoolId = useDemoSchoolId();
  const { school, students, classes, classByStudent } = useSchoolData(schoolId);
  const updateStudent = useSaasStore((s) => s.updateStudent);
  const removeStudent = useSaasStore((s) => s.removeStudent);

  const [search, setSearch] = React.useState("");
  const [grade, setGrade] = React.useState("ALL");
  const [status, setStatus] = React.useState<"ALL" | AccountStatus>("ALL");
  const [classFilter, setClassFilter] = React.useState("ALL");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [lockTarget, setLockTarget] = React.useState<StudentAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<StudentAccount | null>(null);

  const filtered = React.useMemo(() => {
    const q = normalizeText(search);
    return students
      .filter((s) => grade === "ALL" || s.grade === Number(grade))
      .filter((s) => status === "ALL" || s.status === status)
      .filter((s) => {
        if (classFilter === "ALL") return true;
        const c = classByStudent.get(s.id);
        return classFilter === NO_CLASS ? !c : c?.id === classFilter;
      })
      .filter((s) => !q || normalizeText(s.fullName).includes(q) || s.studentCode.toLowerCase().includes(q) || s.username.includes(q));
  }, [students, grade, status, classFilter, search, classByStudent]);

  const columns = React.useMemo<ColumnDef<StudentAccount>[]>(
    () => [
      {
        id: "name",
        accessorKey: "fullName",
        header: "Học sinh",
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <p className="text-sm font-semibold text-content-heading">{row.original.fullName}</p>
            <p className="text-xs text-content-muted">Tên đăng nhập: {row.original.username}</p>
          </div>
        ),
      },
      { accessorKey: "studentCode", header: "Mã HS", cell: ({ row }) => <span className="font-mono text-xs">{row.original.studentCode}</span> },
      { accessorKey: "grade", header: "Khối", cell: ({ row }) => <span className="tabular-nums">{row.original.grade}</span> },
      {
        id: "class",
        header: "Lớp",
        cell: ({ row }) => {
          const c = classByStudent.get(row.original.id);
          return c ? <span className="font-medium">{c.name}</span> : <span className="text-[var(--status-warning)]">Chưa xếp lớp</span>;
        },
      },
      { accessorKey: "dateOfBirth", header: "Ngày sinh", cell: ({ row }) => <span className="text-xs">{formatDate(row.original.dateOfBirth)}</span> },
      {
        accessorKey: "tokensUsedToday",
        header: "Token hôm nay",
        cell: ({ row }) => (
          <span className="tabular-nums text-xs">
            {formatNumber(row.original.tokensUsedToday)}
            {school && <span className="text-content-muted"> / {formatNumber(school.dailyTokensPerStudent)}</span>}
          </span>
        ),
      },
      { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <AccountStatusBadge status={row.original.status} /> },
      {
        id: "actions",
        header: () => <div className="pr-2 text-right">Thao tác</div>,
        cell: ({ row }) => {
          const s = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <IconAction label="Cấp lại mật khẩu" onClick={() => toast.success(`Mật khẩu tạm đã gửi · ${s.username}`)}>
                <KeyRound className="h-4 w-4" />
              </IconAction>
              {s.status === "LOCKED" ? (
                <IconAction
                  label="Mở khóa"
                  tone="success"
                  onClick={() => {
                    updateStudent(s.id, { status: "ACTIVE" });
                    toast.success(`Đã mở khóa ${s.fullName}`);
                  }}
                >
                  <LockKeyholeOpen className="h-4 w-4" />
                </IconAction>
              ) : (
                <IconAction label="Khóa tài khoản" tone="danger" onClick={() => setLockTarget(s)}>
                  <LockKeyhole className="h-4 w-4" />
                </IconAction>
              )}
              <IconAction label="Xóa tài khoản" tone="danger" onClick={() => setDeleteTarget(s)}>
                <Trash2 className="h-4 w-4" />
              </IconAction>
            </div>
          );
        },
      },
    ],
    [classByStudent, school, updateStudent],
  );

  if (!school) return <p className="text-sm text-content-muted">Không tìm thấy dữ liệu trường.</p>;

  const unassigned = students.filter((s) => !classByStudent.has(s.id)).length;

  return (
    <div className="space-y-6">
      <StaffStatsGrid>
        <StaffStatCard label="Tổng học sinh" value={formatNumber(students.length)} icon={<Users className="h-5 w-5" />} tone="blue" />
        <StaffStatCard label="Giới hạn gói" value={formatNumber(school.maxStudents)} tone="muted" />
        <StaffStatCard label="Chưa xếp lớp" value={unassigned} tone="amber" />
        <StaffStatCard label="Đã khóa" value={students.filter((s) => s.status === "LOCKED").length} tone="red" />
      </StaffStatsGrid>

      <Panel>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button type="button" className="btn-crimson w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Thêm học sinh
          </button>
          <button type="button" className="btn-ink w-full sm:w-auto" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" aria-hidden="true" /> Nhập từ file
          </button>
          <button type="button" className="btn-line w-full sm:w-auto" onClick={downloadStudentTemplate}>
            <Download className="h-4 w-4" aria-hidden="true" /> Tải file mẫu
          </button>
        </div>

        <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên, mã HS..." />
          <StaffFormSelect
            value={grade}
            onValueChange={setGrade}
            options={[{ value: "ALL", label: "Tất cả khối" }, ...GRADE_OPTIONS.map((g) => ({ value: String(g), label: `Khối ${g}` }))]}
            className="w-full sm:w-40"
          />
          <StaffFormSelect
            value={classFilter}
            onValueChange={setClassFilter}
            options={[
              { value: "ALL", label: "Tất cả lớp" },
              { value: NO_CLASS, label: "Chưa xếp lớp" },
              ...classes.map((c) => ({ value: c.id, label: `Lớp ${c.name}` })),
            ]}
            className="w-full sm:w-40"
          />
          <StaffFormSelect
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "ALL", label: "Tất cả trạng thái" },
              ...(Object.keys(ACCOUNT_STATUS_LABELS) as AccountStatus[]).map((s) => ({ value: s, label: ACCOUNT_STATUS_LABELS[s] })),
            ]}
            className="w-full sm:w-48"
          />
        </div>

        <p className="text-sm text-content-muted">
          {filtered.length} / {students.length} học sinh
        </p>
        <StaffDataTable columns={columns} data={filtered} emptyMessage="Không có học sinh phù hợp." />
      </Panel>

      <CreateStudentDialog open={createOpen} onOpenChange={setCreateOpen} school={school} students={students} classes={classes} />
      <StudentImportDialog open={importOpen} onOpenChange={setImportOpen} school={school} students={students} classes={classes} />

      <ConfirmDialog
        open={!!lockTarget}
        onOpenChange={(o) => !o && setLockTarget(null)}
        title="Khóa tài khoản học sinh?"
        description={`${lockTarget?.fullName ?? ""} sẽ không đăng nhập được cho đến khi được mở khóa.`}
        confirmLabel="Khóa tài khoản"
        variant="danger"
        onConfirm={() => {
          if (!lockTarget) return;
          updateStudent(lockTarget.id, { status: "LOCKED" });
          toast.success(`Đã khóa ${lockTarget.fullName}`);
          setLockTarget(null);
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Xóa tài khoản học sinh?"
        description={`${deleteTarget?.fullName ?? ""} sẽ bị xóa khỏi trường và mọi lớp. Không thể hoàn tác.`}
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={() => {
          if (!deleteTarget) return;
          removeStudent(deleteTarget.id);
          toast.success(`Đã xóa ${deleteTarget.fullName}`);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function CreateStudentDialog({
  open,
  onOpenChange,
  school,
  students,
  classes,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  school: School;
  students: StudentAccount[];
  classes: Classroom[];
}) {
  const createStudents = useSaasStore((s) => s.createStudents);
  const empty = { fullName: "", studentCode: "", grade: "10", dateOfBirth: "", classId: NO_CLASS };
  const [form, setForm] = React.useState(empty);
  const [touched, setTouched] = React.useState(false);

  const close = (o: boolean) => {
    if (!o) {
      setForm(empty);
      setTouched(false);
    }
    onOpenChange(o);
  };

  const code = form.studentCode.trim().toUpperCase();
  const cls = classes.find((c) => c.id === form.classId);
  const errors = {
    fullName: form.fullName.trim() ? null : "Nhập họ và tên",
    studentCode: !code
      ? "Nhập mã học sinh"
      : !/^[A-Z0-9_-]+$/.test(code)
        ? "Chỉ gồm chữ không dấu, số, - và _"
        : students.some((s) => s.studentCode.toUpperCase() === code)
          ? "Mã học sinh đã tồn tại"
          : null,
    dateOfBirth: form.dateOfBirth && !parseDob(form.dateOfBirth) ? "Ngày sinh không hợp lệ" : null,
    classId: cls && cls.grade !== Number(form.grade) ? `Lớp ${cls.name} thuộc khối ${cls.grade}` : null,
    seats: students.length >= school.maxStudents ? "Trường đã dùng hết số tài khoản học sinh của gói" : null,
  };
  const hasError = Object.values(errors).some(Boolean);
  const gradeClasses = classes.filter((c) => c.grade === Number(form.grade));

  function save() {
    setTouched(true);
    if (hasError) return;
    createStudents(
      [
        {
          schoolId: school.id,
          fullName: form.fullName.trim(),
          studentCode: code,
          username: code.toLowerCase(),
          grade: Number(form.grade),
          dateOfBirth: parseDob(form.dateOfBirth) ?? undefined,
          status: "ACTIVE",
        },
      ],
      cls?.id,
    );
    toast.success(`Đã tạo tài khoản ${code.toLowerCase()} · mật khẩu tạm đã gửi`);
    close(false);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>Thêm học sinh</DialogTitle>
          <DialogDescription className="text-content-muted">Tên đăng nhập là mã học sinh viết thường.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Họ và tên" required error={touched ? errors.fullName : null}>
            <StaffFormInput value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Nguyễn Văn An" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Mã học sinh"
              required
              error={touched ? errors.studentCode : null}
              hint={code ? `Tên đăng nhập: ${code.toLowerCase()}` : undefined}
            >
              <StaffFormInput value={form.studentCode} onChange={(e) => setForm((f) => ({ ...f, studentCode: e.target.value }))} placeholder="HS10101" />
            </Field>
            <Field label="Khối" required>
              <StaffFormSelect
                value={form.grade}
                onValueChange={(v) => setForm((f) => ({ ...f, grade: v, classId: NO_CLASS }))}
                options={GRADE_OPTIONS.map((g) => ({ value: String(g), label: `Khối ${g}` }))}
                className="w-full"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ngày sinh" error={touched ? errors.dateOfBirth : null}>
              <StaffFormInput type="date" value={form.dateOfBirth} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
            </Field>
            <Field label="Lớp" error={touched ? errors.classId : null}>
              <StaffFormSelect
                value={form.classId}
                onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}
                options={[{ value: NO_CLASS, label: "Chưa xếp lớp" }, ...gradeClasses.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))]}
                className="w-full"
              />
            </Field>
          </div>
          {errors.seats && <p className="text-sm text-[var(--accent-danger)]">{errors.seats}</p>}
        </div>
        <DialogFooter className="gap-2">
          <button type="button" className="btn-line" onClick={() => close(false)}>
            Hủy
          </button>
          <button type="button" className="btn-crimson" onClick={save}>
            Tạo tài khoản
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

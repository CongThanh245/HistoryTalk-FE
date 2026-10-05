"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { LockKeyhole, LockKeyholeOpen, MailPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ACCOUNT_STATUS_LABELS,
  AccountStatusBadge,
  DIALOG_CLASS,
  DIALOG_TITLE_CLASS,
  Field,
  IconAction,
  Panel,
  SaasShell,
  SearchInput,
  formatDate,
  isValidEmail,
  normalizeText,
} from "@/components/saas/saas-ui";
import { useSchoolData } from "@/features/saas/hooks";
import { useDemoSchoolId, useSaasStore } from "@/features/saas/store";
import type { AccountStatus, TeacherAccount } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

const SUBJECTS = ["Lịch sử", "Địa lý", "Ngữ văn", "Giáo dục công dân", "Khác"];

/** School Admin: create and manage Teacher accounts (Role Matrix row 3). */
export default function SchoolTeachersPage() {
  return (
    <SaasShell title="Giáo viên" description="Tạo tài khoản giáo viên, khóa / mở khóa và gửi lại email mời kích hoạt.">
      <TeachersContent />
    </SaasShell>
  );
}

function TeachersContent() {
  const schoolId = useDemoSchoolId();
  const { teachers, classes } = useSchoolData(schoolId);
  const updateTeacher = useSaasStore((s) => s.updateTeacher);
  const removeTeacher = useSaasStore((s) => s.removeTeacher);

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"ALL" | AccountStatus>("ALL");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TeacherAccount | null>(null);
  const [lockTarget, setLockTarget] = React.useState<TeacherAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TeacherAccount | null>(null);

  const filtered = React.useMemo(() => {
    const q = normalizeText(search);
    return teachers.filter(
      (t) =>
        (status === "ALL" || t.status === status) &&
        (!q || normalizeText(t.fullName).includes(q) || t.email.toLowerCase().includes(q) || normalizeText(t.subject).includes(q)),
    );
  }, [teachers, search, status]);

  const columns = React.useMemo<ColumnDef<TeacherAccount>[]>(
    () => [
      {
        id: "name",
        accessorKey: "fullName",
        header: "Giáo viên",
        cell: ({ row }) => (
          <div className="min-w-[200px]">
            <p className="text-sm font-semibold text-content-heading">{row.original.fullName}</p>
            <p className="text-xs text-content-muted">{row.original.email}</p>
          </div>
        ),
      },
      { accessorKey: "subject", header: "Bộ môn" },
      {
        id: "classes",
        header: "Lớp phụ trách",
        cell: ({ row }) => {
          const t = row.original;
          const homeroom = classes.filter((c) => c.homeroomTeacherId === t.id).map((c) => c.name);
          const teaching = classes.filter((c) => c.teacherIds.includes(t.id) && c.homeroomTeacherId !== t.id).map((c) => c.name);
          if (!homeroom.length && !teaching.length) return <span className="text-content-muted">—</span>;
          return (
            <div className="text-xs">
              {homeroom.length > 0 && <p>Chủ nhiệm: <span className="font-semibold">{homeroom.join(", ")}</span></p>}
              {teaching.length > 0 && <p>Giảng dạy: {teaching.join(", ")}</p>}
            </div>
          );
        },
      },
      { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <AccountStatusBadge status={row.original.status} /> },
      { accessorKey: "createdAt", header: "Ngày tạo", cell: ({ row }) => <span className="text-xs text-content-muted">{formatDate(row.original.createdAt)}</span> },
      {
        id: "actions",
        header: () => <div className="pr-2 text-right">Thao tác</div>,
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {t.status === "INVITED" && (
                <IconAction label="Gửi lại email mời" onClick={() => toast.success(`Đã gửi lại email mời tới ${t.email}`)}>
                  <MailPlus className="h-4 w-4" />
                </IconAction>
              )}
              {t.status === "LOCKED" ? (
                <IconAction
                  label="Mở khóa"
                  tone="success"
                  onClick={() => {
                    updateTeacher(t.id, { status: "ACTIVE" });
                    toast.success(`Đã mở khóa ${t.fullName}`);
                  }}
                >
                  <LockKeyholeOpen className="h-4 w-4" />
                </IconAction>
              ) : (
                <IconAction label="Khóa tài khoản" tone="danger" onClick={() => setLockTarget(t)}>
                  <LockKeyhole className="h-4 w-4" />
                </IconAction>
              )}
              <IconAction
                label="Chỉnh sửa"
                onClick={() => {
                  setEditing(t);
                  setFormOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </IconAction>
              <IconAction label="Xóa tài khoản" tone="danger" onClick={() => setDeleteTarget(t)}>
                <Trash2 className="h-4 w-4" />
              </IconAction>
            </div>
          );
        },
      },
    ],
    [classes, updateTeacher],
  );

  return (
    <Panel>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm tên, email, bộ môn..." />
        <StaffFormSelect
          value={status}
          onValueChange={setStatus}
          options={[
            { value: "ALL", label: "Tất cả trạng thái" },
            ...(Object.keys(ACCOUNT_STATUS_LABELS) as AccountStatus[]).map((s) => ({ value: s, label: ACCOUNT_STATUS_LABELS[s] })),
          ]}
          className="w-full sm:w-48"
        />
        <div className="hidden flex-1 sm:block" />
        <button
          type="button"
          className="btn-crimson w-full sm:w-auto"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Thêm giáo viên
        </button>
      </div>
      <p className="text-sm text-content-muted">{filtered.length} giáo viên</p>
      <StaffDataTable columns={columns} data={filtered} emptyMessage="Không có giáo viên phù hợp." />

      <TeacherFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} schoolId={schoolId} teachers={teachers} />

      <ConfirmDialog
        open={!!lockTarget}
        onOpenChange={(o) => !o && setLockTarget(null)}
        title="Khóa tài khoản giáo viên?"
        description={`${lockTarget?.fullName ?? ""} sẽ không đăng nhập được cho đến khi được mở khóa. Lớp được phân công vẫn giữ nguyên.`}
        confirmLabel="Khóa tài khoản"
        variant="danger"
        onConfirm={() => {
          if (!lockTarget) return;
          updateTeacher(lockTarget.id, { status: "LOCKED" });
          toast.success(`Đã khóa ${lockTarget.fullName}`);
          setLockTarget(null);
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Xóa tài khoản giáo viên?"
        description={`${deleteTarget?.fullName ?? ""} sẽ bị gỡ khỏi mọi lớp đang chủ nhiệm hoặc giảng dạy. Không thể hoàn tác.`}
        confirmLabel="Xóa"
        variant="danger"
        onConfirm={() => {
          if (!deleteTarget) return;
          removeTeacher(deleteTarget.id);
          toast.success(`Đã xóa ${deleteTarget.fullName}`);
          setDeleteTarget(null);
        }}
      />
    </Panel>
  );
}

function TeacherFormDialog({
  open,
  onOpenChange,
  editing,
  schoolId,
  teachers,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: TeacherAccount | null;
  schoolId: string;
  teachers: TeacherAccount[];
}) {
  const createTeacher = useSaasStore((s) => s.createTeacher);
  const updateTeacher = useSaasStore((s) => s.updateTeacher);
  const [form, setForm] = React.useState({ fullName: "", email: "", subject: "Lịch sử" });
  const [touched, setTouched] = React.useState(false);
  const [lastOpen, setLastOpen] = React.useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setTouched(false);
      setForm(editing ? { fullName: editing.fullName, email: editing.email, subject: editing.subject } : { fullName: "", email: "", subject: "Lịch sử" });
    }
  }

  const email = form.email.trim().toLowerCase();
  const nameError = form.fullName.trim() ? null : "Nhập họ và tên";
  const emailError = !isValidEmail(email)
    ? "Email không hợp lệ"
    : teachers.some((t) => t.id !== editing?.id && t.email.toLowerCase() === email)
      ? "Email đã được dùng cho giáo viên khác"
      : null;
  const subjectOptions = Array.from(new Set([...SUBJECTS, form.subject])).map((s) => ({ value: s, label: s }));

  function save() {
    setTouched(true);
    if (nameError || emailError) return;
    const data = { fullName: form.fullName.trim(), email, subject: form.subject };
    if (editing) {
      updateTeacher(editing.id, data);
      toast.success("Đã cập nhật giáo viên");
    } else {
      createTeacher({ ...data, schoolId, status: "INVITED" });
      toast.success(`Đã tạo tài khoản và gửi email mời tới ${email}`);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>{editing ? "Sửa giáo viên" : "Thêm giáo viên"}</DialogTitle>
          <DialogDescription className="text-content-muted">
            {editing ? "Cập nhật thông tin tài khoản giáo viên." : "Giáo viên sẽ nhận email mời để đặt mật khẩu và kích hoạt tài khoản."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Họ và tên" required error={touched ? nameError : null}>
            <StaffFormInput value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Nguyễn Văn A" />
          </Field>
          <Field label="Email" required error={touched ? emailError : null}>
            <StaffFormInput
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="gv@truong.edu.vn"
            />
          </Field>
          <Field label="Bộ môn">
            <StaffFormSelect value={form.subject} onValueChange={(v) => setForm((f) => ({ ...f, subject: v }))} options={subjectOptions} className="w-full" />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <button type="button" className="btn-line" onClick={() => onOpenChange(false)}>
            Hủy
          </button>
          <button type="button" className="btn-crimson" onClick={save}>
            {editing ? "Lưu thay đổi" : "Tạo và gửi lời mời"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

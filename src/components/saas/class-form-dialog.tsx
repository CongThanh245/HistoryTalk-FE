"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, GRADE_OPTIONS } from "@/components/saas/saas-ui";
import { useSaasStore } from "@/features/saas/store";
import type { Classroom, TeacherAccount } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

const NO_HOMEROOM = "__none__";

interface FormState {
  name: string;
  grade: string;
  schoolYear: string;
  homeroomTeacherId: string;
  teacherIds: string[];
}

const emptyForm = (): FormState => ({ name: "", grade: "10", schoolYear: "2026-2027", homeroomTeacherId: NO_HOMEROOM, teacherIds: [] });

/** Create / edit a class of the school (Role Matrix row 6). */
export function ClassFormDialog({
  open,
  onOpenChange,
  schoolId,
  editing,
  teachers,
  existingClasses,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  editing: Classroom | null;
  teachers: TeacherAccount[];
  existingClasses: Classroom[];
}) {
  const createClass = useSaasStore((s) => s.createClass);
  const updateClass = useSaasStore((s) => s.updateClass);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [touched, setTouched] = React.useState(false);

  // Reset the form each time the dialog opens (state lives in the dialog, derived from props on open).
  const [lastOpen, setLastOpen] = React.useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setTouched(false);
      setForm(
        editing
          ? {
              name: editing.name,
              grade: String(editing.grade),
              schoolYear: editing.schoolYear,
              homeroomTeacherId: editing.homeroomTeacherId ?? NO_HOMEROOM,
              teacherIds: editing.teacherIds,
            }
          : emptyForm(),
      );
    }
  }

  const name = form.name.trim();
  const duplicate = existingClasses.some(
    (c) => c.id !== editing?.id && c.name.toLowerCase() === name.toLowerCase() && c.schoolYear === form.schoolYear.trim(),
  );
  const nameError = !name ? "Nhập tên lớp" : duplicate ? "Tên lớp đã tồn tại trong năm học này" : null;
  const yearError = /^\d{4}-\d{4}$/.test(form.schoolYear.trim()) ? null : "Định dạng năm học: 2026-2027";
  const valid = !nameError && !yearError;

  const selectable = teachers.filter((t) => t.status !== "LOCKED" || form.teacherIds.includes(t.id) || form.homeroomTeacherId === t.id);
  const homeroomOptions = [
    { value: NO_HOMEROOM, label: "Chưa phân công" },
    ...selectable.map((t) => ({ value: t.id, label: `${t.fullName} · ${t.subject}` })),
  ];

  function save() {
    setTouched(true);
    if (!valid) return;
    const homeroomTeacherId = form.homeroomTeacherId === NO_HOMEROOM ? null : form.homeroomTeacherId;
    const payload = {
      name,
      grade: Number(form.grade),
      schoolYear: form.schoolYear.trim(),
      homeroomTeacherId,
      teacherIds: form.teacherIds,
    };
    if (editing) {
      updateClass(editing.id, payload);
      toast.success(`Đã cập nhật lớp ${name}`);
    } else {
      createClass({ ...payload, schoolId });
      toast.success(`Đã tạo lớp ${name}`);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>{editing ? `Sửa lớp ${editing.name}` : "Tạo lớp mới"}</DialogTitle>
          <DialogDescription className="text-content-muted">
            Phân công giáo viên chủ nhiệm và giáo viên dạy Lịch sử cho lớp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tên lớp" required error={touched ? nameError : null} className="sm:col-span-1">
              <StaffFormInput value={form.name} placeholder="VD: 10A3" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Khối" required>
              <StaffFormSelect
                value={form.grade}
                onValueChange={(v) => setForm((f) => ({ ...f, grade: v }))}
                options={GRADE_OPTIONS.map((g) => ({ value: String(g), label: `Khối ${g}` }))}
                className="w-full"
              />
            </Field>
            <Field label="Năm học" required error={touched ? yearError : null}>
              <StaffFormInput value={form.schoolYear} onChange={(e) => setForm((f) => ({ ...f, schoolYear: e.target.value }))} />
            </Field>
          </div>

          <Field label="Giáo viên chủ nhiệm">
            <StaffFormSelect
              value={form.homeroomTeacherId}
              onValueChange={(v) => setForm((f) => ({ ...f, homeroomTeacherId: v }))}
              options={homeroomOptions}
              className="w-full"
            />
          </Field>

          <Field label="Giáo viên giảng dạy" hint="Giáo viên được chọn sẽ thấy lớp trong mục “Lớp của tôi”.">
            <div className="max-h-48 overflow-y-auto rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)]">
              {selectable.length === 0 ? (
                <p className="p-3 text-sm text-content-muted">Trường chưa có giáo viên.</p>
              ) : (
                <ul className="divide-y divide-[var(--border-default)]">
                  {selectable.map((t) => (
                    <li key={t.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-[var(--status-neutral-bg)]">
                        <Checkbox
                          checked={form.teacherIds.includes(t.id)}
                          onCheckedChange={(v) =>
                            setForm((f) => ({
                              ...f,
                              teacherIds: v === true ? [...f.teacherIds, t.id] : f.teacherIds.filter((x) => x !== t.id),
                            }))
                          }
                        />
                        <span className="min-w-0 flex-1 truncate font-medium text-content-heading">{t.fullName}</span>
                        <span className="text-xs text-content-muted">{t.subject}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>
        </div>

        <DialogFooter className="gap-2">
          <button type="button" className="btn-line" onClick={() => onOpenChange(false)}>
            Hủy
          </button>
          <button type="button" className="btn-crimson" onClick={save}>
            {editing ? "Lưu thay đổi" : "Tạo lớp"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

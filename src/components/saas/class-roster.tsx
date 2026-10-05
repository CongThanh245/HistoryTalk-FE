"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRightLeft, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AccountStatusBadge,
  DIALOG_CLASS,
  DIALOG_TITLE_CLASS,
  Field,
  IconAction,
  NeutralBadge,
  SearchInput,
  normalizeText,
} from "@/components/saas/saas-ui";
import { useSaasStore } from "@/features/saas/store";
import type { Classroom, StudentAccount } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

/** Vietnamese class lists are sorted by given name (the last word). */
export const givenName = (fullName: string) => fullName.trim().split(/\s+/).pop() ?? "";

interface ClassRosterProps {
  classroom: Classroom;
  /** Students this user may pick from (the school's students). */
  pool: StudentAccount[];
  /** Classes a student can be moved to (Role Matrix row 7). */
  moveTargets: Classroom[];
  /** Current class of each student, to warn before moving them in. */
  classByStudent: Map<string, Classroom>;
  editable?: boolean;
}

/** Roster of one class with add / move / remove (Role Matrix row 7). Shared by School Admin and Teacher. */
export function ClassRoster({ classroom, pool, moveTargets, classByStudent, editable = true }: ClassRosterProps) {
  const addStudentsToClass = useSaasStore((s) => s.addStudentsToClass);
  const moveStudent = useSaasStore((s) => s.moveStudent);
  const removeStudentFromClass = useSaasStore((s) => s.removeStudentFromClass);

  const [search, setSearch] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [moveTarget, setMoveTarget] = React.useState<StudentAccount | null>(null);
  const [removeTarget, setRemoveTarget] = React.useState<StudentAccount | null>(null);

  const roster = React.useMemo(() => {
    const byId = new Map(pool.map((s) => [s.id, s]));
    return classroom.studentIds
      .map((id) => byId.get(id))
      .filter((s): s is StudentAccount => !!s)
      .sort((a, b) => givenName(a.fullName).localeCompare(givenName(b.fullName), "vi") || a.fullName.localeCompare(b.fullName, "vi"));
  }, [classroom.studentIds, pool]);

  const filtered = React.useMemo(() => {
    const q = normalizeText(search);
    if (!q) return roster;
    return roster.filter((s) => normalizeText(s.fullName).includes(q) || s.studentCode.toLowerCase().includes(q));
  }, [roster, search]);

  const columns = React.useMemo<ColumnDef<StudentAccount>[]>(() => {
    const cols: ColumnDef<StudentAccount>[] = [
      {
        id: "index",
        header: "STT",
        cell: ({ row }) => <span className="tabular-nums text-content-muted">{row.index + 1}</span>,
      },
      {
        id: "name",
        accessorKey: "fullName",
        header: "Họ và tên",
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <p className="text-sm font-semibold text-content-heading">{row.original.fullName}</p>
            <p className="text-xs text-content-muted">{row.original.username}</p>
          </div>
        ),
      },
      { accessorKey: "studentCode", header: "Mã HS", cell: ({ row }) => <span className="font-mono text-xs">{row.original.studentCode}</span> },
      { accessorKey: "grade", header: "Khối", cell: ({ row }) => <span className="tabular-nums">{row.original.grade}</span> },
      { accessorKey: "status", header: "Trạng thái", cell: ({ row }) => <AccountStatusBadge status={row.original.status} /> },
    ];
    if (editable) {
      cols.push({
        id: "actions",
        header: () => <div className="pr-2 text-right">Thao tác</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <IconAction label="Chuyển lớp" onClick={() => setMoveTarget(row.original)} disabled={moveTargets.length === 0}>
              <ArrowRightLeft className="h-4 w-4" />
            </IconAction>
            <IconAction label="Xóa khỏi lớp" tone="danger" onClick={() => setRemoveTarget(row.original)}>
              <UserMinus className="h-4 w-4" />
            </IconAction>
          </div>
        ),
      });
    }
    return cols;
  }, [editable, moveTargets.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm học sinh trong lớp..." />
        {editable && (
          <button type="button" className="btn-crimson w-full sm:w-auto" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Thêm học sinh
          </button>
        )}
      </div>

      <p className="text-sm text-content-muted">
        {roster.length} học sinh{search && ` · ${filtered.length} kết quả`}
      </p>

      <StaffDataTable
        columns={columns}
        data={filtered}
        emptyMessage={roster.length ? "Không tìm thấy học sinh phù hợp." : "Lớp chưa có học sinh."}
      />

      {editable && (
        <AddStudentsDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          classroom={classroom}
          pool={pool}
          classByStudent={classByStudent}
          onConfirm={(ids) => {
            const moving = ids.filter((id) => classByStudent.get(id) && classByStudent.get(id)!.id !== classroom.id);
            const fresh = ids.filter((id) => !moving.includes(id));
            if (fresh.length) addStudentsToClass(classroom.id, fresh);
            for (const id of moving) moveStudent(id, classByStudent.get(id)!.id, classroom.id);
            toast.success(`Đã thêm ${ids.length} học sinh vào lớp ${classroom.name}`);
            setAddOpen(false);
          }}
        />
      )}

      <MoveStudentDialog
        student={moveTarget}
        from={classroom}
        targets={moveTargets}
        onOpenChange={(o) => !o && setMoveTarget(null)}
        onConfirm={(toId) => {
          if (!moveTarget) return;
          const to = moveTargets.find((c) => c.id === toId);
          moveStudent(moveTarget.id, classroom.id, toId);
          toast.success(`Đã chuyển ${moveTarget.fullName} sang lớp ${to?.name ?? ""}`);
          setMoveTarget(null);
        }}
      />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title="Xóa khỏi lớp?"
        description={`${removeTarget?.fullName ?? ""} sẽ rời lớp ${classroom.name}. Tài khoản học sinh vẫn được giữ nguyên.`}
        confirmLabel="Xóa khỏi lớp"
        variant="danger"
        onConfirm={() => {
          if (!removeTarget) return;
          removeStudentFromClass(classroom.id, removeTarget.id);
          toast.success(`Đã xóa ${removeTarget.fullName} khỏi lớp ${classroom.name}`);
          setRemoveTarget(null);
        }}
      />
    </div>
  );
}

/* ───────────────────────── Add students ───────────────────────── */
function AddStudentsDialog({
  open,
  onOpenChange,
  classroom,
  pool,
  classByStudent,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroom: Classroom;
  pool: StudentAccount[];
  classByStudent: Map<string, Classroom>;
  onConfirm: (ids: string[]) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [sameGrade, setSameGrade] = React.useState(true);
  const [onlyUnassigned, setOnlyUnassigned] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const candidates = React.useMemo(() => {
    const q = normalizeText(search);
    return pool
      .filter((s) => !classroom.studentIds.includes(s.id))
      .filter((s) => !sameGrade || s.grade === classroom.grade)
      .filter((s) => !onlyUnassigned || !classByStudent.has(s.id))
      .filter((s) => !q || normalizeText(s.fullName).includes(q) || s.studentCode.toLowerCase().includes(q))
      .sort((a, b) => Number(classByStudent.has(a.id)) - Number(classByStudent.has(b.id)) || a.fullName.localeCompare(b.fullName, "vi"));
  }, [pool, classroom, sameGrade, onlyUnassigned, search, classByStudent]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = candidates.length > 0 && candidates.every((c) => selected.has(c.id));
  const movingCount = [...selected].filter((id) => classByStudent.has(id)).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setSelected(new Set());
          setSearch("");
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-xl")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>Thêm học sinh vào lớp {classroom.name}</DialogTitle>
          <DialogDescription className="text-content-muted">
            Chọn học sinh của trường chưa có trong lớp. Học sinh đang ở lớp khác sẽ được chuyển sang lớp này.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc mã HS..." className="sm:w-full" />
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <Checkbox checked={sameGrade} onCheckedChange={(v) => setSameGrade(v === true)} />
              Chỉ khối {classroom.grade}
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <Checkbox checked={onlyUnassigned} onCheckedChange={(v) => setOnlyUnassigned(v === true)} />
              Chỉ học sinh chưa xếp lớp
            </label>
          </div>

          <div className="max-h-[45dvh] overflow-y-auto rounded-[2px] border border-[var(--border-strong)]">
            {candidates.length === 0 ? (
              <p className="p-6 text-center text-sm text-content-muted">Không còn học sinh phù hợp.</p>
            ) : (
              <ul className="divide-y divide-[var(--border-default)]">
                <li className="flex items-center gap-3 bg-[var(--status-neutral-bg)] px-3 py-2">
                  <Checkbox
                    id="roster-select-all"
                    checked={allVisibleSelected}
                    onCheckedChange={(v) =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        for (const c of candidates) {
                          if (v === true) next.add(c.id);
                          else next.delete(c.id);
                        }
                        return next;
                      })
                    }
                  />
                  <label htmlFor="roster-select-all" className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    Chọn tất cả ({candidates.length})
                  </label>
                </li>
                {candidates.map((s) => {
                  const current = classByStudent.get(s.id);
                  return (
                    <li key={s.id}>
                      <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-[var(--status-neutral-bg)]">
                        <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-content-heading">{s.fullName}</span>
                          <span className="block text-xs text-content-muted">
                            {s.studentCode} · Khối {s.grade}
                          </span>
                        </span>
                        {current ? <NeutralBadge>Đang ở {current.name}</NeutralBadge> : <NeutralBadge>Chưa xếp lớp</NeutralBadge>}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {movingCount > 0 && (
            <p className="text-xs text-[var(--status-warning)]">{movingCount} học sinh sẽ được chuyển từ lớp cũ sang lớp {classroom.name}.</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <button type="button" className="btn-line" onClick={() => onOpenChange(false)}>
            Hủy
          </button>
          <button type="button" className="btn-crimson disabled:opacity-50" disabled={selected.size === 0} onClick={() => onConfirm([...selected])}>
            Thêm {selected.size > 0 ? selected.size : ""} học sinh
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Move student ───────────────────────── */
function MoveStudentDialog({
  student,
  from,
  targets,
  onOpenChange,
  onConfirm,
}: {
  student: StudentAccount | null;
  from: Classroom;
  targets: Classroom[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (toClassId: string) => void;
}) {
  const [to, setTo] = React.useState("");
  const options = targets.map((c) => ({ value: c.id, label: `${c.name} · Khối ${c.grade}` }));

  return (
    <Dialog
      open={!!student}
      onOpenChange={(o) => {
        if (!o) setTo("");
        onOpenChange(o);
      }}
    >
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>Chuyển lớp</DialogTitle>
          <DialogDescription className="text-content-muted">
            Chuyển {student?.fullName} từ lớp {from.name} sang lớp khác.
          </DialogDescription>
        </DialogHeader>
        <Field label="Lớp mới" required>
          <StaffFormSelect value={to} onValueChange={setTo} placeholder="Chọn lớp" options={options} className="w-full" />
        </Field>
        <DialogFooter className="gap-2">
          <button type="button" className="btn-line" onClick={() => onOpenChange(false)}>
            Hủy
          </button>
          <button
            type="button"
            className="btn-crimson disabled:opacity-50"
            disabled={!to}
            onClick={() => {
              onConfirm(to);
              setTo("");
            }}
          >
            Chuyển lớp
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

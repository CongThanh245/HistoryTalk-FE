"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { useSaasStore } from "@/features/saas/store";
import {
  IMPORT_COLUMNS,
  buildTemplateCsv,
  downloadTextFile,
  readImportFile,
  validateRows,
  type ImportMode,
  type ParsedFile,
} from "@/features/saas/student-import";
import type { Classroom, School, StudentAccount } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

export function downloadStudentTemplate() {
  downloadTextFile("mau-nhap-hoc-sinh.csv", buildTemplateCsv());
}

/** Bulk import students from a .csv file (Role Matrix row 4). Parsing and validation run in the browser. */
export function StudentImportDialog({
  open,
  onOpenChange,
  school,
  students,
  classes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school: School;
  students: StudentAccount[];
  classes: Classroom[];
}) {
  const createStudents = useSaasStore((s) => s.createStudents);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [parsed, setParsed] = React.useState<ParsedFile | null>(null);
  const [mode, setMode] = React.useState<ImportMode>("file");
  const [targetClassId, setTargetClassId] = React.useState("");
  const [onlyErrors, setOnlyErrors] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  const reset = () => {
    setFileName(null);
    setParsed(null);
    setMode("file");
    setTargetClassId("");
    setOnlyErrors(false);
  };

  const existingCodes = React.useMemo(() => new Set(students.map((s) => s.studentCode.toUpperCase())), [students]);
  const targetClass = classes.find((c) => c.id === targetClassId);
  const rows = React.useMemo(
    () => (parsed?.rows.length ? validateRows(parsed.rows, { existingCodes, classes, mode, targetClass }) : []),
    [parsed, existingCodes, classes, mode, targetClass],
  );
  const valid = rows.filter((r) => !r.error);
  const invalid = rows.length - valid.length;
  const seatsLeft = Math.max(0, school.maxStudents - students.length);
  const overSeats = valid.length > seatsLeft;
  const visible = onlyErrors ? rows.filter((r) => r.error) : rows;
  const canCommit = valid.length > 0 && !overSeats && (mode !== "class" || !!targetClass);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      toast.error("Chỉ hỗ trợ file .csv. Trong Excel, chọn Lưu thành → CSV UTF-8.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File quá lớn (tối đa 2 MB).");
      return;
    }
    const text = await file.text();
    setFileName(file.name);
    setParsed(readImportFile(text));
    setOnlyErrors(false);
  }

  function commit() {
    if (!canCommit) return;
    const groups = new Map<string, typeof valid>();
    for (const r of valid) {
      const key = r.classId ?? "";
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    for (const [classId, list] of groups) {
      createStudents(
        list.map((r) => ({
          schoolId: school.id,
          fullName: r.fullName,
          studentCode: r.studentCode,
          username: r.studentCode.toLowerCase(),
          grade: r.grade,
          dateOfBirth: r.dateOfBirth,
          status: "ACTIVE" as const,
        })),
        classId || undefined,
      );
    }
    toast.success(`Đã nhập ${valid.length} học sinh${invalid ? `, bỏ qua ${invalid} dòng lỗi` : ""}`);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-4xl")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>Nhập học sinh từ file</DialogTitle>
          <DialogDescription className="text-content-muted">
            File .csv gồm các cột: {IMPORT_COLUMNS.join(", ")}. Tên đăng nhập là mã học sinh viết thường; mật khẩu tạm được gửi cho nhà trường.
          </DialogDescription>
        </DialogHeader>

        {!parsed || parsed.fileError ? (
          <div className="space-y-4">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void handleFile(e.dataTransfer.files[0]);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[2px] border border-dashed px-4 py-10 text-center transition-colors",
                dragOver ? "border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)]" : "border-[var(--border-strong)] hover:border-[var(--text-primary)]",
              )}
            >
              <Upload className="h-7 w-7 text-[var(--accent-gold)]" aria-hidden="true" />
              <span className="text-sm font-semibold text-content-heading">Kéo thả file .csv vào đây hoặc bấm để chọn file</span>
              <span className="text-xs text-content-muted">Tối đa 2 MB · mã hóa UTF-8</span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {parsed?.fileError && (
              <p className="flex items-start gap-2 text-sm text-[var(--accent-danger)]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {fileName}: {parsed.fileError}
              </p>
            )}
            <button type="button" className="archive-link" onClick={downloadStudentTemplate}>
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> Tải file mẫu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2px] border border-[var(--border-strong)] px-3 py-2 text-sm">
              <span className="inline-flex min-w-0 items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
                <span className="truncate font-semibold">{fileName}</span>
              </span>
              <button type="button" className="archive-link" onClick={() => inputRef.current?.click()}>
                Chọn file khác
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Xếp lớp">
                <StaffFormSelect
                  value={mode}
                  onValueChange={setMode}
                  options={[
                    { value: "file", label: "Theo cột “Lớp” trong file" },
                    { value: "class", label: "Xếp tất cả vào một lớp" },
                    { value: "none", label: "Chưa xếp lớp" },
                  ]}
                  className="w-full"
                />
              </Field>
              {mode === "class" && (
                <Field label="Lớp" required error={!targetClass ? "Chọn lớp nhận học sinh" : null}>
                  <StaffFormSelect
                    value={targetClassId}
                    onValueChange={setTargetClassId}
                    placeholder="Chọn lớp"
                    options={classes.map((c) => ({ value: c.id, label: `${c.name} · Khối ${c.grade}` }))}
                    className="w-full"
                  />
                </Field>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5 text-[var(--status-success)]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {valid.length} dòng hợp lệ
              </span>
              <span className={cn("inline-flex items-center gap-1.5", invalid ? "text-[var(--accent-danger)]" : "text-content-muted")}>
                <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {invalid} dòng lỗi
              </span>
              <span className="text-content-muted">Còn {formatNumber(seatsLeft)} chỗ trong gói</span>
              {invalid > 0 && (
                <label className="ml-auto inline-flex cursor-pointer items-center gap-2">
                  <Checkbox checked={onlyErrors} onCheckedChange={(v) => setOnlyErrors(v === true)} /> Chỉ hiện dòng lỗi
                </label>
              )}
            </div>
            {overSeats && (
              <p className="text-sm text-[var(--accent-danger)]">
                Số học sinh hợp lệ ({valid.length}) vượt số chỗ còn lại của gói ({seatsLeft}). Liên hệ quản trị hệ thống để nâng giới hạn.
              </p>
            )}

            <div className="max-h-[40dvh] overflow-auto rounded-[2px] border-y border-[var(--text-primary)]">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow className="border-b border-[var(--border-strong)] hover:bg-transparent">
                    {["Dòng", "Họ và tên", "Mã HS", "Khối", "Ngày sinh", "Lớp", "Kết quả"].map((h) => (
                      <TableHead key={h} className="px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r) => (
                    <TableRow
                      key={r.line}
                      className={cn("border-b border-[var(--border-default)]", r.error && "bg-[var(--status-danger-bg)] hover:bg-[var(--status-danger-bg)]")}
                    >
                      <TableCell className="px-3 tabular-nums text-content-muted">{r.line}</TableCell>
                      <TableCell className="px-3 font-medium">{r.fullName || "—"}</TableCell>
                      <TableCell className="px-3 font-mono text-xs">{r.studentCode || "—"}</TableCell>
                      <TableCell className="px-3 tabular-nums">{Number.isFinite(r.grade) && r.grade ? r.grade : "—"}</TableCell>
                      <TableCell className="px-3 text-xs">{formatDate(r.dateOfBirth)}</TableCell>
                      <TableCell className="px-3">{r.className ?? <span className="text-content-muted">Chưa xếp</span>}</TableCell>
                      <TableCell className="max-w-[280px] whitespace-normal px-3 text-xs">
                        {r.error ? (
                          <span className="text-[var(--accent-danger)]">{r.error}</span>
                        ) : (
                          <span className="text-[var(--status-success)]">Hợp lệ · {r.studentCode.toLowerCase()}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <button
            type="button"
            className="btn-line"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Hủy
          </button>
          {parsed && !parsed.fileError && (
            <button type="button" className="btn-crimson disabled:opacity-50" disabled={!canCommit} onClick={commit}>
              Nhập {valid.length} học sinh
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

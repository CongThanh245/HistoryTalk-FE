"use client";

import * as React from "react";
import { AlertTriangle, Check, Info, Pencil, XCircle } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { StaffFormInput } from "@/components/staff/staff-form";
import {
  STUDENT_IMPORT_FIELDS,
  checkStudentRows,
  type CheckStudentOptions,
  type CheckedStudentRow,
  type ImportTable,
  type StudentColumnMapping,
  type StudentImportField,
} from "@/features/saas/student-import";
import { cn } from "@/lib/utils/cn";

export type RowFilter = "ALL" | "VALID" | "ERROR";

// The preview works on rows re-laid out in backend column order, so an edit is one cell and the checker re-runs on it.
export const NORMALIZED_HEADERS = STUDENT_IMPORT_FIELDS.map((f) => f.column as string);
export const NORMALIZED_MAPPING = Object.fromEntries(STUDENT_IMPORT_FIELDS.map((f, i) => [f.key, i])) as StudentColumnMapping;
export const normalizeRows = (table: ImportTable, mapping: StudentColumnMapping) =>
  table.rows.map((r) => STUDENT_IMPORT_FIELDS.map((f) => (mapping[f.key] >= 0 ? (r[mapping[f.key]] ?? "") : "")));

/** Rows being previewed, their check results and the ticked lines; shared by the school and class student imports. */
export function useImportRows(options: CheckStudentOptions = {}) {
  const existingAllowed = !!options.existingAllowed;
  const [rows, setRows] = React.useState<string[][]>([]);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [filter, setFilter] = React.useState<RowFilter>("ALL");

  const check = React.useCallback(
    (r: string[][]) => checkStudentRows({ headers: NORMALIZED_HEADERS, rows: r }, NORMALIZED_MAPPING, { existingAllowed }),
    [existingAllowed],
  );
  const checked = React.useMemo(() => check(rows), [check, rows]);
  const validRows = React.useMemo(() => checked.filter((r) => Object.keys(r.errors).length === 0), [checked]);
  const pickedRows = React.useMemo(() => validRows.filter((r) => selected.has(r.line)), [validRows, selected]);

  /** Loads a parsed file; every valid row starts ticked. */
  const load = (table: ImportTable, mapping: StudentColumnMapping) => {
    const normalized = normalizeRows(table, mapping);
    setRows(normalized);
    setSelected(new Set(check(normalized).filter((r) => Object.keys(r.errors).length === 0).map((r) => r.line)));
    setFilter("ALL");
  };

  /** Saves an edited row; a row that becomes valid is ticked, one that breaks is unticked. */
  const saveRow = (line: number, values: Partial<Record<StudentImportField, string>>) => {
    const nextRows = rows.map((r, k) =>
      k + 2 === line ? STUDENT_IMPORT_FIELDS.map((f, i) => (f.key in values ? (values[f.key] ?? "") : r[i])) : r,
    );
    setRows(nextRows);
    const row = check(nextRows).find((r) => r.line === line);
    const nextSelected = new Set(selected);
    if (row && Object.keys(row.errors).length === 0) nextSelected.add(line);
    else nextSelected.delete(line);
    setSelected(nextSelected);
  };

  const clear = () => {
    setRows([]);
    setSelected(new Set());
    setFilter("ALL");
  };

  return {
    checked,
    validRows,
    pickedRows,
    errorCount: checked.length - validRows.length,
    selected,
    setSelected,
    filter,
    setFilter,
    rawRow: (line: number) => rows[line - 2] ?? [],
    load,
    saveRow,
    clear,
  };
}

const PREVIEW_FIELDS: { key: StudentImportField; label: string }[] = [
  { key: "fullName", label: "Họ và tên" },
  { key: "studentCode", label: "Mã HS" },
  { key: "dob", label: "Ngày sinh" },
  { key: "email", label: "Email" },
  { key: "gender", label: "Giới tính" },
];
const GENDER_VI: Record<string, string> = { MALE: "Nam", FEMALE: "Nữ" };

export function ImportPreviewTable({
  rows,
  filter,
  setFilter,
  validCount,
  errorCount,
  selected,
  setSelected,
  rawRow,
  onSaveRow,
  note,
  submitError,
}: {
  rows: CheckedStudentRow[];
  filter: RowFilter;
  setFilter: (f: RowFilter) => void;
  validCount: number;
  errorCount: number;
  selected: Set<number>;
  setSelected: (s: Set<number>) => void;
  rawRow: (line: number) => string[];
  onSaveRow: (line: number, values: Partial<Record<StudentImportField, string>>) => void;
  /** Context line under the table (tokens, classes…). */
  note?: React.ReactNode;
  submitError: string | null;
}) {
  const [editing, setEditing] = React.useState<{ line: number; values: Record<StudentImportField, string> } | null>(null);
  const startEdit = (line: number) => {
    const raw = rawRow(line);
    setEditing({ line, values: Object.fromEntries(STUDENT_IMPORT_FIELDS.map((f, i) => [f.key, raw[i] ?? ""])) as Record<StudentImportField, string> });
  };
  const finishEdit = () => {
    if (!editing) return;
    onSaveRow(editing.line, editing.values);
    setEditing(null);
  };
  const visible = rows.filter((r) => {
    const bad = Object.keys(r.errors).length > 0;
    return filter === "ALL" || (filter === "ERROR" ? bad : !bad);
  });
  const tabs: { key: RowFilter; label: string; count: number }[] = [
    { key: "ALL", label: "Tất cả", count: rows.length },
    { key: "VALID", label: "Hợp lệ", count: validCount },
    { key: "ERROR", label: "Có lỗi", count: errorCount },
  ];
  const isValid = (r: CheckedStudentRow) => Object.keys(r.errors).length === 0;
  const pickable = visible.filter(isValid);
  const pickedVisible = pickable.filter((r) => selected.has(r.line)).length;
  const allPicked = pickable.length > 0 && pickedVisible === pickable.length;
  const toggleAll = () => {
    const next = new Set(selected);
    for (const r of pickable) {
      if (allPicked) next.delete(r.line);
      else next.add(r.line);
    }
    setSelected(next);
  };
  const toggle = (line: number) => {
    const next = new Set(selected);
    if (next.has(line)) next.delete(line);
    else next.add(line);
    setSelected(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Lọc dòng">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={filter === t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-xs font-bold",
              filter === t.key
                ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                : "border-[var(--border-strong)] text-content-muted hover:border-[var(--text-primary)]",
            )}
          >
            {t.label} <span className="tabular-nums">({t.count})</span>
          </button>
        ))}
      </div>

      <p className="text-sm text-content-muted">
        Đã chọn <b className="text-content-heading tabular-nums">{selected.size}</b>/{validCount} học sinh hợp lệ. Bỏ tick những học sinh chưa muốn
        nhập, bấm bút để sửa thông tin.
      </p>
      {errorCount > 0 && (
        <p className="flex items-start gap-2 rounded-sm border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 py-2 text-xs text-[var(--text-secondary)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
          {errorCount} dòng có lỗi chưa chọn được. Bấm biểu tượng bút ở cuối dòng để sửa trực tiếp; sửa xong dòng sẽ tự được chọn.
        </p>
      )}

      <div className="max-h-[50dvh] overflow-auto border-y border-border-card">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Kết quả kiểm tra từng dòng</caption>
          <thead className="sticky top-0 bg-[var(--bg-surface)]">
            <tr className="border-b border-[var(--border-strong)] text-left text-[13px] font-semibold text-[var(--text-tertiary)]">
              <th className="w-9 px-2 py-2">
                <Checkbox
                  checked={allPicked ? true : pickedVisible > 0 ? "indeterminate" : false}
                  disabled={pickable.length === 0}
                  onCheckedChange={toggleAll}
                  aria-label="Chọn tất cả học sinh hợp lệ"
                />
              </th>
              <th className="px-2 py-2 font-semibold">Dòng</th>
              {PREVIEW_FIELDS.map((f) => (
                <th key={f.key} className="px-2 py-2 font-semibold">
                  {f.label}
                </th>
              ))}
              <th className="w-10 px-2 py-2">
                <span className="sr-only">Sửa</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const bad = Object.keys(r.errors).length > 0;
              if (editing?.line === r.line) {
                return (
                  <tr key={r.line} data-row-editor className="border-b border-[var(--border-default)] bg-[var(--bg-elevated)] align-top last:border-b-0">
                    <td className="px-2 py-2" />
                    <td className="px-2 py-2 tabular-nums text-content-muted">{r.line}</td>
                    {PREVIEW_FIELDS.map((f) => (
                      <td key={f.key} className="px-1 py-1.5">
                        <StaffFormInput
                          autoFocus={f.key === (Object.keys(r.errors)[0] ?? "fullName")}
                          value={editing.values[f.key]}
                          onChange={(e) => setEditing({ ...editing, values: { ...editing.values, [f.key]: e.target.value } })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              finishEdit();
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditing(null);
                            }
                          }}
                          placeholder={f.key === "dob" ? "dd/mm/yyyy" : f.key === "gender" ? "Nam / Nữ" : undefined}
                          aria-label={f.label}
                          aria-invalid={!!r.errors[f.key]}
                          className="h-8 px-2 text-sm"
                        />
                        {r.errors[f.key] && <span className="block text-[11px] text-[var(--accent-danger)]">{r.errors[f.key]}</span>}
                      </td>
                    ))}
                    <td className="px-1 py-1.5">
                      <button
                        type="button"
                        onClick={finishEdit}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-[var(--text-primary)] text-[var(--text-inverse)]"
                        aria-label="Lưu dòng"
                        title="Lưu (Enter)"
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              }
              return (
                <tr
                  key={r.line}
                  onClick={bad ? undefined : () => toggle(r.line)}
                  className={cn(
                    "border-b border-[var(--border-default)] align-top last:border-b-0",
                    bad ? "bg-[var(--status-danger-bg)]" : "cursor-pointer hover:bg-[var(--bg-elevated)]",
                    !bad && !selected.has(r.line) && "text-content-muted",
                  )}
                >
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={!bad && selected.has(r.line)}
                      disabled={bad}
                      onCheckedChange={() => toggle(r.line)}
                      aria-label={`Chọn ${r.values.fullName || `dòng ${r.line}`}`}
                    />
                  </td>
                  <td className="px-2 py-2 tabular-nums text-content-muted">{r.line}</td>
                  {PREVIEW_FIELDS.map((f) => {
                    const err = r.errors[f.key];
                    const v = f.key === "gender" ? (GENDER_VI[r.values.gender] ?? r.values.gender) : r.values[f.key];
                    return (
                      <td key={f.key} className="px-2 py-2">
                        <span className={cn("break-words", f.key === "fullName" && "font-medium text-content-heading")}>
                          {v || <span className="text-content-subtle">—</span>}
                        </span>
                        {err && <span className="block text-[11px] text-[var(--accent-danger)]">{err}</span>}
                        {f.key === "fullName" && r.warnings.map((w) => <span key={w} className="block text-[11px] text-[var(--status-warning)]">{w}</span>)}
                      </td>
                    );
                  })}
                  <td className="px-1 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => startEdit(r.line)}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-sm hover:bg-[var(--bg-surface)] hover:text-content-heading",
                        bad ? "text-[var(--accent-danger)]" : "text-content-muted",
                      )}
                      aria-label={`Sửa dòng ${r.line}`}
                      title="Sửa"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={PREVIEW_FIELDS.length + 3} className="px-3 py-8 text-center text-sm text-content-muted">
                  Không có dòng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {note && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-content-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{note}</span>
        </p>
      )}

      {submitError && (
        <p role="alert" className="flex items-start gap-2 text-sm text-[var(--accent-danger)]">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {submitError}
        </p>
      )}
    </div>
  );
}

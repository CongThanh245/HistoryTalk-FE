"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  RotateCcw,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { CredentialExportActions, OneTimeWarning } from "@/components/saas/accounts-credentials";
import { todayStamp } from "@/components/saas/accounts-utils";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, formatNumber } from "@/components/saas/saas-ui";
import { apiErrorMessage, apiErrorStatus, useApiTokenQuota, useImportApiStudents } from "@/features/saas/hooks-api";
import {
  BACKEND_IMPORT_COLUMNS,
  STUDENT_IMPORT_FIELDS,
  autoMapStudentColumns,
  buildBackendCsv,
  buildBackendTemplateCsv,
  checkStudentRows,
  decodeImportFile,
  downloadTextFile,
  readTable,
  type ImportTable,
  type CheckedStudentRow,
  type StudentColumnMapping,
  type StudentImportField,
} from "@/features/saas/student-import";
import { schoolService } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";
import { ImportAccountsTable, ImportErrorsTable, ImportSummary } from "./import-result";
import { studentCredentials, useImportSession, type ImportSession } from "./import-session";


/**
 * Template from the backend (GET /school-admin/students/template); falls back to the client-generated one if the
 * request fails. Both carry a BOM for Excel — the wizard re-encodes the file without it before uploading.
 */
export async function downloadStudentTemplate() {
  try {
    const blob = await schoolService.downloadStudentTemplate();
    if (!(blob instanceof Blob) || blob.size === 0) throw new Error("empty template");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  } catch {
    downloadTextFile("student_import_template.csv", buildBackendTemplateCsv());
  }
}

const STEPS = ["Tải file", "Ghép cột", "Kiểm tra", "Xác nhận", "Kết quả"] as const;
type Step = 0 | 1 | 2 | 3 | 4;
type RowFilter = "ALL" | "VALID" | "ERROR";

function StepIndicator({ step }: { step: Step }) {
  return (
    <nav aria-label="Các bước nhập học sinh">
      <p className="mb-2 text-sm font-semibold text-content-heading sm:hidden">
        Bước {step + 1}/{STEPS.length} · {STEPS[step]}
      </p>
      <ol className="flex items-center gap-1 sm:gap-2">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-2" aria-current={current ? "step" : undefined}>
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-sm border text-xs font-bold tabular-nums",
                  current && "border-[var(--accent-gold)] bg-[var(--accent-gold)] text-white",
                  done && "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]",
                  !current && !done && "border-[var(--border-strong)] text-content-muted",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
                <span className="sr-only">{done ? " (đã xong)" : current ? " (hiện tại)" : ""}</span>
              </span>
              <span className={cn("hidden truncate text-xs font-semibold sm:inline", current ? "text-content-heading" : "text-content-muted")}>{label}</span>
              {i < STEPS.length - 1 && <span className={cn("h-px flex-1", done ? "bg-[var(--text-primary)]" : "bg-[var(--border-strong)]")} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Bulk import of student accounts (POST /school-admin/students/import-excel): upload → map columns → client-side check →
 * confirm → result. No tokens are handed out (Sprint 7 shared pool + daily limit), so `defaultInitialToken` is 0. The rows are re-written into a normalized UTF-8 CSV with the backend header before sending.
 */
export function StudentImportWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const quota = useApiTokenQuota(open);
  const importStudents = useImportApiStudents();
  const setLast = useImportSession((s) => s.setLast);

  const [step, setStep] = React.useState<Step>(0);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [encoding, setEncoding] = React.useState<"utf-8" | "windows-1258">("utf-8");
  const [table, setTable] = React.useState<ImportTable | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [mapping, setMapping] = React.useState<StudentColumnMapping | null>(null);
  const [filter, setFilter] = React.useState<RowFilter>("ALL");
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<ImportSession | null>(null);
  const [exported, setExported] = React.useState(false);
  const [confirmClose, setConfirmClose] = React.useState(false);

  const reset = () => {
    setStep(0);
    setFileName(null);
    setEncoding("utf-8");
    setTable(null);
    setFileError(null);
    setMapping(null);
    setFilter("ALL");
    setSubmitError(null);
    setSession(null);
    setExported(false);
    importStudents.reset();
  };
  const close = () => {
    reset();
    onOpenChange(false);
  };
  const requestClose = () => {
    if (importStudents.isPending) return;
    const hasPasswords = step === 4 && !!session?.result.successCount && !exported;
    if ((step >= 1 && step <= 3) || hasPasswords) setConfirmClose(true);
    else close();
  };

  /* ── Step 1: file ── */
  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setFileName(file.name);
      setTable(null);
      setFileError("Máy chủ chỉ nhận file .csv. Trong Excel chọn Tệp → Lưu thành → “CSV UTF-8 (Comma delimited)”.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFileName(file.name);
      setTable(null);
      setFileError("File quá lớn (tối đa 2 MB).");
      return;
    }
    const decoded = decodeImportFile(await file.arrayBuffer());
    const parsed = readTable(decoded.text);
    setFileName(file.name);
    setEncoding(decoded.encoding);
    setFileError(parsed.fileError ?? null);
    setTable(parsed.table ?? null);
    setMapping(parsed.table ? autoMapStudentColumns(parsed.table.headers) : null);
  }

  /* ── Step 2: mapping ── */
  const mappingErrors = React.useMemo(() => {
    if (!mapping) return [] as string[];
    const errs: string[] = [];
    for (const f of STUDENT_IMPORT_FIELDS) if (f.required && mapping[f.key] < 0) errs.push(`Chưa chọn cột cho “${f.label}”`);
    const used = Object.values(mapping).filter((i) => i >= 0);
    if (new Set(used).size !== used.length) errs.push("Mỗi cột trong file chỉ được ghép với một trường");
    return errs;
  }, [mapping]);

  /* ── Step 3: check ── */
  const checked = React.useMemo(() => (table && mapping && mappingErrors.length === 0 ? checkStudentRows(table, mapping) : []), [table, mapping, mappingErrors]);
  const validRows = React.useMemo(() => checked.filter((r) => Object.keys(r.errors).length === 0), [checked]);
  const errorCount = checked.length - validRows.length;

  function submit() {
    if (validRows.length === 0) return;
    setSubmitError(null);
    const csv = buildBackendCsv(validRows.map((r) => r.values));
    const base = (fileName ?? "hoc-sinh").replace(/\.[^.]+$/, "");
    const file = new File([csv], `${base}-chuan-hoa.csv`, { type: "text/csv" });
    const sentLines = validRows.map((r) => r.line);
    importStudents.mutate(
      { file },
      {
        onSuccess: (result) => {
          const s: ImportSession = {
            result,
            fileName: fileName ?? file.name,
            importedAt: new Date().toISOString(),
            defaultInitialToken: 0,
            sentLines,
            skippedRows: errorCount,
          };
          setSession(s);
          setLast(s);
          setStep(4);
          if (result.successCount) toast.success(`Đã tạo ${result.successCount} tài khoản học sinh`);
          else toast.error("Không có tài khoản nào được tạo. Xem các dòng lỗi.");
        },
        onError: (error) => setSubmitError(apiErrorMessage(error, "Không nhập được danh sách học sinh. Vui lòng thử lại.")),
      },
    );
  }

  /* ── Navigation ── */
  const canNext = step === 0 ? !!table && !fileError : step === 1 ? mappingErrors.length === 0 : step === 2 ? validRows.length > 0 : false;
  const next = () => {
    if (!canNext) return;
    if (step === 1) setFilter(errorCount ? "ERROR" : "ALL");
    setStep((s) => (s + 1) as Step);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())}>
        <DialogContent
          className={cn(DIALOG_CLASS, "flex max-h-[92dvh] flex-col gap-4 overflow-hidden p-4 sm:max-w-5xl sm:p-6")}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="pr-8">
            <DialogTitle className={DIALOG_TITLE_CLASS}>Nhập học sinh hàng loạt</DialogTitle>
            <DialogDescription className="text-content-muted">
              {quota.data
                ? `${quota.data.schoolName} · học sinh dùng quỹ token chung của trường theo hạn mức ngày`
                : "Tạo tài khoản học sinh của trường."}
            </DialogDescription>
          </DialogHeader>

          <StepIndicator step={step} />

          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            {step === 0 && (
              <UploadStep
                fileName={fileName}
                fileError={fileError}
                encoding={encoding}
                table={table}
                dragOver={dragOver}
                setDragOver={setDragOver}
                onFile={(f) => void handleFile(f)}
              />
            )}
            {step === 1 && table && mapping && <MappingStep table={table} mapping={mapping} onChange={setMapping} errors={mappingErrors} />}
            {step === 2 && <CheckStep rows={checked} filter={filter} setFilter={setFilter} validCount={validRows.length} errorCount={errorCount} />}
            {step === 3 && (
              <ConfirmStep validCount={validRows.length} skipped={errorCount} submitError={submitError} />
            )}
            {step === 4 && session && <ResultStep session={session} schoolName={quota.data?.schoolName} onExported={() => setExported(true)} />}
          </div>

          <footer className="flex flex-col-reverse gap-2 border-t border-[var(--border-default)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            {step === 4 ? (
              <>
                <button
                  type="button"
                  className="btn-line w-full sm:w-auto"
                  onClick={() => {
                    if (session?.result.successCount && !exported) setConfirmClose(true);
                    else reset();
                  }}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" /> Nhập file khác
                </button>
                <button type="button" className="btn-crimson w-full sm:w-auto" onClick={requestClose}>
                  Hoàn tất
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button type="button" className="btn-line w-full sm:w-auto" disabled={importStudents.isPending} onClick={requestClose}>
                    Hủy
                  </button>
                  {step > 0 && (
                    <button
                      type="button"
                      className="btn-line w-full sm:w-auto"
                      disabled={importStudents.isPending}
                      onClick={() => setStep((s) => (s - 1) as Step)}
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Quay lại
                    </button>
                  )}
                </div>
                {step < 3 ? (
                  <button type="button" className="btn-crimson w-full disabled:opacity-50 sm:w-auto" disabled={!canNext} onClick={next}>
                    Tiếp tục <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-crimson w-full disabled:opacity-50 sm:w-auto"
                    disabled={validRows.length === 0 || importStudents.isPending}
                    onClick={submit}
                  >
                    {importStudents.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {importStudents.isPending ? "Đang tạo tài khoản…" : `Tạo ${validRows.length} tài khoản`}
                  </button>
                )}
              </>
            )}
          </footer>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title={step === 4 ? "Đóng khi chưa lưu mật khẩu?" : "Hủy nhập học sinh?"}
        description={
          step === 4
            ? "Bạn chưa tải danh sách tài khoản hoặc in phiếu. Kết quả vẫn xem lại được ở mục “Kết quả nhập gần nhất” cho tới khi tải lại trang."
            : "File đã tải lên trong lần nhập này sẽ bị bỏ."
        }
        confirmLabel={step === 4 ? "Vẫn đóng" : "Hủy nhập"}
        variant="warning"
        onConfirm={() => {
          setConfirmClose(false);
          close();
        }}
      />
    </>
  );
}

/* ───────────────────────── Step 1 ───────────────────────── */
function UploadStep({
  fileName,
  fileError,
  encoding,
  table,
  dragOver,
  setDragOver,
  onFile,
}: {
  fileName: string | null;
  fileError: string | null;
  encoding: "utf-8" | "windows-1258";
  table: ImportTable | null;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFile: (f: File | undefined) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
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
            onFile(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border border-dashed px-4 py-10 text-center transition-colors focus-within:outline-2 focus-within:outline-[var(--accent-gold)]",
            dragOver ? "border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)]" : "border-[var(--border-strong)] hover:border-[var(--text-primary)]",
          )}
        >
          <Upload className="h-7 w-7 text-[var(--accent-gold)]" aria-hidden="true" />
          <span className="text-sm font-semibold text-content-heading">Kéo thả file .csv vào đây hoặc bấm để chọn file</span>
          <span className="text-xs text-content-muted">Tối đa 2 MB · dấu phân cách “,” hoặc “;” · tên cột có dấu hay không dấu đều được</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>

        {fileName && (
          <div className="space-y-2 rounded-sm border border-[var(--border-strong)] px-3 py-2 text-sm">
            <p className="flex min-w-0 items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
              <span className="truncate font-semibold">{fileName}</span>
              {table && (
                <span className="ml-auto shrink-0 text-xs text-content-muted">
                  {table.rows.length} dòng · {table.headers.length} cột
                </span>
              )}
            </p>
            {fileError && (
              <p role="alert" className="flex items-start gap-2 text-[var(--accent-danger)]">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {fileError}
              </p>
            )}
            {encoding === "windows-1258" && !fileError && (
              <p className="flex items-start gap-2 text-xs text-[var(--status-warning)]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                File không phải UTF-8, đã đọc theo bảng mã Windows-1258 và sẽ được gửi lên dưới dạng UTF-8. Hãy kiểm tra dấu tiếng Việt ở bước
                kiểm tra.
              </p>
            )}
          </div>
        )}

        {table && !fileError && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-content-heading">Xem trước 5 dòng đầu</p>
            <div className="overflow-x-auto border-y border-border-card">
              <table className="w-full min-w-[480px] text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-strong)] text-left">
                    {table.headers.map((h, i) => (
                      <th key={i} className="px-2 py-1.5 font-semibold text-[var(--text-tertiary)]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.slice(0, 5).map((r, k) => (
                    <tr key={k} className="border-b border-[var(--border-default)] last:border-b-0">
                      {r.map((c, i) => (
                        <td key={i} className="px-2 py-1.5">
                          {c || <span className="text-content-subtle">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4 text-sm">
        <div className="space-y-2">
          <p className="font-semibold text-content-heading">File cần có</p>
          <ul className="list-disc space-y-1 pl-5 text-content-muted">
            <li>
              Dòng đầu là tiêu đề cột. Bắt buộc: <b className="text-content-text">Họ và tên</b>, <b className="text-content-text">Ngày sinh</b>.
            </li>
            <li>Không bắt buộc: mã học sinh (bỏ trống để hệ thống tự sinh), email, giới tính, số điện thoại, mật khẩu, token cộng thêm.</li>
            <li>Học sinh đăng nhập bằng email; nếu bỏ trống email, hệ thống cấp email dạng …@saas.historytalk.vn.</li>
          </ul>
        </div>
        <div className="overflow-x-auto border-y border-[var(--border-strong)]">
          <p className="px-2 py-1.5 font-mono text-[11px] text-content-muted">{BACKEND_IMPORT_COLUMNS.join(",")}</p>
        </div>
        <button type="button" className="archive-link" onClick={() => void downloadStudentTemplate()}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" /> Tải file mẫu
        </button>
        <div className="space-y-1.5 rounded-sm border border-[var(--border-default)] p-3 text-xs text-content-muted">
          <p className="flex items-center gap-1.5 font-semibold text-content-heading">
            <Info className="h-3.5 w-3.5" aria-hidden="true" /> Lưu từ Excel đúng cách
          </p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Mở danh sách trong Excel, chọn Tệp → Lưu thành (Save As).</li>
            <li>
              Ở “Kiểu tệp” chọn <b className="text-content-text">CSV UTF-8 (Comma delimited) (*.csv)</b>.
            </li>
            <li>Google Sheets: Tệp → Tải xuống → Giá trị được phân tách bằng dấu phẩy (.csv).</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

/* ───────────────────────── Step 2 ───────────────────────── */
const UNUSED = "-1";

function MappingStep({
  table,
  mapping,
  onChange,
  errors,
}: {
  table: ImportTable;
  mapping: StudentColumnMapping;
  onChange: (m: StudentColumnMapping) => void;
  errors: string[];
}) {
  const options = [{ value: UNUSED, label: "— Không dùng —" }, ...table.headers.map((h, i) => ({ value: String(i), label: h }))];
  const sample = (i: number) =>
    i < 0
      ? ""
      : table.rows
          .slice(0, 3)
          .map((r) => r[i])
          .filter(Boolean)
          .join(" · ");

  return (
    <div className="space-y-4">
      <p className="text-sm text-content-muted">
        Chọn cột trong file tương ứng với từng thông tin. Hệ thống đã tự ghép theo tên cột; dữ liệu sẽ được chuyển sang đúng định dạng máy chủ
        yêu cầu trước khi gửi.
      </p>
      <ul className="divide-y divide-[var(--border-default)] border-y border-border-card">
        {STUDENT_IMPORT_FIELDS.map((f) => (
          <li key={f.key} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_240px] sm:items-center sm:gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-content-heading">
                {f.label}
                {f.required && <span className="text-[var(--accent-danger)]">*</span>}
                <span className="ml-2 font-mono text-[11px] font-normal text-content-muted">{f.column}</span>
              </p>
              <p className="text-xs text-content-muted">{f.hint}</p>
              {mapping[f.key] >= 0 && <p className="truncate text-xs text-content-text">Ví dụ: {sample(mapping[f.key]) || "—"}</p>}
            </div>
            <StaffFormSelect
              value={String(mapping[f.key])}
              onValueChange={(v) => onChange({ ...mapping, [f.key]: Number(v) } as Record<StudentImportField, number>)}
              options={options}
              className="w-full"
            />
          </li>
        ))}
      </ul>
      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 text-sm text-[var(--accent-danger)]">
          {errors.map((e) => (
            <li key={e} className="flex items-start gap-2">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ───────────────────────── Step 3 ───────────────────────── */
const PREVIEW_FIELDS: { key: StudentImportField; label: string }[] = [
  { key: "fullName", label: "Họ và tên" },
  { key: "studentCode", label: "Mã HS" },
  { key: "dob", label: "Ngày sinh" },
  { key: "email", label: "Email" },
  { key: "gender", label: "Giới tính" },
];
const GENDER_VI: Record<string, string> = { MALE: "Nam", FEMALE: "Nữ" };

function CheckStep({
  rows,
  filter,
  setFilter,
  validCount,
  errorCount,
}: {
  rows: CheckedStudentRow[];
  filter: RowFilter;
  setFilter: (f: RowFilter) => void;
  validCount: number;
  errorCount: number;
}) {
  const visible = rows.filter((r) => {
    const bad = Object.keys(r.errors).length > 0;
    return filter === "ALL" || (filter === "ERROR" ? bad : !bad);
  });
  const tabs: { key: RowFilter; label: string; count: number }[] = [
    { key: "ALL", label: "Tất cả", count: rows.length },
    { key: "VALID", label: "Hợp lệ", count: validCount },
    { key: "ERROR", label: "Có lỗi", count: errorCount },
  ];

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

      {errorCount > 0 ? (
        <p className="flex items-start gap-2 rounded-sm border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 py-2 text-xs text-[var(--text-secondary)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
          {errorCount} dòng có lỗi sẽ không được gửi. Sửa file rồi tải lại nếu cần tạo cả những học sinh này.
        </p>
      ) : (
        <p className="text-sm text-[var(--status-success)]">Tất cả {validCount} dòng đều hợp lệ.</p>
      )}

      <div className="max-h-[50dvh] overflow-auto border-y border-border-card">
        <table className="w-full min-w-[760px] text-sm">
          <caption className="sr-only">Kết quả kiểm tra từng dòng</caption>
          <thead className="sticky top-0 bg-[var(--bg-surface)]">
            <tr className="border-b border-[var(--border-strong)] text-left text-[13px] font-semibold text-[var(--text-tertiary)]">
              <th className="px-2 py-2 font-semibold">Dòng</th>
              {PREVIEW_FIELDS.map((f) => (
                <th key={f.key} className="px-2 py-2 font-semibold">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const bad = Object.keys(r.errors).length > 0;
              return (
                <tr key={r.line} className={cn("border-b border-[var(--border-default)] align-top last:border-b-0", bad && "bg-[var(--status-danger-bg)]")}>
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
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={PREVIEW_FIELDS.length + 1} className="px-3 py-8 text-center text-sm text-content-muted">
                  Không có dòng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── Step 4 ───────────────────────── */
function ConfirmStep({ validCount, skipped, submitError }: { validCount: number; skipped: number; submitError: string | null }) {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-sm border border-border-card p-4">
        <p className="text-sm font-bold text-content-heading">Sẵn sàng tạo {formatNumber(validCount)} tài khoản học sinh</p>
        {skipped > 0 && <p className="text-xs text-content-muted">{skipped} dòng lỗi được bỏ qua.</p>}
        <p className="flex items-start gap-2 text-xs leading-relaxed text-content-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Không cần cấp token cho từng học sinh: mọi học sinh dùng quỹ token chung của trường, tối đa theo hạn mức mỗi ngày (cài ở trang Hạn mức
          token).
        </p>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-content-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Xếp học sinh vào lớp khi nhập chưa được máy chủ hỗ trợ; tài khoản được tạo ở cấp trường.
        </p>
      </div>

      {submitError && (
        <p role="alert" className="flex items-start gap-2 text-sm text-[var(--accent-danger)]">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {submitError}
        </p>
      )}
    </div>
  );
}

/* ───────────────────────── Step 5 ───────────────────────── */
function ResultStep({ session, schoolName, onExported }: { session: ImportSession; schoolName?: string; onExported: () => void }) {
  const r = session.result;
  const records = studentCredentials(r.successfulAccounts);
  return (
    <div className="space-y-5">
      <ImportSummary session={session} />

      {r.errors.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-content-heading">Dòng bị máy chủ từ chối ({r.errors.length})</h3>
          <p className="text-xs text-content-muted">Số dòng tính theo file bạn đã tải lên. Sửa các dòng này rồi nhập lại riêng.</p>
          <ImportErrorsTable errors={r.errors} session={session} />
        </section>
      )}

      {records.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-content-heading">Tài khoản đã tạo</h3>
          <OneTimeWarning />
          {/* Capture clicks on the export buttons to know the passwords were saved. */}
          <div onClickCapture={onExported}>
            <CredentialExportActions
              records={records}
              fileName={`tai-khoan-hoc-sinh-${todayStamp()}.csv`}
              sheetTitle="Phiếu tài khoản học sinh"
              schoolName={schoolName}
            />
          </div>
          <ImportAccountsTable accounts={r.successfulAccounts} maxHeight="max-h-[36dvh]" />
        </section>
      )}
    </div>
  );
}

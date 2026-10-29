"use client";

import * as React from "react";
import { FileText, File, Plus, X, Upload, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffFormLabel, StaffFormInput, StaffFormTextarea } from "@/components/staff/staff-form";
import { PdfViewerDialog } from "@/components/staff/pdf-viewer-dialog";

interface ExtractedPdf {
  fileUrl: string;
  rawText: string;
  pageCount: number;
}

interface NewDocumentPanelProps {
  disabled?: boolean;
  onCreateText: (data: { title: string; content: string }) => Promise<void>;
  isCreateTextPending?: boolean;
  /** Upload the PDF and extract its text — called immediately once a file is picked. onProgress reports page X/Y as each page finishes processing. signal lets the "Hủy" button cancel a long OCR run. */
  onExtractPdf: (
    file: File,
    onProgress?: (page: number, total: number) => void,
    signal?: AbortSignal,
  ) => Promise<ExtractedPdf>;
  isExtractPdfPending?: boolean;
  /** Create the document using the (possibly edited) extracted text + the fileUrl from onExtractPdf. */
  onCreatePdf: (data: { title: string; content: string; fileUrl: string; file: File }) => Promise<void>;
  isCreatePdfPending?: boolean;
  /**
   * Create pages: the document has no button of its own. Whatever is being written / was extracted is reported
   * through onDraftChange (null when cleared) and saved by the page's main Create button.
   */
  deferred?: boolean;
  onDraftChange?: (doc: { title: string; content: string; fileUrl?: string; file?: File } | null) => void;
}

type Step = "closed" | "choose" | "text" | "pdf";
type PdfPhase = "pick" | "extracting" | "review";

// Mirrors the backend: PdfExtractionServiceImpl / SupabaseDocumentStorageService MAX_FILE_BYTES and the 50MB multipart cap.
const PDF_MAX_UPLOAD_MB = 50;
const PDF_MAX_UPLOAD_BYTES = PDF_MAX_UPLOAD_MB * 1024 * 1024;

/**
 * Two independent "new document" creation paths — a text document (title +
 * content) or a PDF document. Picking a PDF immediately uploads it and
 * extracts its text (matches the BE's 1-step upload-and-extract endpoint);
 * staff then review/edit that text in the same content editor as the text
 * path before the document is actually created with content + fileUrl in a
 * single call.
 */
export function NewDocumentPanel({
  disabled,
  onCreateText,
  isCreateTextPending,
  onExtractPdf,
  isExtractPdfPending,
  onCreatePdf,
  isCreatePdfPending,
  deferred = false,
  onDraftChange,
}: NewDocumentPanelProps) {
  const [step, setStep] = React.useState<Step>("closed");
  const [pdfPhase, setPdfPhase] = React.useState<PdfPhase>("pick");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [pickError, setPickError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [extracted, setExtracted] = React.useState<ExtractedPdf | null>(null);
  const [ocrProgress, setOcrProgress] = React.useState<{ page: number; total: number } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const replaceInputRef = React.useRef<HTMLInputElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Deferred mode: keep the page's draft in step with the panel. The callback goes through a ref because pages
  // pass a new function every render, and reporting back re-renders them.
  const onDraftChangeRef = React.useRef(onDraftChange);
  React.useEffect(() => {
    onDraftChangeRef.current = onDraftChange;
  });
  React.useEffect(() => {
    if (!deferred) return;
    const report = onDraftChangeRef.current;
    if (step === "text" && content.trim()) report?.({ title: title.trim(), content: content.trim() });
    else if (step === "pdf" && pdfPhase === "review" && extracted && content.trim())
      report?.({ title: title.trim(), content: content.trim(), fileUrl: extracted.fileUrl, file: file ?? undefined });
    else report?.(null);
  }, [deferred, step, pdfPhase, title, content, extracted, file]);

  const isBusy = !!isCreateTextPending || !!isCreatePdfPending || pdfPhase === "extracting" || !!isExtractPdfPending;

  const clearFile = () => {
    setFile(null);
    setExtracted(null);
    setPdfPhase("pick");
    setOcrProgress(null);
    if (previewUrl) {
      // Defer past this tick — PdfViewerDialog may still be mid-fetch from
      // this blob URL (e.g. the preview dialog was left open when the file
      // was cleared/swapped).
      const urlToRevoke = previewUrl;
      window.setTimeout(() => URL.revokeObjectURL(urlToRevoke), 0);
      setPreviewUrl(null);
    }
  };

  const reset = () => {
    setPickError(null);
    setStep("closed");
    setTitle("");
    setContent("");
    clearFile();
  };

  const cancelExtraction = () => {
    abortControllerRef.current?.abort();
  };

  const handlePickPdf = async (picked: File) => {
    if (picked.size > PDF_MAX_UPLOAD_BYTES) {
      setPickError(`“${picked.name}” nặng ${(picked.size / 1024 / 1024).toFixed(1)}MB, vượt giới hạn ${PDF_MAX_UPLOAD_MB}MB.`);
      return;
    }
    setPickError(null);
    // When swapping an already-extracted file, keep it until the new one succeeds so a failed or cancelled
    // swap puts the previous file (and any edits to its text) back instead of leaving nothing.
    const previous = file && extracted ? { file, previewUrl, extracted, content } : null;
    const newPreviewUrl = URL.createObjectURL(picked);
    setFile(picked);
    setPreviewUrl(newPreviewUrl);
    setPdfPhase("extracting");
    setOcrProgress(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const result = await onExtractPdf(picked, (page, total) => setOcrProgress({ page, total }), controller.signal);
      setExtracted(result);
      setContent(result.rawText);
      setTitle((current) => current.trim() || picked.name.replace(/\.pdf$/i, ""));
      setPdfPhase("review");
      if (previous?.previewUrl) {
        const oldUrl = previous.previewUrl;
        window.setTimeout(() => URL.revokeObjectURL(oldUrl), 0);
      }
    } catch {
      // A user-initiated cancel isn't an error. Any other failure already gets a toast from onExtractPdf's hook.
      if (previous) {
        window.setTimeout(() => URL.revokeObjectURL(newPreviewUrl), 0);
        setFile(previous.file);
        setPreviewUrl(previous.previewUrl);
        setExtracted(previous.extracted);
        setContent(previous.content);
        setOcrProgress(null);
        setPdfPhase("review");
      } else {
        clearFile();
      }
    }
  };

  const onPdfInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    if (picked.type !== "application/pdf" && !/\.pdf$/i.test(picked.name)) {
      setPickError(`“${picked.name}” không phải file PDF. Chỉ nhận file .pdf.`);
      return;
    }
    void handlePickPdf(picked);
  };

  if (step === "closed") {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setStep("choose")} disabled={disabled}>
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Tài liệu mới
      </Button>
    );
  }

  if (step === "choose") {
    return (
      <div className="flex items-center gap-1.5">
        <Button type="button" size="sm" variant="outline" onClick={() => setStep("text")}>
          <FileText className="mr-1.5 h-3.5 w-3.5" />
          Văn bản
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setStep("pdf")}>
          <File className="mr-1.5 h-3.5 w-3.5" />
          PDF
        </Button>
        <Button type="button" size="icon-sm" variant="ghost" onClick={reset} title="Hủy">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  const showContentEditor = step === "text" || (step === "pdf" && pdfPhase === "review");
  const canSubmit =
    title.trim() && (step === "text" ? content.trim() : pdfPhase === "review" && content.trim() && !!extracted);

  return (
    <div
      className="w-full rounded-sm border border-card-light-border bg-[var(--bg-elevated)] p-3 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="flex items-center gap-1.5 text-sm font-semibold text-content-heading"
        >
          {step === "text" ? (
            <>
              <FileText className="h-3.5 w-3.5" />
              Tài liệu văn bản mới
            </>
          ) : (
            <>
              <File className="h-3.5 w-3.5" />
              Tài liệu PDF mới
            </>
          )}
        </p>
        <Button type="button" size="icon-sm" variant="ghost" onClick={reset} disabled={isBusy} title="Hủy">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {(step === "text" || pdfPhase === "review") && (
        <div className="grid gap-1.5">
          <StaffFormLabel>Tiêu đề</StaffFormLabel>
          <StaffFormInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề tài liệu"
            disabled={isBusy}
          />
        </div>
      )}

      {step === "pdf" && pdfPhase !== "review" ? (
        <div className="grid gap-1.5">
          <StaffFormLabel>File PDF</StaffFormLabel>
          {pdfPhase === "extracting" ? (
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed p-4 text-center text-xs"
              style={{ borderColor: "var(--card-light-border)", color: "var(--content-muted)" }}
            >
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {ocrProgress
                  ? `Đã xử lý trang ${ocrProgress.page}/${ocrProgress.total} (${Math.round((ocrProgress.page / ocrProgress.total) * 100)}%)`
                  : "Đang trích xuất nội dung từ PDF..."}
              </div>
              {ocrProgress ? (
                <div className="h-1 w-full max-w-52 overflow-hidden rounded-full" style={{ background: "var(--card-light-border)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((ocrProgress.page / ocrProgress.total) * 100)}%`,
                      background: "var(--accent-gold)",
                    }}
                  />
                </div>
              ) : null}
              <Button type="button" size="sm" variant="outline" onClick={cancelExtraction}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                Hủy
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-sm border-2 border-dashed border-card-light-border p-3 text-center text-xs text-content-muted transition-colors hover:border-[var(--accent-gold)]/50 hover:bg-[var(--accent-gold)]/5"
            >
              Click để chọn file PDF
              <p className="mt-1" style={{ color: "var(--content-subtle)" }}>
                Tối đa {PDF_MAX_UPLOAD_MB}MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={onPdfInputChange}
              />
            </div>
          )}
          {pickError && pdfPhase === "pick" && (
            <p role="alert" className="text-[11px] font-medium text-accent-danger">
              {pickError}
            </p>

          )}
        </div>
      ) : step === "pdf" && file ? (
        <div className="grid gap-1.5">
          <StaffFormLabel>File PDF</StaffFormLabel>
          <div
            className="flex items-center justify-between gap-2 rounded-sm border p-2 text-xs"
            style={{ borderColor: "var(--card-light-border)" }}
          >
            <div className="min-w-0">
              <p className="truncate font-medium" style={{ color: "var(--content-heading)" }}>
                {file.name}
              </p>
              <p style={{ color: "var(--content-muted)" }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
                {extracted ? ` · ${extracted.pageCount.toLocaleString("vi-VN")} trang` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                className="text-accent-gold border-accent-gold/30"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Xem trước
              </Button>
              {/* Opens the file picker straight away; the current file stays until a new one is extracted. */}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => replaceInputRef.current?.click()}
                disabled={isBusy}
                title="Đổi file khác"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Đổi file
              </Button>
              <input
                ref={replaceInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={onPdfInputChange}
              />
            </div>
          </div>
          {pickError && (
            <p role="alert" className="text-[11px] font-medium text-accent-danger">
              {pickError}
            </p>
          )}
        </div>
      ) : null}

      {showContentEditor && (
        <div className="grid gap-1.5">
          <StaffFormLabel>{step === "pdf" ? "Nội dung trích xuất từ PDF (có thể chỉnh sửa)" : "Nội dung"}</StaffFormLabel>
          <StaffFormTextarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={step === "pdf" ? "Nội dung trích xuất tự động..." : "Nhập nội dung tài liệu..."}
            style={{ minHeight: "140px" }}
            disabled={isBusy}
          />
        </div>
      )}

      <PdfViewerDialog open={previewOpen} onOpenChange={setPreviewOpen} pdfUrl={previewUrl} title={file?.name ?? "Xem trước PDF"} />

      {/* Sticky within the page's own scroll (not a second scroll region —
          that produced a confusing nested scrollbar) so the submit button
          stays reachable without hunting for it below a long PDF preview. */}
      {deferred ? (
        // No second Create button on create pages: the document goes out with the page's own one.
        <div className="-mx-3 -mb-3 flex items-center justify-between gap-2 border-t px-3 py-2.5 text-xs text-content-muted border-card-light-border">
          <span>{canSubmit ? "Tài liệu sẽ được lưu cùng lúc khi bấm nút Tạo / Lưu thay đổi của trang." : "Điền tiêu đề và nội dung để đính kèm tài liệu."}</span>
          <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={isBusy}>
            Bỏ tài liệu
          </Button>
        </div>
      ) : (
      <div
        className="sticky bottom-0 -mx-3 -mb-3 flex justify-end gap-2 border-t px-3 py-2.5"
        style={{ borderColor: "var(--card-light-border)", background: "var(--bg-elevated)" }}
      >
        <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={isBusy}>
          Hủy
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isBusy || !canSubmit}
          onClick={async () => {
            try {
              if (step === "text") {
                await onCreateText({ title: title.trim(), content: content.trim() });
              } else if (extracted && file) {
                await onCreatePdf({ title: title.trim(), content: content.trim(), fileUrl: extracted.fileUrl, file });
              }
              reset();
            } catch {
              // creation hooks already surface an error toast
            }
          }}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {isBusy ? "Đang tạo..." : step === "text" ? "Tạo tài liệu" : "Tạo tài liệu PDF"}
        </Button>
      </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { FileText, File, Plus, X, Upload, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaffFormLabel, StaffFormInput, StaffFormTextarea } from "@/components/staff/staff-form";
import { PdfViewerDialog } from "@/components/staff/pdf-viewer-dialog";
import { toast } from "sonner";

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
  onCreatePdf: (data: { title: string; content: string; fileUrl: string }) => Promise<void>;
  isCreatePdfPending?: boolean;
}

type Step = "closed" | "choose" | "text" | "pdf";
type PdfPhase = "pick" | "extracting" | "review";

// Mirrors the backend's uploadPdf multer limit (wdp301-backend/src/middlewares/upload.middleware.ts).
const PDF_MAX_UPLOAD_MB = 100;
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
}: NewDocumentPanelProps) {
  const [step, setStep] = React.useState<Step>("closed");
  const [pdfPhase, setPdfPhase] = React.useState<PdfPhase>("pick");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [extracted, setExtracted] = React.useState<ExtractedPdf | null>(null);
  const [ocrProgress, setOcrProgress] = React.useState<{ page: number; total: number } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

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
      toast.error(`Tối đa ${PDF_MAX_UPLOAD_MB}MB. File đã chọn nặng ${(picked.size / 1024 / 1024).toFixed(1)}MB.`);
      return;
    }
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
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
    } catch {
      // A user-initiated cancel isn't an error — just drop the file silently.
      // Any other failure already gets a toast from onExtractPdf's hook.
      clearFile();
    }
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
      className="w-full rounded-lg border border-card-light-border bg-[var(--bg-elevated)] p-3 space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-content-heading"
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
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center text-xs"
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
                <XIcon className="mr-1.5 h-3.5 w-3.5" />
                Hủy
              </Button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-lg border-2 border-dashed border-card-light-border p-3 text-center text-xs text-content-muted transition-colors hover:border-[var(--accent-gold)]/50 hover:bg-[var(--accent-gold)]/5"
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
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  e.target.value = "";
                  if (picked && picked.type === "application/pdf") {
                    void handlePickPdf(picked);
                  }
                }}
              />
            </div>

          )}
        </div>
      ) : step === "pdf" && file ? (
        <div className="grid gap-1.5">
          <StaffFormLabel>File PDF</StaffFormLabel>
          <div
            className="flex items-center justify-between gap-2 rounded-lg border p-2 text-xs"
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
                className="text-accent-gold border-[rgba(234,179,8,0.3)]"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Xem trước
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearFile}
                disabled={isBusy}
                title="Đổi file khác"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Đổi file
              </Button>
            </div>
          </div>
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
              } else if (extracted) {
                await onCreatePdf({ title: title.trim(), content: content.trim(), fileUrl: extracted.fileUrl });
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
    </div>
  );
}

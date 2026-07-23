"use client";

import * as React from "react";
import { FileTextIcon, FilePdfIcon, PlusIcon, XIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { StaffFormLabel, StaffFormInput, StaffFormTextarea } from "@/components/staff/staff-form";

interface NewDocumentPanelProps {
  disabled?: boolean;
  onCreateText: (data: { title: string; content: string }) => Promise<void>;
  isCreateTextPending?: boolean;
  onCreatePdf: (data: { title: string; file: File }) => Promise<void>;
  isCreatePdfPending?: boolean;
}

type Step = "closed" | "choose" | "text" | "pdf";

/**
 * Two independent "new document" creation paths — a text document (title +
 * content) or a PDF document (title + file) — instead of forcing text
 * content to exist before a PDF can be attached. Each path fires its own
 * create call directly (not gated behind the entity's main Save button).
 */
export function NewDocumentPanel({
  disabled,
  onCreateText,
  isCreateTextPending,
  onCreatePdf,
  isCreatePdfPending,
}: NewDocumentPanelProps) {
  const [step, setStep] = React.useState<Step>("closed");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isBusy = !!isCreateTextPending || !!isCreatePdfPending;

  const reset = () => {
    setStep("closed");
    setTitle("");
    setContent("");
    setFile(null);
  };

  if (step === "closed") {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setStep("choose")} disabled={disabled}>
        <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
        Tài liệu mới
      </Button>
    );
  }

  if (step === "choose") {
    return (
      <div className="flex items-center gap-1.5">
        <Button type="button" size="sm" variant="outline" onClick={() => setStep("text")}>
          <FileTextIcon className="mr-1.5 h-3.5 w-3.5" />
          Văn bản
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setStep("pdf")}>
          <FilePdfIcon className="mr-1.5 h-3.5 w-3.5" />
          PDF
        </Button>
        <Button type="button" size="icon-sm" variant="ghost" onClick={reset} title="Hủy">
          <XIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  const canSubmit = title.trim() && (step === "text" ? content.trim() : file);

  return (
    <div
      className="w-full rounded-lg border p-3 space-y-2.5"
      style={{ borderColor: "var(--card-light-border)", background: "rgba(255,255,255,0.5)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--content-heading)" }}
        >
          {step === "text" ? (
            <>
              <FileTextIcon className="h-3.5 w-3.5" />
              Tài liệu văn bản mới
            </>
          ) : (
            <>
              <FilePdfIcon className="h-3.5 w-3.5" />
              Tài liệu PDF mới
            </>
          )}
        </p>
        <Button type="button" size="icon-sm" variant="ghost" onClick={reset} disabled={isBusy} title="Hủy">
          <XIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid gap-1.5">
        <StaffFormLabel>Tiêu đề</StaffFormLabel>
        <StaffFormInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề tài liệu"
          disabled={isBusy}
        />
      </div>

      {step === "text" ? (
        <div className="grid gap-1.5">
          <StaffFormLabel>Nội dung</StaffFormLabel>
          <StaffFormTextarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung tài liệu..."
            style={{ minHeight: "140px" }}
            disabled={isBusy}
          />
        </div>
      ) : (
        <div className="grid gap-1.5">
          <StaffFormLabel>File PDF</StaffFormLabel>
          {!file ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-lg border-2 border-dashed p-3 text-center text-xs transition-colors hover:border-[var(--accent-gold)]/50 hover:bg-[var(--accent-gold)]/5"
              style={{ borderColor: "var(--card-light-border)", color: "var(--content-muted)" }}
            >
              Click để chọn file PDF
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const picked = e.target.files?.[0];
                  e.target.value = "";
                  if (picked && picked.type === "application/pdf") {
                    setFile(picked);
                  }
                }}
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-between gap-2 rounded-lg border p-2 text-xs"
              style={{ borderColor: "var(--card-light-border)" }}
            >
              <span className="truncate" style={{ color: "var(--content-heading)" }}>
                {file.name}
              </span>
              <Button type="button" size="icon-sm" variant="ghost" onClick={() => setFile(null)} disabled={isBusy}>
                <XIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
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
              } else if (file) {
                await onCreatePdf({ title: title.trim(), file });
              }
              reset();
            } catch {
              // creation hooks already surface an error toast
            }
          }}
        >
          <UploadSimpleIcon className="mr-1.5 h-3.5 w-3.5" />
          {isBusy ? "Đang tạo..." : step === "text" ? "Tạo tài liệu" : "Tạo tài liệu PDF"}
        </Button>
      </div>
    </div>
  );
}

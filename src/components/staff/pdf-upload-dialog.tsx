"use client";

import * as React from "react";
import {
  FilePdfIcon,
  XIcon,
  UploadSimpleIcon,
  CheckIcon,
  FileIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface PdfUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File) => void;
  isUploading?: boolean;
  title?: string;
  description?: string;
}

export function PdfUploadDialog({
  open,
  onOpenChange,
  onUpload,
  isUploading = false,
  title = "Upload PDF",
  description = "Chọn file PDF để upload. Bạn có thể xem preview trước khi xác nhận.",
}: PdfUploadDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Cleanup preview URL when dialog closes or file changes
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
    // Reset input value to allow selecting same file again
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--card-light-border)" }}>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(234, 179, 8, 0.1)" }}
            >
              <FilePdfIcon className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold" style={{ color: "var(--content-heading)" }}>
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />

          {!selectedFile ? (
            /* Drop zone */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                "hover:border-[var(--accent-gold)]/50 hover:bg-[var(--accent-gold)]/5"
              )}
              style={{ borderColor: "var(--card-light-border)" }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(234, 179, 8, 0.1)" }}
              >
                <UploadSimpleIcon className="h-8 w-8" style={{ color: "var(--accent-gold)" }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--content-heading)" }}>
                Click để chọn file hoặc kéo thả PDF vào đây
              </p>
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                Chỉ hỗ trợ file PDF
              </p>
            </div>
          ) : (
            /* Selected file preview */
            <div className="space-y-4">
              {/* File info */}
              <div
                className="flex items-center gap-3 p-3 rounded-lg border"
                style={{ borderColor: "var(--card-light-border)", background: "rgba(234, 179, 8, 0.05)" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(234, 179, 8, 0.15)" }}
                >
                  <FilePdfIcon className="h-5 w-5" style={{ color: "var(--accent-gold)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--content-heading)" }}>
                    {selectedFile.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 rounded-full"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  style={{ color: "var(--accent-danger)" }}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* PDF Preview */}
              {previewUrl && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--content-heading)" }}>
                    Preview PDF
                  </p>
                  <div
                    className="rounded-lg border overflow-hidden"
                    style={{ borderColor: "var(--card-light-border)" }}
                  >
                    <iframe
                      src={previewUrl}
                      className="w-full h-[400px]"
                      title="PDF Preview"
                    />
                  </div>
                  <p className="text-xs text-center" style={{ color: "var(--content-muted)" }}>
                    Đây là preview local. Nội dung có thể khác khi upload lên server.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-end gap-2"
          style={{ borderColor: "var(--card-light-border)" }}
        >
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
            className="bg-transparent border-[var(--card-light-border)] hover:bg-black/5"
            style={{ color: "var(--content-heading)" }}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedFile || isUploading}
            className="border-0 bg-[var(--accent-gold)] text-[var(--bg-deep)] font-semibold transition-all duration-200 hover:brightness-90 hover:shadow-sm cursor-pointer"
          >
            {isUploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Đang upload...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-1.5" />
                Xác nhận upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

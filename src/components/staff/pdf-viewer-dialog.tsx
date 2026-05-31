"use client";

import * as React from "react";
import { FilePdfIcon, XIcon, DownloadIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string | null;
  title?: string;
  isLoading?: boolean;
}

export function PdfViewerDialog({
  open,
  onOpenChange,
  pdfUrl,
  title = "Xem PDF",
  isLoading: externalLoading = false,
}: PdfViewerDialogProps) {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [internalLoading, setInternalLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch PDF and create blob URL when pdfUrl changes
  React.useEffect(() => {
    if (!pdfUrl || !open) {
      setBlobUrl(null);
      setError(null);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function fetchPdf() {
      setInternalLoading(true);
      setError(null);
      if (!pdfUrl) return;
      try {
        const response = await fetch(pdfUrl, {
          signal: controller.signal,
          // Add headers to prevent caching issues
          headers: {
            'Accept': 'application/pdf',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        if (isMounted) {
          setBlobUrl(url);
        } else {
          // Clean up if component unmounted during fetch
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        if (isMounted && err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setInternalLoading(false);
        }
      }
    }

    fetchPdf();

    return () => {
      isMounted = false;
      controller.abort();
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [pdfUrl, open]);

  const isLoading = externalLoading || internalLoading;

  const handleDownload = () => {
    if (blobUrl || pdfUrl) {
      const link = document.createElement("a");
      link.href = blobUrl || pdfUrl || "";
      link.download = "document.pdf";
      link.click();
    }
  };

  const handleOpenInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, "_blank");
    } else if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--card-light-border)" }}>
          <div className="flex items-center justify-between">
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
                  Xem trước tài liệu PDF đã upload
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pdfUrl && !isLoading && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                    className="bg-transparent border-[var(--card-light-border)] hover:bg-black/5"
                    style={{ color: "var(--content-heading)" }}
                  >
                    <ArrowSquareOutIcon className="h-4 w-4 mr-1.5" />
                    Mở tab mới
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="bg-transparent border-[var(--card-light-border)] hover:bg-black/5"
                    style={{ color: "var(--content-heading)" }}
                  >
                    <DownloadIcon className="h-4 w-4 mr-1.5" />
                    Tải xuống
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-hidden" style={{ height: "calc(90vh - 140px)" }}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm" style={{ color: "var(--content-muted)" }}>
                  Đang tải PDF...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: "rgba(239, 68, 68, 0.1)" }}
                >
                  <FilePdfIcon className="h-8 w-8" style={{ color: "rgb(239, 68, 68)" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "rgb(239, 68, 68)" }}>
                  Không thể tải PDF
                </p>
                <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                  {error}
                </p>
              </div>
            </div>
          ) : blobUrl ? (
            <iframe
              src={blobUrl}
              className="w-full h-full"
              title="PDF Viewer"
              style={{ border: "none" }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: "rgba(234, 179, 8, 0.1)" }}
                >
                  <FilePdfIcon className="h-8 w-8" style={{ color: "var(--content-muted)" }} />
                </div>
                <p className="text-sm" style={{ color: "var(--content-muted)" }}>
                  Không thể tải PDF. Vui lòng thử lại sau.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

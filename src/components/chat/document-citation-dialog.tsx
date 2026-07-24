"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  usePublicCharacterDocuments,
  usePublicContextDocuments,
} from "@/features/documents/hooks";
import { useEventDetail } from "@/features/events/hooks";
import type { RagDocument } from "@/services/document.service";
import { findDocumentForQuote, splitContentByQuote } from "@/lib/utils/quote-match";
import {
  CircleNotchIcon,
  WarningCircleIcon,
  FileTextIcon,
  ArrowSquareOutIcon,
  XIcon,
} from "@phosphor-icons/react";

interface DocumentCitationDialogProps {
  onClose: () => void;
  characterId: string;
  contextId?: string;
  /** Đoạn trích cần highlight + dùng để tìm tài liệu tương ứng. */
  quote?: string | null;
  /** Mở thẳng 1 tài liệu cụ thể (vào từ danh sách "Tài liệu tham khảo", không có quote). */
  initialDocumentId?: string | null;
}

function DocumentContent({ content, quote }: { content: string; quote?: string | null }) {
  const markRef = useRef<HTMLElement>(null);
  const parts = useMemo(
    () => splitContentByQuote(content, quote ?? undefined),
    [content, quote],
  );

  useEffect(() => {
    markRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [parts]);

  return (
    <p className="whitespace-pre-wrap text-sm leading-7" style={{ color: "var(--text-primary)" }}>
      {parts.map((part, i) =>
        part.matched ? (
          <mark
            key={i}
            ref={markRef}
            className="rounded px-0.5"
            style={{ background: "var(--accent-gold-glow)", color: "inherit" }}
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </p>
  );
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b shrink-0"
      style={{ borderColor: "var(--border-default)" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileTextIcon size={18} weight="fill" className="shrink-0" style={{ color: "var(--accent-gold)" }} />
        <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
      </div>
      <button
        onClick={onClose}
        aria-label="Đóng"
        className="w-7 h-7 flex items-center justify-center rounded-full shrink-0 transition-all hover:scale-110 active:scale-95 cursor-pointer"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-default)",
          color: "var(--text-secondary)",
        }}
      >
        <XIcon size={13} weight="bold" />
      </button>
    </div>
  );
}

/**
 * Panel đọc tài liệu + xem video bối cảnh, xếp dọc (video trên, nội dung dưới) để
 * người dùng đọc/xem mà không cần chuyển tab.
 *
 * Desktop (md+): dock làm sidebar thật trong layout (đẩy hẹp ChatMain lại, không overlay)
 * để vẫn thao tác/gõ chat được bình thường.
 * Mobile (<md): không đủ chỗ hiển thị song song nên fallback về panel trượt che tạm thời.
 */
export function DocumentCitationDialog({
  onClose,
  characterId,
  contextId,
  quote,
  initialDocumentId,
}: DocumentCitationDialogProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const { data: characterDocs, isLoading: isLoadingCharacterDocs } =
    usePublicCharacterDocuments(characterId);
  const { data: contextDocs, isLoading: isLoadingContextDocs } =
    usePublicContextDocuments(contextId);
  const { data: event } = useEventDetail(contextId);

  const documents = useMemo<RagDocument[]>(
    () => [...(characterDocs ?? []), ...(contextDocs ?? [])],
    [characterDocs, contextDocs],
  );

  const isLoading = isLoadingCharacterDocs || isLoadingContextDocs;

  const matchedDocument = useMemo(() => {
    if (quote) return findDocumentForQuote(quote, documents);
    if (initialDocumentId)
      return documents.find((doc) => doc.id === initialDocumentId) ?? null;
    return null;
  }, [quote, initialDocumentId, documents]);

  const hasVideo = !!event?.videoUrl;
  const title = matchedDocument?.title || "Nguồn tham khảo";

  const renderVideo = () => (
    <div className="relative w-full aspect-video bg-black shrink-0">
      <video
        src={event?.videoUrl ?? undefined}
        controls
        className="absolute inset-0 w-full h-full object-contain"
      />
    </div>
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm px-5 py-4" style={{ color: "var(--text-secondary)" }}>
          <CircleNotchIcon size={16} className="animate-spin" />
          Đang tải tài liệu...
        </div>
      );
    }

    if (matchedDocument) {
      return (
        <div className="px-5 py-4">
          <DocumentContent content={matchedDocument.content} quote={quote} />
          {matchedDocument.fileUrl && (
            <a
              href={matchedDocument.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
              style={{ color: "var(--accent-gold)" }}
            >
              <ArrowSquareOutIcon size={14} />
              Xem file gốc
            </a>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 px-5 py-4">
        <div
          className="flex items-start gap-2 text-sm rounded-lg border p-3"
          style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)" }}
        >
          <WarningCircleIcon size={16} className="shrink-0 mt-0.5" />
          <span>
            Không tìm thấy vị trí chính xác trong tài liệu. Đây là nội dung AI đã trích dẫn:
          </span>
        </div>
        {quote && (
          <blockquote
            className="text-sm leading-relaxed pl-3 border-l-2"
            style={{ borderColor: "var(--accent-gold-soft)", color: "var(--text-secondary)" }}
          >
            {quote}
          </blockquote>
        )}
      </div>
    );
  };

  const panelBody = (
    <>
      <PanelHeader title={title} onClose={onClose} />
      {hasVideo && renderVideo()}
      <div className="flex-1 min-h-0 overflow-y-auto">{renderBody()}</div>
    </>
  );

  return (
    <>
      {/* Desktop: sidebar thật trong layout, không overlay — vẫn thao tác được với chat */}
      <div
        className="hidden md:flex shrink-0 h-full w-105 flex-col border-l overflow-hidden"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border-default)" }}
      >
        {panelBody}
      </div>

      {/* Mobile: không đủ chỗ hiển thị song song, fallback về panel trượt che tạm */}
      <div className="md:hidden">
        <div
          className="fixed inset-0 z-140"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={onClose}
        />
        <div
          className="fixed inset-y-0 right-0 z-150 flex flex-col overflow-hidden w-full border-l"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-default)",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.35)",
          }}
        >
          {panelBody}
        </div>
      </div>
    </>
  );
}

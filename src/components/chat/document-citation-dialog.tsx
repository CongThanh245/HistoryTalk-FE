"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  usePublicCharacterDocuments,
  usePublicContextsDocuments,
} from "@/features/documents/hooks";
import { useEventDetail } from "@/features/events/hooks";
import type { RagDocument } from "@/services/document.service";
import { findDocumentForQuote, splitContentByQuote } from "@/lib/utils/quote-match";
import {
  Loader2,
  AlertTriangle,
  FileText,
  ExternalLink,
  X,
} from "lucide-react";

interface DocumentCitationDialogProps {
  onClose: () => void;
  characterId: string;
  /** Bối cảnh của session chat hiện tại — dùng làm fallback hiển thị video khi tài liệu khớp không xác định được bối cảnh riêng. */
  contextId?: string;
  /**
   * Tất cả bối cảnh mà nhân vật tham gia (một nhân vật có thể có nhiều bối cảnh).
   * AI có thể trích dẫn tài liệu từ bất kỳ bối cảnh nào trong số này, không chỉ
   * bối cảnh của session hiện tại, nên phải tìm khớp trên toàn bộ tập hợp này.
   */
  contextIds?: string[];
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
    <p className="whitespace-pre-wrap text-sm leading-7 text-content-heading">
      {parts.map((part, i) =>
        part.matched ? (
          <mark
            key={i}
            ref={markRef}
            className="rounded px-0.5 bg-(--accent-gold-glow) text-inherit"
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
      className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-border-default shrink-0"
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileText size={18} className="shrink-0 fill-current text-accent-gold" />
        <h3 className="text-sm font-bold truncate text-content-heading">
          {title}
        </h3>
      </div>
      <button
        onClick={onClose}
        aria-label="Đóng"
        className="w-7 h-7 flex items-center justify-center rounded-full shrink-0 transition-all hover:scale-110 active:scale-95 cursor-pointer bg-bg-elevated border border-border-default text-content-text"
      >
        <X size={13} strokeWidth={3} />
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
  contextIds,
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

  // Nhân vật có thể có nhiều bối cảnh — quét tài liệu của tất cả bối cảnh đó
  // (không chỉ bối cảnh của session hiện tại) vì AI có thể trích dẫn từ bất kỳ đâu.
  const effectiveContextIds =
    contextIds && contextIds.length > 0 ? contextIds : contextId ? [contextId] : [];

  const { data: characterDocs, isLoading: isLoadingCharacterDocs } =
    usePublicCharacterDocuments(characterId);
  const { data: contextDocs, isLoading: isLoadingContextDocs } =
    usePublicContextsDocuments(effectiveContextIds);

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

  // Video minh hoạ phải theo đúng bối cảnh của tài liệu vừa khớp được, không phải
  // luôn luôn bối cảnh của session hiện tại — nếu không sẽ hiện nhầm video.
  const { data: event } = useEventDetail(matchedDocument?.contextId ?? contextId);

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
        <div className="flex items-center gap-2 text-sm px-5 py-4 text-content-text">
          <Loader2 size={16} className="animate-spin" />
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
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium hover:underline text-accent-gold"
            >
              <ExternalLink size={14} />
              Xem file gốc
            </a>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 px-5 py-4">
        <div
          className="flex items-start gap-2 text-sm rounded-lg border p-3 border-border-default text-content-text"
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>
            Không tìm thấy vị trí chính xác trong tài liệu. Đây là nội dung AI đã trích dẫn:
          </span>
        </div>
        {quote && (
          <blockquote
            className="text-sm leading-relaxed pl-3 border-l-2 border-accent-gold-soft text-content-text"
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
        className="hidden md:flex shrink-0 h-full w-105 flex-col border-l border-border-default overflow-hidden bg-bg-surface"
      >
        {panelBody}
      </div>

      {/* Mobile: không đủ chỗ hiển thị song song, fallback về panel trượt che tạm */}
      <div className="md:hidden">
        <div
          className="fixed inset-0 z-140 bg-black/35"
          onClick={onClose}
        />
        <div
          className="fixed inset-y-0 right-0 z-150 flex flex-col overflow-hidden w-full border-l border-border-default bg-bg-surface shadow-[-8px_0_32px_rgba(0,0,0,0.35)]"
        >
          {panelBody}
        </div>
      </div>
    </>
  );
}

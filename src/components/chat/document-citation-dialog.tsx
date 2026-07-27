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
  /** Bối cảnh đang active của phiên chat — dùng để hiển thị video minh họa. */
  contextId?: string;
  /**
   * Tất cả bối cảnh nhân vật này liên kết (1 nhân vật có thể gắn nhiều hơn 1
   * bối cảnh/file). Khi đối chiếu quote phải quét tài liệu của TẤT CẢ các
   * bối cảnh này, không chỉ riêng `contextId` đang active — nếu không sẽ có
   * trường hợp AI trích dẫn đúng nhưng dialog báo "không tìm thấy" chỉ vì tài
   * liệu nguồn thuộc một bối cảnh khác của cùng nhân vật.
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
    <p className="text-sm leading-7 whitespace-pre-wrap text-content-heading">
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
      <div className="flex items-center min-w-0 gap-2">
        <FileText size={18} className="fill-current shrink-0 text-accent-gold" />
        <h3 className="text-sm font-bold truncate text-content-heading">
          {title}
        </h3>
      </div>
      <button
        onClick={onClose}
        aria-label="Đóng"
        className="flex items-center justify-center transition-all border rounded-full cursor-pointer w-7 h-7 shrink-0 hover:scale-110 active:scale-95 bg-bg-elevated border-border-default text-content-text"
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
    usePublicContextsDocuments(contextIds && contextIds.length > 0 ? contextIds : contextId ? [contextId] : []);
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

  // Video minh hoạ phải theo đúng bối cảnh của tài liệu vừa khớp được, không phải
  // luôn luôn bối cảnh của session hiện tại — nếu không sẽ hiện nhầm video.
  const { data: event } = useEventDetail(matchedDocument?.contextId ?? contextId);

  const hasVideo = !!event?.videoUrl;
  const title = matchedDocument?.title || "Nguồn tham khảo";

  const renderVideo = () => (
    <div className="relative w-full bg-black aspect-video shrink-0">
      <video
        src={event?.videoUrl ?? undefined}
        controls
        className="absolute inset-0 object-contain w-full h-full"
      />
    </div>
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 px-5 py-4 text-sm text-content-text">
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
          className="flex items-start gap-2 p-3 text-sm border rounded-lg border-border-default text-content-text"
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>
            Không tìm thấy vị trí chính xác trong tài liệu. Đây là nội dung AI đã trích dẫn:
          </span>
        </div>
        {quote && (
          <blockquote
            className="pl-3 text-sm leading-relaxed border-l-2 border-accent-gold-soft text-content-text"
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
        className="flex-col hidden h-full overflow-hidden border-l md:flex shrink-0 w-105 border-border-default bg-bg-surface"
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

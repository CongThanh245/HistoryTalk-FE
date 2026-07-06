"use client";

import { useRouter } from "next/navigation";
import { StaffContextDetailView, type ContextDraft } from "@/components/staff/staff-context-detail-view";
import { useCreateEvent } from "@/features/events/hooks";
import { useCreateHistoricalDocument, useUploadDocumentPdf } from "@/features/documents/hooks";
import type { EventEraBackend } from "@/services/event.service";
import { toast } from "sonner";

export default function CreateContextPage() {
  const router = useRouter();

  const createEvent = useCreateEvent();
  const createHistoricalDocument = useCreateHistoricalDocument();
  const uploadDocumentPdf = useUploadDocumentPdf();

  const handleSave = async (draft: ContextDraft) => {
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      era: draft.era as EventEraBackend,
      year: Number(draft.year),
      location: draft.location.trim() || undefined,
      imageUrl: draft.imageUrl.trim() || undefined,
      videoUrl: draft.videoUrl.trim() || undefined,
      isPublished: draft.isPublished,
    };

    try {
      const newContext = await createEvent.mutateAsync(payload);
      const documentContent = draft.documentContent.trim();
      const pendingPdfFile = draft.pendingPdfFile;

      if (documentContent || pendingPdfFile) {
        try {
          const newDoc = await createHistoricalDocument.mutateAsync({
            contextId: newContext.id,
            title: draft.documentTitle.trim() || payload.name,
            content: documentContent || "PDF Document",
            type: "TEXT",
          });

          if (pendingPdfFile && newDoc.id) {
            try {
              await uploadDocumentPdf.mutateAsync({ docId: newDoc.id, file: pendingPdfFile });
              toast.success("Đã upload PDF thành công");
            } catch {
              toast.warning("Tài liệu đã tạo nhưng upload PDF thất bại");
            }
          }
        } catch {
          toast.warning("Bối cảnh đã tạo, nhưng import tài liệu chưa thành công");
        }
      }

      router.push(`/staff/contexts/${newContext.id}`);
    } catch {
      // useCreateEvent already shows the API error toast.
    }
  };

  return (
    <StaffContextDetailView
      mode="create"
      onSave={handleSave}
      isPending={createEvent.isPending || createHistoricalDocument.isPending}
    />
  );
}

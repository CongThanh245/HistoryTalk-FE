"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { StaffContextDetailView, type ContextDraft } from "@/components/staff/staff-context-detail-view";
import { useCreateEvent, useUploadContextMedia } from "@/features/events/hooks";
import { useCreateHistoricalDocument, useUploadDocumentPdf } from "@/features/documents/hooks";
import type { EventEraBackend } from "@/services/event.service";
import { toast } from "sonner";

export default function CreateContextPage() {
  const router = useRouter();

  const createEvent = useCreateEvent();
  const createHistoricalDocument = useCreateHistoricalDocument();
  const uploadDocumentPdf = useUploadDocumentPdf();
  const uploadContextMedia = useUploadContextMedia();

  // Drives the save button's label so multi-step submits (create context →
  // upload media → create doc → upload PDF) show what's actually happening
  // instead of a flat "Đang lưu..." for the whole duration.
  const [saveStep, setSaveStep] = React.useState<string | null>(null);

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
      setSaveStep("Đang tạo bối cảnh...");
      const newContext = await createEvent.mutateAsync(payload);

      // Upload any media picked before the context existed
      const pendingMedia: { file: File; mediaType: "IMAGE_2D" | "VIDEO"; label: string }[] = [
        ...(draft.pendingImageFile ? [{ file: draft.pendingImageFile, mediaType: "IMAGE_2D" as const, label: "ảnh" }] : []),
        ...(draft.pendingVideoFile ? [{ file: draft.pendingVideoFile, mediaType: "VIDEO" as const, label: "video" }] : []),
      ];
      for (const { file, mediaType, label } of pendingMedia) {
        try {
          setSaveStep(`Đang tải ${label} lên... 0%`);
          await uploadContextMedia.mutateAsync({
            contextId: newContext.id,
            file,
            mediaType,
            onProgress: (percent) => setSaveStep(`Đang tải ${label} lên... ${percent}%`),
          });
        } catch {
          toast.warning("Bối cảnh đã tạo, nhưng tải lên media chưa thành công");
        }
      }

      const documentContent = draft.documentContent.trim();
      const pendingPdfFile = draft.pendingPdfFile;

      if (documentContent || pendingPdfFile) {
        try {
          setSaveStep("Đang lưu tài liệu...");
          const newDoc = await createHistoricalDocument.mutateAsync({
            contextId: newContext.id,
            title: draft.documentTitle.trim() || payload.name,
            content: documentContent || "PDF Document",
            type: "TEXT",
          });

          if (pendingPdfFile && newDoc.id) {
            try {
              setSaveStep("Đang tải PDF lên...");
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
    } finally {
      setSaveStep(null);
    }
  };

  return (
    <StaffContextDetailView
      mode="create"
      onSave={handleSave}
      isPending={createEvent.isPending || createHistoricalDocument.isPending || uploadContextMedia.isPending}
      pendingLabel={saveStep}
    />
  );
}

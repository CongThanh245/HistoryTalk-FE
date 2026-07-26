"use client";

import * as React from "react";
import {
  Image as ImageIcon,
  Video,
  Box,
} from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { StaffCharacterMediaPreview } from "@/components/staff/staff-media-preview";
import { MediaSlotField } from "@/components/staff/media-slot-field";
import type { MediaTabProps } from "./types";

export function MediaTab({
  draft,
  isEditing,
  errors,
  isUploadMediaPending,
  isDeleteMediaPending,
  pendingImageFile,
  setPendingImageFile,
  pendingModelFile,
  setPendingModelFile,
  pendingVideoFile,
  setPendingVideoFile,
  pendingImagePreviewUrl,
  setPendingImagePreviewUrl,
  pendingVideoPreviewUrl,
  setPendingVideoPreviewUrl,
  handleMediaPick,
  handleMediaClear,
}: MediaTabProps) {
  return (
    <TabsContent value="media" className="space-y-5 mt-0">
      <MediaSlotField
        label="Ảnh nhân vật"
        icon={<ImageIcon className="h-3.5 w-3.5" />}
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={!isEditing}
        isBusy={isUploadMediaPending || isDeleteMediaPending}
        hasValue={!!draft.image || !!pendingImageFile}
        caption={
          pendingImageFile
            ? `Đã chọn: ${pendingImageFile.name} (sẽ tải lên sau khi lưu)`
            : draft.image
              ? "Đã có ảnh"
              : "Chưa có ảnh"
        }
        onPick={(file) => handleMediaPick(file, "IMAGE_2D", setPendingImageFile, setPendingImagePreviewUrl)}
        onClear={() =>
          handleMediaClear(
            "IMAGE_2D",
            pendingImageFile,
            setPendingImageFile,
            pendingImagePreviewUrl,
            setPendingImagePreviewUrl,
          )
        }
        errorMessage={errors.image}
      >
        {pendingImagePreviewUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable remote asset
          <img
            src={pendingImagePreviewUrl}
            alt="Xem trước ảnh"
            className="mt-1 h-32 w-32 rounded-lg border border-card-light-border object-cover"
          />
        )}
      </MediaSlotField>

      <MediaSlotField
        label="Mô hình 3D (.glb)"
        icon={<Box className="h-3.5 w-3.5" />}
        accept=".glb,.fbx,model/gltf-binary"
        disabled={!isEditing}
        isBusy={isUploadMediaPending || isDeleteMediaPending}
        hasValue={!!draft.modelUrl || !!pendingModelFile}
        caption={
          pendingModelFile
            ? `Đã chọn: ${pendingModelFile.name} (sẽ tải lên sau khi lưu)`
            : draft.modelUrl
              ? "Đã có mô hình 3D"
              : "Chưa có mô hình 3D"
        }
        onPick={(file) => handleMediaPick(file, "MODEL_3D", setPendingModelFile)}
        onClear={() => handleMediaClear("MODEL_3D", pendingModelFile, setPendingModelFile)}
      />

      <MediaSlotField
        label="Video nhân vật"
        icon={<Video className="h-3.5 w-3.5" />}
        accept="video/mp4,video/webm,video/quicktime"
        disabled={!isEditing}
        isBusy={isUploadMediaPending || isDeleteMediaPending}
        hasValue={!!draft.videoUrl || !!pendingVideoFile}
        caption={
          pendingVideoFile
            ? `Đã chọn: ${pendingVideoFile.name} (sẽ tải lên sau khi lưu)`
            : draft.videoUrl
              ? "Đã có video"
              : "Chưa có video"
        }
        onPick={(file) => handleMediaPick(file, "VIDEO", setPendingVideoFile, setPendingVideoPreviewUrl)}
        onClear={() =>
          handleMediaClear(
            "VIDEO",
            pendingVideoFile,
            setPendingVideoFile,
            pendingVideoPreviewUrl,
            setPendingVideoPreviewUrl,
          )
        }
      >
        {(pendingVideoPreviewUrl || draft.videoUrl) && (
          <video
            src={pendingVideoPreviewUrl || draft.videoUrl}
            controls
            className="mt-1 h-32 w-full max-w-xs rounded-lg border border-card-light-border object-cover"
          />
        )}
      </MediaSlotField>

      <StaffCharacterMediaPreview
        imageUrl={draft.image}
        modelUrl={draft.modelUrl}
        alt={draft.name || "Ảnh nhân vật"}
      />
    </TabsContent>
  );
}

"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { ImageIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { isValidUrl } from "@/lib/utils/url";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FBXCharacterViewer = dynamic(
  () =>
    import("@/components/chat/FBXCharacterViewer").then(
      (mod) => mod.FBXCharacterViewer,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full items-center justify-center text-xs"
        style={{ color: "var(--content-muted)" }}
      >
        Đang tải preview 3D...
      </div>
    ),
  },
);

type StaffImageHoverPreviewProps = {
  src?: string | null;
  alt: string;
  thumbClassName: string;
  previewClassName: string;
  sizes: string;
  previewSizes: string;
  fallback?: ReactNode;
};

export function StaffImageHoverPreview({
  src,
  alt,
  thumbClassName,
  previewClassName,
  sizes,
  previewSizes,
  fallback,
}: StaffImageHoverPreviewProps) {
  const hasImage = isValidUrl(src);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn("relative shrink-0 overflow-hidden", thumbClassName)}
            style={{
              background: "var(--card-light-border)",
              borderColor: "var(--card-light-border)",
            }}
          >
            {hasImage ? (
              <Image
                src={src!}
                alt={alt}
                fill
                className="object-cover"
                sizes={sizes}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ color: "var(--content-subtle)" }}
                title="Chưa có ảnh"
              >
                {fallback ?? <ImageIcon className="h-5 w-5" />}
              </div>
            )}
          </div>
        </TooltipTrigger>
        {hasImage && (
          <TooltipContent
            side="right"
            sideOffset={10}
            className="border bg-white p-2 shadow-xl"
          >
            <div className={cn("relative overflow-hidden rounded-lg", previewClassName)}>
              <Image
                src={src!}
                alt={alt}
                fill
                className="object-cover"
                sizes={previewSizes}
              />
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

type StaffCharacterMediaPreviewProps = {
  imageUrl?: string | null;
  modelUrl?: string | null;
  alt: string;
};

export function StaffCharacterMediaPreview({
  imageUrl,
  modelUrl,
  alt,
}: StaffCharacterMediaPreviewProps) {
  return (
    <div
      className="grid grid-cols-[160px_1fr] gap-3 rounded-xl border p-3"
      style={{
        borderColor: "var(--card-light-border)",
        background: "rgba(255,255,255,0.35)",
      }}
    >
      <div
        className="relative h-44 overflow-hidden rounded-lg border"
        style={{
          borderColor: "var(--card-light-border)",
          background: "var(--card-light-border)",
        }}
      >
        {isValidUrl(imageUrl) ? (
          <Image
            src={imageUrl!}
            alt={alt}
            fill
            className="object-cover"
            sizes="160px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8" style={{ color: "var(--content-subtle)" }} />
          </div>
        )}
      </div>

      <div
        className="relative h-44 overflow-hidden rounded-lg border"
        style={{
          borderColor: "var(--card-light-border)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.65), rgba(0,0,0,0.04))",
        }}
      >
        <FBXCharacterViewer
          modelUrl={isValidUrl(modelUrl) ? modelUrl! : undefined}
          statusText="Xem trước 3D"
        />
      </div>
    </div>
  );
}

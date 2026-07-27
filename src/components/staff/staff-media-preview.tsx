"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Image as ImageIcon } from "lucide-react";
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
        className="flex h-full items-center justify-center text-xs text-content-muted"
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
            className={cn("relative shrink-0 overflow-hidden bg-card-light-border border-card-light-border", thumbClassName)}
          >
            {hasImage ? (
              <Image
                src={src!}
                alt={alt}
                fill
                className="object-cover"
                sizes={sizes}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-content-subtle"
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
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
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
  const [imageBroken, setImageBroken] = useState(false);

  useEffect(() => {
    setImageBroken(false);
  }, [imageUrl]);

  return (
    <div
      className="grid grid-cols-[160px_1fr] gap-3 rounded-xl border border-card-light-border bg-white/35 p-3"
    >
      <div
        className="relative h-44 overflow-hidden rounded-lg border border-card-light-border bg-card-light-border"
      >
        {isValidUrl(imageUrl) && !imageBroken ? (
          <Image
            src={imageUrl!}
            alt={alt}
            fill
            className="object-cover"
            sizes="160px"
            onError={() => setImageBroken(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-content-subtle" />
          </div>
        )}
      </div>

      <div
        className="relative h-44 overflow-hidden rounded-lg border border-card-light-border bg-gradient-to-br from-white/65 to-black/[0.04]"
      >
        <FBXCharacterViewer
          modelUrl={isValidUrl(modelUrl) ? modelUrl! : undefined}
          statusText="Xem trước 3D"
        />
      </div>
    </div>
  );
}

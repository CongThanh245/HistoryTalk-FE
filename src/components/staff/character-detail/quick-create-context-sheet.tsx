"use client";

import * as React from "react";
import {
  ScrollText,
  MapPin,
  Image as ImageIcon,
  Video,
  Plus,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { EventEraBackend } from "@/services/event.service";
import { hasValidationErrors, validateContextDraft } from "@/lib/utils/content-validation";
import type { QuickCtxState } from "./types";
import type { ValidationErrors, ContextValidationField } from "@/lib/utils/content-validation";

function ValidationErrorText({ message }: { message?: string }) {
  return message ? (
    <p className="text-[11px] font-medium text-accent-danger">
      {message}
    </p>
  ) : null;
}

interface QuickCreateContextSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quickCtx: QuickCtxState;
  setQuickContextField: <K extends keyof QuickCtxState>(field: K) => (val: QuickCtxState[K]) => void;
  quickErrors: ValidationErrors<ContextValidationField>;
  resetQuickCtx: () => void;
  createEvent: {
    mutate: (
      data: {
        name: string;
        description: string;
        era: EventEraBackend;
        year: number;
        location?: string;
        imageUrl?: string;
        videoUrl?: string;
        isPublished: boolean;
      },
      options?: { onSuccess?: (newCtx: { id: string }) => void },
    ) => void;
    isPending: boolean;
  };
  onCreated: (newCtxId: string) => void;
}

export function QuickCreateContextSheet({
  open,
  onOpenChange,
  quickCtx,
  setQuickContextField,
  quickErrors,
  resetQuickCtx,
  createEvent,
  onCreated,
}: QuickCreateContextSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col overflow-hidden bg-[var(--bg-content)] border-card-light-border"
      >
        {/* Sheet Header */}
        <SheetHeader
          className="px-6 py-5 border-b border-card-light-border shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(59,130,246,0.1)]"
            >
              <ScrollText className="h-4 w-4 text-accent-blue" />
            </div>
            <div>
              <SheetTitle
                className="text-base font-bold text-content-heading"
              >
                Tạo bối cảnh lịch sử mới
              </SheetTitle>
              <SheetDescription
                className="text-xs mt-0.5 text-content-muted"
              >
                Bối cảnh sẽ được liên kết với nhân vật này ngay sau khi tạo.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Sheet Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Section: Nội dung */}
          <div className="space-y-4">
            <p
              className="text-[10px] font-bold uppercase tracking-widest text-content-muted"
            >
              Nội dung
            </p>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-content-heading">
                Tên bối cảnh <span className="text-accent-danger">*</span>
              </Label>
              <Input
                id="qc-name"
                value={quickCtx.name}
                onChange={(e) => setQuickContextField("name")(e.target.value)}
                placeholder="VD: Chiến thắng Bạch Đằng"
                className="h-9 text-sm"
              />
              <ValidationErrorText message={quickErrors.name} />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-content-heading">
                Mô tả <span className="text-accent-danger">*</span>
              </Label>
              <textarea
                id="qc-description"
                value={quickCtx.description}
                onChange={(e) => setQuickContextField("description")(e.target.value)}
                placeholder="Bối cảnh lịch sử, ý nghĩa sự kiện..."
                rows={4}
                className="w-full resize-none rounded-md border border-card-light-border bg-[var(--bg-content)] px-3 py-2 text-sm text-content-text outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
              />
              <ValidationErrorText message={quickErrors.description} />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5 text-content-heading">
                <MapPin className="h-3.5 w-3.5" />
                Địa điểm <span className="text-accent-danger">*</span>
              </Label>
              <Input
                id="qc-location"
                value={quickCtx.location}
                onChange={(e) => setQuickContextField("location")(e.target.value)}
                placeholder="VD: Sông Bạch Đằng, Quảng Ninh"
                className="h-9 text-sm"
              />
              <ValidationErrorText message={quickErrors.location} />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-card-light-border" />

          {/* Section: Phân loại & Thời gian */}
          <div className="space-y-4">
            <p
              className="text-[10px] font-bold uppercase tracking-widest text-content-muted"
            >
              Phân loại &amp; Thời gian
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-content-heading">
                  Thời đại <span className="text-accent-danger">*</span>
                </Label>
                <Select
                  value={quickCtx.era}
                  onValueChange={(v) => setQuickContextField("era")(v as EventEraBackend)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Chọn thời đại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANCIENT">Cổ đại</SelectItem>
                    <SelectItem value="MEDIEVAL">Trung đại</SelectItem>
                    <SelectItem value="MODERN">Cận đại</SelectItem>
                    <SelectItem value="CONTEMPORARY">Hiện đại</SelectItem>
                  </SelectContent>
                </Select>
                <ValidationErrorText message={quickErrors.era} />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-content-heading">
                  Năm <span className="text-accent-danger">*</span>
                </Label>
                <Input
                  id="qc-year"
                  type="number"
                  value={quickCtx.year}
                  onChange={(e) => setQuickContextField("year")(e.target.value)}
                  placeholder="VD: 938"
                  className="h-9 text-sm"
                />
                <ValidationErrorText message={quickErrors.year} />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-card-light-border" />

          {/* Section: Media */}
          <div className="space-y-4">
            <p
              className="text-[10px] font-bold uppercase tracking-widest text-content-muted"
            >
              Media (tuỳ chọn)
            </p>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5 text-content-heading">
                <ImageIcon className="h-3.5 w-3.5" />
                URL hình ảnh
              </Label>
              <Input
                id="qc-imageUrl"
                value={quickCtx.imageUrl}
                onChange={(e) => setQuickContextField("imageUrl")(e.target.value)}
                placeholder="https://..."
                className="h-9 text-sm"
              />
              <ValidationErrorText message={quickErrors.imageUrl} />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5 text-content-heading">
                <Video className="h-3.5 w-3.5" />
                URL video (tuỳ chọn — có thể tải file video lên sau khi tạo)
              </Label>
              <Input
                id="qc-videoUrl"
                value={quickCtx.videoUrl}
                onChange={(e) => setQuickContextField("videoUrl")(e.target.value)}
                placeholder="https://.../video.mp4"
                className="h-9 text-sm"
              />
              <ValidationErrorText message={quickErrors.videoUrl} />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-card-light-border" />

          {/* Section: Trạng thái */}
          <div
            className={`flex items-center justify-between gap-3 py-3 px-4 rounded-xl border transition-colors ${
              quickCtx.isPublished
                ? "border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.06)]"
                : "border-[rgba(234,179,8,0.35)] bg-[rgba(254,243,199,0.25)]"
            }`}
          >
            <div className="flex-1">
              <p
                className={`text-sm font-semibold ${
                  quickCtx.isPublished ? "text-[rgb(22,163,74)]" : "text-[#92400e]"
                }`}
              >
                {quickCtx.isPublished ? "Đã xuất bản" : "Chưa xuất bản"}
              </p>
              <p className="text-xs mt-0.5 text-content-muted">
                {quickCtx.isPublished
                  ? "Bối cảnh đang hiển thị công khai cho người dùng."
                  : "Bật để hiển thị bối cảnh cho người dùng."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={quickCtx.isPublished}
              onClick={() => setQuickContextField("isPublished")(!quickCtx.isPublished)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${
                quickCtx.isPublished ? "bg-[rgb(34,197,94)]" : "bg-[rgba(234,179,8,0.4)]"
              }`}
            >
              <span
                className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg transition-transform"
                style={{
                  transform: quickCtx.isPublished ? "translateX(20px)" : "translateX(0)",
                }}
              />
            </button>
          </div>
        </div>

        {/* Sheet Footer */}
        <div
          className="px-6 py-4 border-t border-card-light-border shrink-0 flex items-center justify-end gap-2"
        >
          <Button
            variant="outline"
            className="bg-transparent border-[var(--card-light-border)] text-content-heading hover:bg-black/[0.08] hover:border-[var(--content-muted)] transition-colors"
            onClick={() => {
              onOpenChange(false);
              resetQuickCtx();
            }}
          >
            Huỷ
          </Button>
          <Button
            disabled={
              !quickCtx.name.trim() ||
              !quickCtx.description.trim() ||
              !quickCtx.era ||
              !quickCtx.year ||
              !quickCtx.location.trim() ||
              hasValidationErrors(validateContextDraft(quickCtx)) ||
              createEvent.isPending
            }
            className="border-0 bg-[var(--accent-blue)] text-[var(--bg-deep)] transition-all duration-200 hover:brightness-90 hover:shadow-sm cursor-pointer"
            onClick={() => {
              const nextErrors = validateContextDraft(quickCtx);
              if (hasValidationErrors(nextErrors)) {
                toast.error("Vui lòng kiểm tra thông tin bối cảnh.");
                return;
              }
              createEvent.mutate(
                {
                  name: quickCtx.name.trim(),
                  description: quickCtx.description.trim(),
                  era: quickCtx.era as EventEraBackend,
                  year: Number(quickCtx.year),
                  location: quickCtx.location.trim() || undefined,
                  imageUrl: quickCtx.imageUrl.trim() || undefined,
                  videoUrl: quickCtx.videoUrl.trim() || undefined,
                  isPublished: quickCtx.isPublished,
                },
                {
                  onSuccess: (newCtx) => {
                    onCreated(newCtx.id);
                    onOpenChange(false);
                    resetQuickCtx();
                    toast.success("Tạo bối cảnh thành công!");
                  },
                },
              );
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {createEvent.isPending ? "Đang tạo..." : "Tạo bối cảnh"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

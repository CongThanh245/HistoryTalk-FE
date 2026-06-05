﻿﻿"use client";

import * as React from "react";
import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import Image from "next/image";
import { ScrollIcon, MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, ArrowCounterClockwiseIcon, EyeIcon, CaretDownIcon, UploadSimpleIcon, FilePdfIcon, ImageSquareIcon } from "@phosphor-icons/react";
import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { isValidUrl } from "@/lib/utils/url";
import {
  StaffFormLabel,
  StaffFormInput,
  StaffFormTextarea,
  StaffFormSelect,
} from "@/components/staff/staff-form";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "@/features/events/hooks";
import {
  useTrashList,
  useTrashRestore,
  useTrashPermanentDelete,
} from "@/features/trash/hooks";
import {
  useCreateHistoricalDocument,
  useDeleteHistoricalDocument,
  useHistoricalDocuments,
  useUpdateHistoricalDocument,
  useUploadDocumentPdf,
  useGetDocumentPdfUrl,
} from "@/features/documents/hooks";
import { PdfUploadDialog } from "@/components/staff/pdf-upload-dialog";
import { PdfViewerDialog } from "@/components/staff/pdf-viewer-dialog";
import type { RagDocument } from "@/services/document.service";
import {
  type HistoricalEvent,
  type EventEraBackend,
  ERA_CONFIG,
  EventEra,
} from "@/services/event.service";
import type { TrashItem } from "@/services/trash.service";
import {
  hasValidationErrors,
  validateContextDraft,
  type ContextValidationField,
  type ValidationErrors,
} from "@/lib/utils/content-validation";

type DraftState = {
  id?: string;
  name: string;
  description: string;
  era: EventEraBackend | "";
  year: string;
  location: string;
  imageUrl: string;
  videoUrl: string;
  isPublished: boolean;
  documentId?: string;
  documentTitle: string;
  documentContent: string;
  pendingPdfFile?: File | null;
};

const EMPTY_DRAFT: DraftState = {
  name: "",
  description: "",
  era: "",
  year: "",
  location: "",
  imageUrl: "",
  videoUrl: "",
  isPublished: false,
  documentId: undefined,
  documentTitle: "",
  documentContent: "",
  pendingPdfFile: null,
};

function ValidationErrorText({ message }: { message?: string }) {
  return message ? (
    <p className="text-[11px] font-medium" style={{ color: "var(--accent-danger)" }}>
      {message}
    </p>
  ) : null;
}

// Constants for Select Options
const ERA_OPTIONS = [
  { value: "ANCIENT" as const, label: "Cổ đại" },
  { value: "MEDIEVAL" as const, label: "Trung đại" },
  { value: "MODERN" as const, label: "Cận đại" },
  { value: "CONTEMPORARY" as const, label: "Hiện đại" },
];

const publishStatusSorting: SortingFn<HistoricalEvent> = (rowA, rowB, columnId) => {
  const a = rowA.getValue<boolean>(columnId) ? 1 : 0;
  const b = rowB.getValue<boolean>(columnId) ? 1 : 0;
  return a - b;
};

export default function StaffContextsPage() {
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [draft, setDraft] = React.useState<DraftState>(EMPTY_DRAFT);
  const editorRef = React.useRef<HTMLElement>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] =
    React.useState<HistoricalEvent | null>(null);
  const [showTrash, setShowTrash] = React.useState(false);
  const [permanentDeleteOpen, setPermanentDeleteOpen] = React.useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] =
    React.useState<{ id: string; title: string } | null>(null);
  const [restoreTarget, setRestoreTarget] =
    React.useState<{ id: string; title: string } | null>(null);
  const [restoreOpen, setRestoreOpen] = React.useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [documentOpen, setDocumentOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"content" | "meta" | "rag">("content");
  const ragSectionRef = React.useRef<HTMLDivElement>(null);
  const [errors, setErrors] = React.useState<ValidationErrors<ContextValidationField>>({});

  const { data, isLoading, isFetching } = useEvents({
    search: search || undefined,
    page: 1,
    limit: 100,
  });
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const createHistoricalDocument = useCreateHistoricalDocument();
  const editContextId = mode === "edit" ? draft.id : undefined;
  const historicalDocuments = useHistoricalDocuments(editContextId);
  const updateHistoricalDocument = useUpdateHistoricalDocument(editContextId);
  const deleteHistoricalDocument = useDeleteHistoricalDocument(editContextId);
  const uploadDocumentPdf = useUploadDocumentPdf();
  const getDocumentPdfUrl = useGetDocumentPdfUrl();
  const deleteEvent = useDeleteEvent();

  // PDF Dialog State
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [uploadTargetDocId, setUploadTargetDocId] = React.useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewerUrl, setViewerUrl] = React.useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = React.useState(false);

  // PDF File for Create Mode
  const [pendingPdfFile, setPendingPdfFile] = React.useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: trashItems = [], isLoading: isTrashLoading } = useTrashList("historical-contexts");
  const restoreContext = useTrashRestore("historical-contexts");
  const permanentDeleteContext = useTrashPermanentDelete("historical-contexts");

  const items = data?.content ?? [];
  const activeItems = items;
  const displayedItems = items;

  const set = <K extends keyof DraftState>(field: K) => (val: DraftState[K]) =>
    setDraft((s) => {
      const next = { ...s, [field]: val };
      const validatedFields: ContextValidationField[] = [
        "name",
        "description",
        "era",
        "year",
        "location",
        "imageUrl",
        "videoUrl",
      ];

      if (validatedFields.includes(field as ContextValidationField)) {
        const nextErrors = validateContextDraft(next);
        const errorField = field as ContextValidationField;
        setErrors((prev) => {
          const updated = { ...prev };
          if (nextErrors[errorField]) {
            updated[errorField] = nextErrors[errorField];
          } else {
            delete updated[errorField];
          }
          return updated;
        });
      }

      return next;
    });

  const getDocumentId = React.useCallback(
    (document: RagDocument) => document.id ?? document.documentId,
    [],
  );

  const selectDocument = (document: RagDocument) => {
    setDraft((s) => ({
      ...s,
      documentId: getDocumentId(document),
      documentTitle: document.title ?? "",
      documentContent: document.content ?? "",
    }));
    setDocumentOpen(true);
  };

  const [skipAutoSelect, setSkipAutoSelect] = React.useState(false);

  const clearDocumentDraft = () => {
    setSkipAutoSelect(true);
    setDraft((s) => ({
      ...s,
      documentId: undefined,
      documentTitle: "",
      documentContent: "",
    }));
    setDocumentOpen(true);
    setActiveTab("rag");
    setTimeout(() => {
      ragSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  React.useEffect(() => {
    if (!dialogOpen) return;
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [dialogOpen, mode]);

  // Reset skipAutoSelect when dialog closes so auto-select works for other contexts
  React.useEffect(() => {
    if (!dialogOpen && skipAutoSelect) {
      setSkipAutoSelect(false);
    }
  }, [dialogOpen, skipAutoSelect]);

  React.useEffect(() => {
    if (mode !== "edit" || !dialogOpen || draft.documentId || draft.documentContent || skipAutoSelect) return;
    const firstDocument = historicalDocuments.data?.[0];
    if (!firstDocument) return;
    setDraft((s) => ({
      ...s,
      documentId: getDocumentId(firstDocument),
      documentTitle: firstDocument.title ?? "",
      documentContent: firstDocument.content ?? "",
    }));
    setDocumentOpen(true);
  }, [dialogOpen, draft.documentContent, draft.documentId, getDocumentId, historicalDocuments.data, mode, skipAutoSelect]);

  const handleSave = async () => {
    const nextErrors = validateContextDraft(draft);
    if (hasValidationErrors(nextErrors)) {
      setErrors(nextErrors);
      toast.error("Vui lòng kiểm tra các trường bắt buộc và định dạng năm/URL.");
      return;
    }
    setErrors({});

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

    const name = payload.name;
    if (mode === "create") {
      createEvent.mutate(payload, {
        onSuccess: async (newContext) => {
          const documentContent = draft.documentContent.trim();

          // Create document if has content or PDF file
          if (documentContent || pendingPdfFile) {
            try {
              const newDoc = await createHistoricalDocument.mutateAsync({
                contextId: newContext.id,
                title: draft.documentTitle.trim() || name,
                content: documentContent || "PDF Document",
                type: "TEXT",
              });

              // Upload PDF if file was selected
              if (pendingPdfFile && newDoc.id) {
                try {
                  await uploadDocumentPdf.mutateAsync({
                    docId: newDoc.id,
                    file: pendingPdfFile,
                  });
                  toast.success("Đã upload PDF thành công");
                } catch {
                  toast.warning("Tài liệu đã tạo nhưng upload PDF thất bại");
                }
              }
            } catch {
              toast.warning("Bối cảnh đã tạo, nhưng import tài liệu chưa thành công");
            }
          }

          // Reset pending PDF
          setPendingPdfFile(null);
          if (pdfPreviewUrl) {
            URL.revokeObjectURL(pdfPreviewUrl);
            setPdfPreviewUrl(null);
          }

          setDialogOpen(false);
          if (!payload.isPublished) {
            toast("Đã lưu bản nháp", {
              description: `"${name}" được lưu dạng bản nháp.`,
              duration: 4000,
              style: { background: "#fef3c7", color: "#92400e", border: "1px solid #fbbf24" },
            });
          } else {
            toast.success("Xuất bản thành công", {
              description: `"${name}" đã được công bố.`,
              duration: 4000,
            });
          }
        },
      });
    } else {
      updateEvent.mutate(
        { id: draft.id!, data: payload },
        {
          onSuccess: async () => {
            const documentContent = draft.documentContent.trim();

            if (documentContent) {
              try {
                if (draft.documentId) {
                  await updateHistoricalDocument.mutateAsync({
                    docId: draft.documentId,
                    data: {
                      title: draft.documentTitle.trim() || name,
                      content: documentContent,
                      type: "TEXT",
                    },
                  });
                } else {
                  await createHistoricalDocument.mutateAsync({
                    contextId: draft.id!,
                    title: draft.documentTitle.trim() || name,
                    content: documentContent,
                    type: "TEXT",
                  });
                }
              } catch {
                toast.warning("Bối cảnh đã cập nhật, nhưng import tài liệu chưa thành công");
              }
            }

            setDialogOpen(false);
            if (!payload.isPublished) {
              toast("Đã lưu bản nháp", {
                description: `"${name}" được lưu dạng bản nháp.`,
                duration: 4000,
                style: { background: "#fef3c7", color: "#92400e", border: "1px solid #fbbf24" },
              });
            } else {
              toast.success("Xuất bản thành công", {
                description: `"${name}" đã được công bố.`,
                duration: 4000,
              });
            }
          },
        },
      );
    }
  };

  const columns = React.useMemo<ColumnDef<HistoricalEvent>[]>(
    () => [
      {
        accessorKey: "imageUrl",
        header: "Ảnh",
        cell: ({ row }) => (
          <div
            className="relative h-14 w-20 overflow-hidden rounded-lg border"
            style={{
              background: "var(--card-light-border)",
              borderColor: "var(--card-light-border)",
            }}
          >
            {isValidUrl(row.original.imageUrl) ? (
              <Image
                src={row.original.imageUrl!}
                alt={row.original.title || "Ảnh bối cảnh lịch sử"}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ color: "var(--content-subtle)" }}
                title="Chưa có ảnh"
              >
                <ImageSquareIcon className="h-5 w-5" />
              </div>
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "title",
        header: "Tiêu đề",
        cell: ({ row }) => {
          const summary = row.original.summary || "";
          // Giới hạn 100 ký tự ở tầng dữ liệu
          const truncatedSummary =
            summary.length > 100 ? summary.slice(0, 100) + "..." : summary;

          return (
            <div className="min-w-[260px]">
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--content-heading)" }}
              >
                {row.original.title}
              </p>
              <p
                /* QUAN TRỌNG: Thêm 'overflow-hidden' và 'text-ellipsis' */
                className="text-xs mt-0.5 line-clamp-1 truncate max-w-[400px] block"
                style={{ color: "var(--content-muted)" }}
                title={summary}
              >
                {truncatedSummary}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "isPublished",
        header: "Trạng thái",
        sortDescFirst: false,
        sortingFn: publishStatusSorting,
        cell: ({ row }) => {
          const isDraft = !row.original.isPublished;
          return (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: isDraft ? "rgba(234,179,8,0.1)" : "rgba(34,197,94,0.1)",
                color: isDraft ? "rgb(161,98,7)" : "rgb(22,163,74)",
                border: `1px solid ${isDraft ? "rgba(234,179,8,0.2)" : "rgba(34,197,94,0.2)"}`,
              }}
            >
              <EyeIcon className="h-3 w-3" />
              {isDraft ? "Chưa xuất bản" : "Đã xuất bản"}
            </div>
          );
        },
      },
      {
        accessorKey: "era",
        header: "Thời đại",
        cell: ({ row }) => {
          const eraRaw = row.original.era;
          const era = eraRaw?.toLowerCase() as EventEra | undefined;
          const label =
            era && era in ERA_CONFIG ? ERA_CONFIG[era]?.label : undefined;
          return (
            <span
              className="text-xs font-medium"
              style={{ color: "var(--content-text)" }}
            >
              {label ?? "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "year",
        header: "Năm",
        cell: ({ row }) => (
          <span className="text-xs" style={{ color: "var(--content-muted)" }}>
            {row.original.year < 0
              ? `${Math.abs(row.original.year)} TCN`
              : row.original.year}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-4">Thao tác</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => {
                const e = row.original;
                setMode("edit");
                setDraft({
                  id: e.id,
                  name: e.title,
                  description: e.summary,
                  era: (e.era ?? "") as EventEraBackend | "",
                  year: String(e.year ?? ""),
                  location: e.location ?? "",
                  imageUrl: e.imageUrl ?? "",
                  videoUrl: e.videoUrl ?? "",
                  isPublished: e.isPublished ?? false,
                  documentId: undefined,
                  documentTitle: "",
                  documentContent: "",
                });
                setDocumentOpen(false);
                setDialogOpen(true);
              }}
              style={{ color: "var(--header-text-muted)" }}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => {
                setDeleteTarget(row.original);
                setDeleteOpen(true);
              }}
              style={{ color: "var(--accent-danger)" }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  // Trash view columns
  const trashColumns = React.useMemo<ColumnDef<TrashItem>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Tiêu đề",
        cell: ({ row }) => (
          <div className="min-w-[260px]">
            <p className="text-sm font-semibold" style={{ color: "var(--content-heading)", opacity: 0.6 }}>
              {row.original.title}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "deletedAt",
        header: "Đã xóa lúc",
        cell: ({ row }) => {
          const date = new Date(row.original.deletedAt);
          return (
            <span className="text-xs" style={{ color: "var(--accent-danger)" }}>
              {!isNaN(date.getTime()) ? date.toLocaleString("vi-VN") : "\u2014"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-4">Thao tác</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon-sm" className="rounded-full" title="Khôi phục"
              onClick={() => { setRestoreTarget({ id: row.original.id, title: row.original.title }); setRestoreOpen(true); }}
              style={{ color: "var(--accent-blue)" }}
            >
              <ArrowCounterClockwiseIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="rounded-full" title="Xoa vinh vien"
              onClick={() => { setPermanentDeleteTarget({ id: row.original.id, title: row.original.title }); setPermanentDeleteOpen(true); }}
              style={{ color: "var(--accent-danger)" }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const isPending =
    createEvent.isPending ||
    updateEvent.isPending ||
    createHistoricalDocument.isPending ||
    updateHistoricalDocument.isPending ||
    deleteHistoricalDocument.isPending;

  return (
    <StaffShell
      title="Quản lý bối cảnh lịch sử"
      description="Tạo, cập nhật và kiểm soát bối cảnh lịch sử."
      icon={ScrollIcon}
      accent="var(--accent-gold)"
    >
      {!dialogOpen && (
      <section
        className="rounded-2xl border p-6 space-y-5"
        style={{
          background: "var(--card-light-bg)",
          borderColor: "var(--card-light-border)",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2
              className="text-base font-semibold"
              style={{
                color: "var(--content-heading)",
              }}
            >
              {showTrash ? "Thùng rác" : "Danh sách bối cảnh"}
            </h2>
            <p className="text-sm" style={{ color: "var(--content-muted)" }}>
              {isLoading ? (
                "Đang tải..."
              ) : (
                <>
                  {displayedItems.length} bản ghi
                  {isFetching && (
                    <span className="ml-2 text-xs opacity-50">
                      Đang cập nhật...
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-[340px]">
              <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--content-subtle)" }}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề..."
                className="pl-10 h-10 rounded-xl border"
                style={{
                  background: "rgba(27,38,50,0.05)",
                  borderColor: "var(--card-light-border)",
                }}
              />
            </div>
            <Button
              variant="outline"
              className="h-10 rounded-xl px-4 font-semibold"
              onClick={() => setShowTrash(!showTrash)}
              style={{
                borderColor: showTrash ? "var(--accent-danger)" : "var(--card-light-border)",
                color: showTrash ? "var(--accent-danger)" : "var(--content-heading)",
                background: showTrash ? "rgba(239,68,68,0.08)" : "transparent",
              }}
            >
              {showTrash ? (
                <><ArrowCounterClockwiseIcon className="h-4 w-4 mr-1.5" /> Danh sách</>
              ) : (
                <><TrashIcon className="h-4 w-4 mr-1.5" /> Thùng rác {trashItems.length > 0 && `(${trashItems.length})`}</>
              )}
            </Button>
            {!showTrash && (
              <Button
                className="h-10 rounded-xl px-4 font-semibold border-0 bg-[var(--accent-gold)] text-[var(--bg-deep)] shadow-[0_0_14px_var(--accent-gold-glow)] transition-all duration-200 hover:brightness-90 hover:shadow-[0_0_18px_var(--accent-gold-glow)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                onClick={() => {
                  setMode("create");
                  setDraft(EMPTY_DRAFT);
                  setDocumentOpen(false);
                  setDialogOpen(true);
                }}
              >
                <PlusIcon className="h-4 w-4 mr-1.5" /> Tạo bối cảnh
              </Button>
            )}
          </div>
        </div>

        {showTrash ? (
          <StaffDataTable columns={trashColumns} data={trashItems} emptyMessage="Thùng rác trống." isLoading={isTrashLoading} />
        ) : (
          <StaffDataTable columns={columns} data={displayedItems} emptyMessage="Không tìm thấy bối cảnh phù hợp." isLoading={isLoading} />
        )}
      </section>
      )}

      {/* Context editor workspace */}
      {dialogOpen && (
        <section
          ref={editorRef}
          className="min-h-[calc(100vh-220px)] overflow-hidden rounded-2xl border shadow-[0_18px_50px_rgba(27,38,50,0.08)]"
          style={{
            background: "var(--bg-content)",
            borderColor: "var(--card-light-border)",
            color: "var(--content-heading)",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isPending) return;
              handleSave();
            }}
          >
          {/* Header with Tabs */}
          <div className="border-b px-6 pb-0 pt-5" style={{ borderColor: "var(--card-light-border)" }}>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--content-heading)" }}>
                  {mode === "create" ? "Tạo bối cảnh lịch sử" : "Chỉnh sửa bối cảnh"}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--content-muted)" }}>
                  Thông tin bối cảnh lịch sử hiển thị cho người dùng.
                </p>
              </div>

              {/* Publish Status Toggle - Prominent placement */}
              <div
                className="flex items-center gap-3 py-2 px-3 rounded-xl border transition-colors"
                style={{
                  borderColor: draft.isPublished ? "rgba(34,197,94,0.35)" : "rgba(234,179,8,0.35)",
                  background: draft.isPublished ? "rgba(34,197,94,0.06)" : "rgba(254,243,199,0.25)",
                }}
              >
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: draft.isPublished ? "rgb(22,163,74)" : "#92400e" }}>
                    {draft.isPublished ? "Đã xuất bản" : "Chưa xuất bản"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                    {draft.isPublished ? "Đang hiển thị cho người dùng" : "Bật để xuất bản"}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.isPublished}
                  onClick={() => {
                    if (!draft.isPublished) {
                      const nextErrors = validateContextDraft(draft);
                      if (hasValidationErrors(nextErrors)) {
                        setErrors(nextErrors);
                        toast.error("Vui lòng hoàn tất bối cảnh trước khi xuất bản.");
                        return;
                      }
                      setPublishDialogOpen(true);
                    } else {
                      set("isPublished")(false);
                    }
                  }}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: draft.isPublished ? "rgb(34,197,94)" : "rgba(234,179,8,0.4)",
                  }}
                >
                  <span
                    className="pointer-events-none block h-5 w-5 rounded-full shadow-lg transition-transform"
                    style={{
                      background: "#fff",
                      transform: draft.isPublished ? "translateX(20px)" : "translateX(0)",
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1">
              {[
                { id: "content", label: "Nội dung", icon: "📄" },
                { id: "meta", label: "Phân loại", icon: "🏷️" },
                { id: "rag", label: "Tài liệu RAG", icon: "📚", badge: draft.documentContent.trim() ? "1" : null },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`relative px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? "text-[var(--accent-gold)] border-b-2 border-[var(--accent-gold)]"
                      : "text-[var(--content-muted)] hover:text-[var(--content-heading)] hover:bg-black/5"
                  }`}
                  style={{ background: activeTab === tab.id ? "rgba(114,56,61,0.06)" : "transparent" }}
                >
                  <span className="flex items-center gap-1.5">
                    {tab.label}
                    {tab.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]">
                        {tab.badge}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto thin-scroll">
            {/* Tab Content */}
            <div className="px-6 py-5">
              {activeTab === "content" && (
                <div className="space-y-4 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                Nội dung
              </p>

              {/* Name */}
              <div className="grid gap-1.5">
                <StaffFormLabel>Tên sự kiện *</StaffFormLabel>
                <StaffFormInput
                  value={draft.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="VD: Trận Bạch Đằng"
                />
                <ValidationErrorText message={errors.name} />
              </div>

              {/* Description */}
              <div className="grid gap-1.5">
                <StaffFormLabel>Mô tả *</StaffFormLabel>
                <StaffFormTextarea
                  value={draft.description}
                  onChange={(e) => set("description")(e.target.value)}
                  placeholder="Bối cảnh lịch sử..."
                />
                <ValidationErrorText message={errors.description} />
              </div>

              <div className="grid gap-1.5">
                <StaffFormLabel>Địa điểm *</StaffFormLabel>
                <StaffFormInput
                  value={draft.location}
                  onChange={(e) => set("location")(e.target.value)}
                  placeholder="VD: Sông Bạch Đằng, Quảng Ninh"
                />
                <ValidationErrorText message={errors.location} />
              </div>
                </div>
              )}

              {activeTab === "meta" && (
                <div className="space-y-4 max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                    Phân loại & Thời gian
                  </p>

                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <StaffFormLabel>Thời đại *</StaffFormLabel>
                      <StaffFormSelect
                        value={draft.era}
                        onValueChange={set("era")}
                        placeholder="Chọn thời đại"
                        options={ERA_OPTIONS}
                      />
                      <ValidationErrorText message={errors.era} />
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <StaffFormLabel>Năm *</StaffFormLabel>
                    <StaffFormInput
                      type="number"
                      value={draft.year}
                      onChange={(e) => set("year")(e.target.value)}
                      placeholder="938"
                    />
                    <ValidationErrorText message={errors.year} />
                  </div>


                  {/* Media URLs */}
                  <div className="space-y-3 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                      Media
                    </p>
                    <div className="grid gap-1.5">
                      <StaffFormLabel>URL hình ảnh</StaffFormLabel>
                      <StaffFormInput
                        value={draft.imageUrl}
                        onChange={(e) => set("imageUrl")(e.target.value)}
                        placeholder="https://..."
                      />
                      <ValidationErrorText message={errors.imageUrl} />
                    </div>
                    <div className="grid gap-1.5">
                      <StaffFormLabel>URL video (YouTube)</StaffFormLabel>
                      <StaffFormInput
                        value={draft.videoUrl}
                        onChange={(e) => set("videoUrl")(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      <ValidationErrorText message={errors.videoUrl} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "rag" && (
                <div ref={ragSectionRef} className="space-y-4 max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                    Tài liệu RAG kèm theo
                  </p>

                  {mode === "edit" && (
                        <div className="rounded-lg border p-3" style={{ borderColor: "var(--card-light-border)" }}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                              Tài liệu đã import
                              {historicalDocuments.data && historicalDocuments.data.length > 0 && (
                                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                                  {historicalDocuments.data.length}
                                </span>
                              )}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                clearDocumentDraft();
                              }}
                              className="shrink-0"
                            >
                              <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                              Tài liệu mới
                            </Button>
                          </div>

                          {historicalDocuments.isLoading ? (
                            <p className="text-xs" style={{ color: "var(--content-muted)" }}>Đang tải tài liệu...</p>
                          ) : historicalDocuments.data?.length ? (
                            <div
                              className="space-y-2 max-h-[180px] overflow-y-auto pr-1 thin-scroll"
                              style={{ scrollbarWidth: "thin" }}
                            >
                              {historicalDocuments.data.map((document, index) => {
                                const documentId = getDocumentId(document);
                                const selected = !!documentId && draft.documentId === documentId;

                                return (
                                  <div
                                    key={documentId ?? `historical-document-${index}`}
                                    className="flex items-start gap-2 rounded-md border p-2"
                                    style={{
                                      borderColor: selected
                                        ? "rgba(59,130,246,0.45)"
                                        : "var(--card-light-border)",
                                      background: selected
                                        ? "rgba(59,130,246,0.08)"
                                        : "rgba(255,255,255,0.35)",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className="min-w-0 flex-1 text-left"
                                      onClick={() => selectDocument(document)}
                                    >
                                      <p className="truncate text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
                                        {document.title || "Tài liệu chưa đặt tên"}
                                      </p>
                                      <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: "var(--content-muted)" }}>
                                        {document.content || "Chưa có nội dung"}
                                      </p>
                                    </button>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="shrink-0 rounded-full"
                                        disabled={getDocumentPdfUrl.isPending}
                                        onClick={async () => {
                                          if (!documentId) return;
                                          setViewerLoading(true);
                                          setViewerOpen(true);
                                          try {
                                            const result = await getDocumentPdfUrl.mutateAsync(documentId);
                                            if (result.url) {
                                              setViewerUrl(result.url);
                                            }
                                          } catch {
                                            setViewerUrl(null);
                                          } finally {
                                            setViewerLoading(false);
                                          }
                                        }}
                                        style={{ color: "var(--accent-gold)" }}
                                        title="Xem PDF"
                                      >
                                        <EyeIcon className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="shrink-0 rounded-full"
                                        disabled={uploadDocumentPdf.isPending}
                                        onClick={() => {
                                          if (documentId) {
                                            setUploadTargetDocId(documentId);
                                            setUploadDialogOpen(true);
                                          }
                                        }}
                                        style={{ color: "var(--accent-blue)" }}
                                        title="Upload PDF"
                                      >
                                        <UploadSimpleIcon className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        className="shrink-0 rounded-full"
                                        onClick={() => {
                                          if (!documentId) return;
                                          deleteHistoricalDocument.mutate(documentId, {
                                            onSuccess: () => {
                                              if (draft.documentId === documentId) {
                                                clearDocumentDraft();
                                              }
                                            },
                                          });
                                        }}
                                        style={{ color: "var(--accent-danger)" }}
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs" style={{ color: "var(--content-muted)" }}>Chưa có tài liệu nào.</p>
                          )}
                        </div>
                      )}

                      {/* PDF Upload for Create Mode */}
                      {mode === "create" && (
                        <div className="rounded-lg border p-3" style={{ borderColor: "var(--card-light-border)" }}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                              File PDF đính kèm
                              {pendingPdfFile && (
                                <span className="ml-1.5 text-micro px-1.5 py-0.5 rounded-full bg-(--accent-gold)/10 text-(--accent-gold)">
                                  Đã chọn
                                </span>
                              )}
                            </p>
                            {pendingPdfFile && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setPendingPdfFile(null);
                                  if (pdfPreviewUrl) {
                                    URL.revokeObjectURL(pdfPreviewUrl);
                                    setPdfPreviewUrl(null);
                                  }
                                }}
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          {!pendingPdfFile ? (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-(--accent-gold)/50 hover:bg-(--accent-gold)/5"
                              style={{ borderColor: "var(--card-light-border)" }}
                            >
                              <FilePdfIcon className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--content-muted)" }} />
                              <p className="text-sm font-medium" style={{ color: "var(--content-heading)" }}>
                                Click để chọn file PDF
                              </p>
                              <p className="text-xs mt-1" style={{ color: "var(--content-muted)" }}>
                                Hoặc kéo thả file vào đây
                              </p>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file && file.type === "application/pdf") {
                                    setPendingPdfFile(file);
                                    setPdfPreviewUrl(URL.createObjectURL(file));
                                  } else if (file) {
                                    toast.error("Vui lòng chọn file PDF");
                                  }
                                  e.target.value = "";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div
                                className="flex items-center gap-3 p-3 rounded-lg border"
                                style={{ borderColor: "rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.05)" }}
                              >
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ background: "rgba(234,179,8,0.1)" }}
                                >
                                  <FilePdfIcon className="h-5 w-5" style={{ color: "var(--accent-gold)" }} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate" style={{ color: "var(--content-heading)" }}>
                                    {pendingPdfFile.name}
                                  </p>
                                  <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                                    {(pendingPdfFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setUploadDialogOpen(true)}
                                  style={{ color: "var(--accent-gold)", borderColor: "rgba(234,179,8,0.3)" }}
                                >
                                  <EyeIcon className="h-4 w-4 mr-1.5" />
                                  Xem trước
                                </Button>
                              </div>

                              {pdfPreviewUrl && (
                                <div
                                  className="border rounded-lg overflow-hidden"
                                  style={{ borderColor: "var(--card-light-border)", height: "200px" }}
                                >
                                  <iframe
                                    src={pdfPreviewUrl}
                                    className="w-full h-full"
                                    title="PDF Preview"
                                    style={{ border: "none" }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid gap-1.5">
                        <div className="flex items-center justify-between">
                          <StaffFormLabel>Tiêu đề tài liệu</StaffFormLabel>
                          {draft.documentId && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              Đang sửa: {historicalDocuments.data?.find(d => getDocumentId(d) === draft.documentId)?.title?.slice(0, 20) || 'Tài liệu'}
                              {historicalDocuments.data?.find(d => getDocumentId(d) === draft.documentId)?.title && (historicalDocuments.data?.find(d => getDocumentId(d) === draft.documentId)?.title?.length || 0) > 20 ? '...' : ''}
                            </span>
                          )}
                          {!draft.documentId && draft.documentContent.trim() && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                              Tài liệu mới
                            </span>
                          )}
                        </div>
                        <StaffFormInput
                          value={draft.documentTitle}
                          onChange={(e) => set("documentTitle")(e.target.value)}
                          placeholder="Để trống sẽ dùng tên bối cảnh"
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <div className="flex items-center justify-between">
                          <StaffFormLabel>Nội dung tài liệu</StaffFormLabel>
                          <span className="text-[10px]" style={{ color: "var(--content-muted)" }}>
                            {draft.documentContent.length.toLocaleString()} ký tự
                          </span>
                        </div>
                        <StaffFormTextarea
                          value={draft.documentContent}
                          onChange={(e) => set("documentContent")(e.target.value)}
                          placeholder="Dán plain text tài liệu tham khảo để AI dùng khi chat..."
                          style={{ minHeight: "100px", maxHeight: "200px" }}
                          className="resize-y"
                        />
                      </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-6 py-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Đóng form
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || hasValidationErrors(validateContextDraft(draft))}
                >
                  {isPending ? "Đang lưu..." : "Lưu bối cảnh"}
                </Button>
              </div>
            </div>
          </div>

          <aside
            className="border-t px-5 py-6 xl:border-l xl:border-t-0"
            style={{
              borderColor: "var(--card-light-border)",
              background: "rgba(27,38,50,0.035)",
            }}
          >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                    Bối cảnh đã có
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--content-muted)" }}>
                    {activeItems.length} bản ghi
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-[var(--card-light-border)] text-[var(--content-heading)]"
                  onClick={() => setDialogOpen(false)}
                >
                  Danh sách
                </Button>
              </div>

              <div className="mt-4 space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
                {activeItems.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--content-muted)" }}>
                    Chưa có bối cảnh nào.
                  </p>
                ) : (
                  activeItems.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        setMode("edit");
                        setDraft({
                          id: event.id,
                          name: event.title,
                          description: event.summary,
                          era: (event.era ?? "") as EventEraBackend | "",
                          year: String(event.year ?? ""),
                          location: event.location ?? "",
                          imageUrl: event.imageUrl ?? "",
                          videoUrl: event.videoUrl ?? "",
                          isPublished: event.isPublished ?? false,
                          documentId: undefined,
                          documentTitle: "",
                          documentContent: "",
                        });
                        setDocumentOpen(false);
                      }}
                      className="w-full rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-black/[0.03]"
                      style={{
                        borderColor:
                          draft.id === event.id
                            ? "rgba(201,168,76,0.5)"
                            : "var(--card-light-border)",
                        background:
                          draft.id === event.id
                            ? "rgba(201,168,76,0.08)"
                            : "rgba(255,255,255,0.35)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold line-clamp-1" style={{ color: "var(--content-heading)" }}>
                          {event.title}
                        </p>
                        <span className="shrink-0 text-[11px]" style={{ color: "var(--content-muted)" }}>
                          {event.year < 0 ? `${Math.abs(event.year)} TCN` : event.year}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--content-muted)" }}>
                        {event.summary || "Chưa có mô tả"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </div>
        </form>
      </section>
      )}

      <ConfirmDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        title="Xác nhận xuất bản bối cảnh?"
        description='Khi chuyển sang "Đã xuất bản", bối cảnh này sẽ được hiển thị công khai cho người dùng. Bạn có chắc chắn muốn thực hiện không?'
        confirmLabel="Đồng ý, xuất bản"
        variant="warning"
        onConfirm={() => {
          set("isPublished")(true);
          setPublishDialogOpen(false);
        }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Chuyển vào thùng rác?"
        description="Bối cảnh sẽ được chuyển vào thùng rác. Bạn có thể xem lại trong mục Thùng rác."
        confirmLabel={deleteEvent.isPending ? "Đang xóa..." : "Chuyển vào thùng rác"}
        variant="danger"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteEvent.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteOpen(false);
              setDeleteTarget(null);
            },
          });
        }}
        isPending={deleteEvent.isPending}
      />

      {/* Restore confirm */}
      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Khôi phục bối cảnh?"
        description={`Bối cảnh "${restoreTarget?.title}" sẽ được khôi phục.`}
        confirmLabel="Khôi phục"
        variant="warning"
        onConfirm={() => {
          if (!restoreTarget) return;
          restoreContext.mutate([restoreTarget.id], {
            onSuccess: () => {
              setRestoreOpen(false);
              setRestoreTarget(null);
            },
          });
        }}
        isPending={restoreContext.isPending}
      />

      {/* Permanent Delete confirm */}
      <ConfirmDialog
        open={permanentDeleteOpen}
        onOpenChange={setPermanentDeleteOpen}
        title="Xóa vĩnh viễn bối cảnh?"
        description="Hành động này không thể hoàn tác. Bối cảnh sẽ bị xóa hoàn toàn khỏi hệ thống."
        confirmLabel={permanentDeleteContext.isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}
        variant="danger"
        onConfirm={() => {
          if (!permanentDeleteTarget) return;
          permanentDeleteContext.mutate([permanentDeleteTarget.id], {
            onSuccess: () => {
              setPermanentDeleteOpen(false);
              setPermanentDeleteTarget(null);
            },
          });
        }}
        isPending={permanentDeleteContext.isPending}
      />

      {/* PDF Upload Dialog */}
      <PdfUploadDialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) setUploadTargetDocId(null);
        }}
        onUpload={async (file) => {
          if (uploadTargetDocId) {
            await uploadDocumentPdf.mutateAsync({ docId: uploadTargetDocId, file });
            setUploadDialogOpen(false);
            setUploadTargetDocId(null);
          }
        }}
        isUploading={uploadDocumentPdf.isPending}
        title="Upload PDF"
        description="Chọn file PDF để upload cho tài liệu này. Bạn có thể xem preview trước khi xác nhận."
      />

      {/* PDF Viewer Dialog */}
      <PdfViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        pdfUrl={viewerUrl}
        isLoading={viewerLoading}
        title="Xem PDF"
      />
    </StaffShell>
  );
}

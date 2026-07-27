"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Search,
  User,
  Scroll,
  ExternalLink,
  Upload,
  Eye,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
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
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { useCharacters } from "@/features/characters/hooks";
import { useEvents } from "@/features/events/hooks";
import {
  useUploadDocumentPdf,
  useGetDocumentPdfUrl,
  useUploadAndExtractPdf,
} from "@/features/documents/hooks";
import { documentService, type RagDocument } from "@/services/document.service";
import { PdfUploadDialog } from "@/components/staff/pdf-upload-dialog";
import { PdfViewerDialog } from "@/components/staff/pdf-viewer-dialog";
import { StaffDocumentDetailDialog } from "@/components/staff/staff-document-detail-dialog";
import { NewDocumentPanel } from "@/components/staff/new-document-panel";
import type { Character } from "@/services/character.service";
import type { HistoricalEvent } from "@/services/event.service";
import { queryKeys } from "@/shared/query-key";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

type DocumentOwnerType = "character" | "context";

type StaffDocumentRow = {
  key: string;
  document: RagDocument;
  ownerType: DocumentOwnerType;
  ownerId: string;
  ownerName: string;
  ownerSubtitle?: string;
  linkedCharacters: Character[];
};

type CharacterDocumentForm = {
  ownerId: string;
  title: string;
  content: string;
  fileUrl?: string;
};

const EMPTY_CHARACTER_DOCUMENT_FORM: CharacterDocumentForm = {
  ownerId: "",
  title: "",
  content: "",
};

const FILTERS: { value: "all" | DocumentOwnerType; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "character", label: "Tài liệu nhân vật" },
  { value: "context", label: "Tài liệu bối cảnh" },
];

function getDocumentId(document: RagDocument) {
  return document.id ?? document.documentId;
}

function hasPdf(document: RagDocument) {
  return !!document.fileUrl?.trim();
}

function makeDocumentKey(
  document: RagDocument,
  ownerType: DocumentOwnerType,
  ownerId: string,
  index: number,
) {
  return getDocumentId(document) ?? `${ownerType}-${ownerId}-${index}`;
}

function getContextCharacters(context: HistoricalEvent, characters: Character[]) {
  return characters.filter(
    (character) =>
      character.contextId === context.id ||
      character.events?.some((event) => event.id === context.id),
  );
}

export default function StaffDocumentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | DocumentOwnerType>("all");
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<StaffDocumentRow | null>(null);
  const [createOwnerType, setCreateOwnerType] = React.useState<DocumentOwnerType>(
    "character",
  );
  const [documentForm, setDocumentForm] = React.useState<CharacterDocumentForm>(
    EMPTY_CHARACTER_DOCUMENT_FORM,
  );
  const [deleteTarget, setDeleteTarget] = React.useState<StaffDocumentRow | null>(null);

  // PDF upload/download
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [uploadTargetDocId, setUploadTargetDocId] = React.useState<string | null>(null);
  const uploadPdf = useUploadDocumentPdf();
  const getPdfUrl = useGetDocumentPdfUrl();
  const extractPdf = useUploadAndExtractPdf();

  // PDF viewer
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewerUrl, setViewerUrl] = React.useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = React.useState(false);

  const invalidateCharacterDocuments = React.useCallback(
    (characterId?: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.characterAll });
      if (characterId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.documents.characterByCharacter(characterId),
        });
      }
    },
    [queryClient],
  );

  const createCharacterDocument = useMutation({
    mutationFn: (data: CharacterDocumentForm) =>
      documentService.createCharacterDocument({
        characterId: data.ownerId,
        title: data.title,
        content: data.content,
        fileUrl: data.fileUrl,
      }),
    onSuccess: (_document, data) => {
      invalidateCharacterDocuments(data.ownerId);
      toast.success("Đã tạo tài liệu nhân vật");
      setFormOpen(false);
      setDocumentForm(EMPTY_CHARACTER_DOCUMENT_FORM);
    },
    onError: () => {
      toast.error("Tạo tài liệu thất bại");
    },
  });

  const updateCharacterDocument = useMutation({
    mutationFn: ({
      docId,
      data,
    }: {
      docId: string;
      data: CharacterDocumentForm;
    }) =>
      documentService.updateCharacterDocument(docId, {
        title: data.title,
        content: data.content,
        type: "TEXT",
      }),
    onSuccess: (_document, variables) => {
      invalidateCharacterDocuments(variables.data.ownerId);
      toast.success("Đã cập nhật tài liệu");
      setFormOpen(false);
      setEditingRow(null);
      setDocumentForm(EMPTY_CHARACTER_DOCUMENT_FORM);
    },
    onError: () => {
      toast.error("Cập nhật tài liệu thất bại");
    },
  });

  const deleteCharacterDocument = useMutation({
    mutationFn: ({ docId }: { docId: string; characterId: string }) =>
      documentService.deleteCharacterDocument(docId),
    onSuccess: (_result, variables) => {
      invalidateCharacterDocuments(variables.characterId);
      toast.success("Đã xóa tài liệu");
      if (selectedKey === deleteTarget?.key) {
        setSelectedKey(null);
        setDetailOpen(false);
      }
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Xóa tài liệu thất bại");
    },
  });

  const createHistoricalDocument = useMutation({
    mutationFn: (data: CharacterDocumentForm) =>
      documentService.createHistoricalDocument({
        contextId: data.ownerId,
        title: data.title,
        content: data.content,
        fileUrl: data.fileUrl,
      }),
    onSuccess: (_document, data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.historicalByContext(data.ownerId),
      });
      toast.success("Đã tạo tài liệu bối cảnh");
      setFormOpen(false);
      setDocumentForm(EMPTY_CHARACTER_DOCUMENT_FORM);
    },
    onError: () => {
      toast.error("Tạo tài liệu thất bại");
    },
  });

  const updateHistoricalDocument = useMutation({
    mutationFn: ({
      docId,
      data,
    }: {
      docId: string;
      data: CharacterDocumentForm;
    }) =>
      documentService.updateHistoricalDocument(docId, {
        title: data.title,
        content: data.content,
        type: "TEXT",
      }),
    onSuccess: (_document, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.historicalByContext(variables.data.ownerId),
      });
      toast.success("Đã cập nhật tài liệu");
      setFormOpen(false);
      setEditingRow(null);
      setDocumentForm(EMPTY_CHARACTER_DOCUMENT_FORM);
    },
    onError: () => {
      toast.error("Cập nhật tài liệu thất bại");
    },
  });

  const deleteHistoricalDocument = useMutation({
    mutationFn: ({ docId }: { docId: string; contextId: string }) =>
      documentService.deleteHistoricalDocument(docId),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.documents.historicalByContext(variables.contextId),
      });
      toast.success("Đã xóa tài liệu");
      if (selectedKey === deleteTarget?.key) {
        setSelectedKey(null);
        setDetailOpen(false);
      }
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Xóa tài liệu thất bại");
    },
  });

  const { data: eventsData, isLoading: isLoadingEvents } = useEvents({
    page: 1,
    limit: 100,
  });
  const { data: charactersData, isLoading: isLoadingCharacters } = useCharacters({
    page: 1,
    limit: 100,
  });

  const contexts = React.useMemo(
    () => (eventsData?.content ?? []).filter((context) => !context.deletedAt),
    [eventsData?.content],
  );
  const characters = React.useMemo(
    () =>
      (charactersData?.content ?? []).filter(
        (character) => !character.deletedAt && character.isActive !== false,
      ),
    [charactersData?.content],
  );

  const contextDocumentQueries = useQueries({
    queries: contexts.map((context) => ({
      queryKey: queryKeys.documents.historicalByContext(context.id),
      queryFn: () => documentService.getHistoricalDocuments(context.id),
      enabled: !!context.id,
    })),
  });

  const characterDocumentQueries = useQueries({
    queries: characters.map((character) => ({
      queryKey: queryKeys.documents.characterByCharacter(character.id),
      queryFn: () => documentService.getCharacterDocuments(character.id),
      enabled: !!character.id,
    })),
  });

  const rows = React.useMemo<StaffDocumentRow[]>(() => {
    const contextRows = contexts.flatMap((context, contextIndex) => {
      const documents = contextDocumentQueries[contextIndex]?.data ?? [];
      const linkedCharacters = getContextCharacters(context, characters);

      return documents.map((document, documentIndex) => ({
        key: makeDocumentKey(document, "context", context.id, documentIndex),
        document,
        ownerType: "context" as const,
        ownerId: context.id,
        ownerName: context.title,
        ownerSubtitle: context.year ? String(context.year) : undefined,
        linkedCharacters,
      }));
    });

    const characterRows = characters.flatMap((character, characterIndex) => {
      const documents = characterDocumentQueries[characterIndex]?.data ?? [];

      return documents.map((document, documentIndex) => ({
        key: makeDocumentKey(document, "character", character.id, documentIndex),
        document,
        ownerType: "character" as const,
        ownerId: character.id,
        ownerName: character.name,
        ownerSubtitle: character.title,
        linkedCharacters: [character],
      }));
    });

    return [...characterRows, ...contextRows].sort((a, b) =>
      a.document.title.localeCompare(b.document.title, "vi"),
    );
  }, [characterDocumentQueries, characters, contextDocumentQueries, contexts]);

  const filteredRows = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesFilter = filter === "all" || row.ownerType === filter;
      if (!matchesFilter) return false;
      if (!q) return true;

      return (
        row.document.title.toLowerCase().includes(q) ||
        row.document.content.toLowerCase().includes(q) ||
        row.ownerName.toLowerCase().includes(q) ||
        row.linkedCharacters.some((character) =>
          character.name.toLowerCase().includes(q),
        )
      );
    });
  }, [filter, rows, search]);

  const selectedRow =
    filteredRows.find((row) => row.key === selectedKey) ?? filteredRows[0];

  const isLoadingDocuments =
    isLoadingEvents ||
    isLoadingCharacters ||
    contextDocumentQueries.some((query) => query.isLoading) ||
    characterDocumentQueries.some((query) => query.isLoading);

  const openCreateForm = React.useCallback(
    (ownerType: DocumentOwnerType) => {
      setEditingRow(null);
      setCreateOwnerType(ownerType);
      setDocumentForm({
        ...EMPTY_CHARACTER_DOCUMENT_FORM,
        ownerId:
          ownerType === "character"
            ? characters[0]?.id ?? ""
            : contexts[0]?.id ?? "",
      });
      setFormOpen(true);
    },
    [characters, contexts],
  );

  const openEditForm = React.useCallback((row: StaffDocumentRow) => {
    setEditingRow(row);
    setDocumentForm({
      ownerId: row.ownerId,
      title: row.document.title ?? "",
      content: row.document.content ?? "",
    });
    setFormOpen(true);
  }, []);

  const submitDocumentForm = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const title = documentForm.title.trim();
      const content = documentForm.content.trim();
      const ownerId = documentForm.ownerId;

      if (!ownerId) {
        toast.error("Vui lòng chọn đối tượng liên kết");
        return;
      }

      if (!title || !content) {
        toast.error("Vui lòng nhập tiêu đề và nội dung");
        return;
      }

      const payload = { ownerId, title, content };
      if (editingRow) {
        const docId = getDocumentId(editingRow.document);
        if (!docId) {
          toast.error("Không tìm thấy ID tài liệu");
          return;
        }
        if (editingRow.ownerType === "character") {
          updateCharacterDocument.mutate({ docId, data: payload });
          return;
        }
        updateHistoricalDocument.mutate({ docId, data: payload });
        return;
      }

      if (createOwnerType === "character") {
        createCharacterDocument.mutate(payload);
      } else {
        createHistoricalDocument.mutate(payload);
      }
    },
    [
      createCharacterDocument,
      createHistoricalDocument,
      createOwnerType,
      documentForm,
      editingRow,
      updateCharacterDocument,
      updateHistoricalDocument,
    ],
  );

  const columns = React.useMemo<ColumnDef<StaffDocumentRow>[]>(
    () => [
      {
        accessorKey: "document.title",
        header: "Tài liệu",
        cell: ({ row }) => (
          <button
            type="button"
            className="min-w-[260px] text-left"
            onClick={() => setSelectedKey(row.original.key)}
          >
            <p className="text-sm font-semibold line-clamp-1 text-content-heading">
              {row.original.document.title || "Tài liệu chưa đặt tên"}
            </p>
            <p className="mt-0.5 max-w-[420px] truncate text-xs text-content-muted">
              {row.original.document.content || "Chưa có nội dung"}
            </p>
          </button>
        ),
      },
      {
        accessorKey: "ownerType",
        header: "Loại liên kết",
        cell: ({ row }) => {
          const isCharacter = row.original.ownerType === "character";
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                isCharacter
                  ? "border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.08)] text-[rgb(37,99,235)]"
                  : "border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.1)] text-[rgb(146,64,14)]"
              )}
            >
              {isCharacter ? <User className="h-3.5 w-3.5" /> : <Scroll className="h-3.5 w-3.5" />}
              {isCharacter ? "Nhân vật" : "Bối cảnh"}
            </span>
          );
        },
      },
      {
        accessorKey: "ownerName",
        header: "Đang gắn với",
        cell: ({ row }) => (
          <div className="min-w-[180px]">
            <p className="text-sm font-medium text-content-heading">
              {row.original.ownerName}
            </p>
            {row.original.ownerSubtitle && (
              <p className="text-xs text-content-muted">
                {row.original.ownerSubtitle}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "linkedCharacters",
        header: "Nhân vật sử dụng",
        cell: ({ row }) => {
          const linkedCharacters = row.original.linkedCharacters;
          return (
            <div className="min-w-[220px]">
              {linkedCharacters.length ? (
                <p className="text-xs line-clamp-2 text-content-muted">
                  {linkedCharacters.map((character) => character.name).join(", ")}
                </p>
              ) : (
                <p className="text-xs text-content-muted">
                  Chưa có nhân vật liên quan
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-2">Thao tác</div>,
        cell: ({ row }) => {
          const docId = getDocumentId(row.original.document);
          const hasDocId = !!docId;
          const canViewPdf = hasDocId && hasPdf(row.original.document);
          return (
            <div className="flex justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-[var(--header-text-muted)]"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(
                    row.original.ownerType === "character"
                      ? `/staff/characters/${row.original.ownerId}`
                      : `/staff/contexts`,
                  );
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-accent-blue"
                disabled={
                  !hasDocId ||
                  updateCharacterDocument.isPending ||
                  updateHistoricalDocument.isPending
                }
                onClick={(e) => {
                  e.stopPropagation();
                  openEditForm(row.original);
                }}
                title="Sửa tài liệu"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-[#dc2626]"
                disabled={
                  !hasDocId ||
                  deleteCharacterDocument.isPending ||
                  deleteHistoricalDocument.isPending
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(row.original);
                }}
                title="Xóa tài liệu"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {!canViewPdf && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-accent-blue"
                  disabled={!hasDocId || uploadPdf.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (docId) {
                      setUploadTargetDocId(docId);
                      setUploadDialogOpen(true);
                    }
                  }}
                  title="Upload PDF"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              )}
              {canViewPdf && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-accent-gold"
                  disabled={getPdfUrl.isPending}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setViewerLoading(true);
                    setViewerOpen(true);
                    try {
                      const result = await getPdfUrl.mutateAsync(docId);
                      if (result.url) {
                        setViewerUrl(result.url);
                      }
                    } catch {
                      setViewerUrl(null);
                    } finally {
                      setViewerLoading(false);
                    }
                  }}
                  title="Xem PDF"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [
      router,
      uploadPdf.isPending,
      getPdfUrl,
      updateCharacterDocument.isPending,
      updateHistoricalDocument.isPending,
      deleteCharacterDocument.isPending,
      deleteHistoricalDocument.isPending,
      openEditForm,
    ],
  );

  return (
    <StaffShell
      title="Quản lý tài liệu"
      description="Xem toàn bộ tài liệu RAG và đối tượng đang sử dụng tài liệu."
      icon={BookOpen}
      accent="var(--accent-blue)"
    >
      <section className="rounded-2xl border p-6 bg-[var(--bg-content)] border-card-light-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Tổng tài liệu" value={rows.length} />
            <SummaryCard
              label="Tài liệu nhân vật"
              value={rows.filter((row) => row.ownerType === "character").length}
            />
            <SummaryCard
              label="Tài liệu bối cảnh"
              value={rows.filter((row) => row.ownerType === "context").length}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[320px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm tài liệu, nhân vật, bối cảnh..."
                className="h-10 rounded-xl pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  className="h-10"
                  disabled={!characters.length && !contexts.length}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm tài liệu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={!characters.length}
                  onClick={() => openCreateForm("character")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Thêm tài liệu nhân vật
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!contexts.length}
                  onClick={() => openCreateForm("context")}
                >
                  <Scroll className="mr-2 h-4 w-4" />
                  Thêm tài liệu bối cảnh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const active = filter === item.value;
            return (
              <Button
                key={item.value}
                type="button"
                variant={active ? "default" : "outline"}
                size="sm"
                className={active ? "" : "bg-transparent"}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            );
          })}
        </div>

        {/* PDF Upload Dialog */}
        <PdfUploadDialog
          open={uploadDialogOpen}
          onOpenChange={(open) => {
            setUploadDialogOpen(open);
            if (!open) setUploadTargetDocId(null);
          }}
          onUpload={(file) => {
            if (uploadTargetDocId) {
              uploadPdf.mutate(
                { docId: uploadTargetDocId, file },
                {
                  onSuccess: () => {
                    setUploadDialogOpen(false);
                    setUploadTargetDocId(null);
                  },
                }
              );
            }
          }}
          isUploading={uploadPdf.isPending}
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

        <Dialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) {
              setEditingRow(null);
              setDocumentForm(EMPTY_CHARACTER_DOCUMENT_FORM);
            }
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
            <DialogHeader>
              <DialogTitle>
                {editingRow
                  ? "Sửa tài liệu"
                  : createOwnerType === "character"
                    ? "Thêm tài liệu nhân vật"
                    : "Thêm tài liệu bối cảnh"}
              </DialogTitle>
            </DialogHeader>
            {editingRow ? (
              <form className="space-y-4" onSubmit={submitDocumentForm}>
                <div className="space-y-2">
                  <Label>Đối tượng liên kết</Label>
                  <div className="rounded-md border px-3 py-2 text-sm border-card-light-border text-content-heading">
                    {editingRow.ownerType === "character" ? "Nhân vật" : "Bối cảnh"}:{" "}
                    {editingRow.ownerName}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-title">Tiêu đề</Label>
                  <Input
                    id="document-title"
                    value={documentForm.title}
                    onChange={(event) =>
                      setDocumentForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Nhập tiêu đề tài liệu"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-content">Nội dung</Label>
                  <Textarea
                    id="document-content"
                    value={documentForm.content}
                    onChange={(event) =>
                      setDocumentForm((current) => ({
                        ...current,
                        content: event.target.value,
                      }))
                    }
                    placeholder="Nhập nội dung tài liệu"
                    className="min-h-[240px]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateCharacterDocument.isPending || updateHistoricalDocument.isPending}
                  >
                    {updateCharacterDocument.isPending || updateHistoricalDocument.isPending
                      ? "Đang lưu..."
                      : "Lưu thay đổi"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {createOwnerType === "character" ? (
                  <div className="space-y-2">
                    <Label htmlFor="document-character">Nhân vật</Label>
                    <Select
                      value={documentForm.ownerId}
                      onValueChange={(value) =>
                        setDocumentForm((current) => ({ ...current, ownerId: value }))
                      }
                    >
                      <SelectTrigger id="document-character" className="w-full">
                        <SelectValue placeholder="Chọn nhân vật" />
                      </SelectTrigger>
                      <SelectContent>
                        {characters.map((character) => (
                          <SelectItem key={character.id} value={character.id}>
                            {character.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="document-context">Bối cảnh</Label>
                    <Select
                      value={documentForm.ownerId}
                      onValueChange={(value) =>
                        setDocumentForm((current) => ({ ...current, ownerId: value }))
                      }
                    >
                      <SelectTrigger id="document-context" className="w-full">
                        <SelectValue placeholder="Chọn bối cảnh" />
                      </SelectTrigger>
                      <SelectContent>
                        {contexts.map((context) => (
                          <SelectItem key={context.id} value={context.id}>
                            {context.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <NewDocumentPanel
                  disabled={!documentForm.ownerId}
                  onCreateText={async ({ title, content }) => {
                    if (!documentForm.ownerId) {
                      toast.error("Vui lòng chọn đối tượng liên kết");
                      return;
                    }
                    if (createOwnerType === "character") {
                      await createCharacterDocument.mutateAsync({
                        ownerId: documentForm.ownerId,
                        title,
                        content,
                      });
                    } else {
                      await createHistoricalDocument.mutateAsync({
                        ownerId: documentForm.ownerId,
                        title,
                        content,
                      });
                    }
                  }}
                  isCreateTextPending={createCharacterDocument.isPending || createHistoricalDocument.isPending}
                  onExtractPdf={async (file, onProgress) => {
                    if (!documentForm.ownerId) {
                      toast.error("Vui lòng chọn đối tượng liên kết");
                      throw new Error("Missing owner");
                    }
                    return extractPdf.mutateAsync({
                      file,
                      entityType: createOwnerType,
                      entityId: documentForm.ownerId,
                      onProgress,
                    });
                  }}
                  isExtractPdfPending={extractPdf.isPending}
                  onCreatePdf={async ({ title, content, fileUrl }) => {
                    if (!documentForm.ownerId) {
                      toast.error("Vui lòng chọn đối tượng liên kết");
                      return;
                    }
                    if (createOwnerType === "character") {
                      await createCharacterDocument.mutateAsync({
                        ownerId: documentForm.ownerId,
                        title,
                        content,
                        fileUrl,
                      });
                    } else {
                      await createHistoricalDocument.mutateAsync({
                        ownerId: documentForm.ownerId,
                        title,
                        content,
                        fileUrl,
                      });
                    }
                  }}
                  isCreatePdfPending={createCharacterDocument.isPending || createHistoricalDocument.isPending}
                />

                <div className="flex justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title="Xóa tài liệu?"
          description={`Tài liệu "${deleteTarget?.document.title || "chưa đặt tên"}" sẽ bị xóa khỏi nhân vật ${deleteTarget?.ownerName || ""}.`}
          confirmLabel="Xóa"
          variant="danger"
          isPending={
            deleteCharacterDocument.isPending || deleteHistoricalDocument.isPending
          }
          onConfirm={() => {
            const docId = deleteTarget ? getDocumentId(deleteTarget.document) : undefined;
            if (!deleteTarget || !docId) return;
            if (deleteTarget.ownerType === "character") {
              deleteCharacterDocument.mutate({
                docId,
                characterId: deleteTarget.ownerId,
              });
              return;
            }
            deleteHistoricalDocument.mutate({
              docId,
              contextId: deleteTarget.ownerId,
            });
          }}
        />

        <div className="mt-5">
          <StaffDataTable
            columns={columns}
            data={filteredRows}
            isLoading={isLoadingDocuments}
            emptyMessage="Không tìm thấy tài liệu phù hợp."
            onRowClick={(row) => {
              setSelectedKey(row.key);
              setDetailOpen(true);
            }}
          />
        </div>

        {/* Document Detail Dialog */}
        {selectedRow && (
          <StaffDocumentDetailDialog
            open={detailOpen}
            onOpenChange={setDetailOpen}
            title={selectedRow.document.title}
            content={selectedRow.document.content}
            emptyContentMessage="Chưa có nội dung."
            titleBadge={
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                  selectedRow.ownerType === "character"
                    ? "bg-[rgba(59,130,246,0.12)] text-[rgb(37,99,235)] border-[rgba(59,130,246,0.25)]"
                    : "bg-[rgba(201,168,76,0.12)] text-[rgb(146,64,14)] border-[rgba(201,168,76,0.3)]"
                )}
              >
                {selectedRow.ownerType === "character" ? <User className="h-3 w-3" /> : <Scroll className="h-3 w-3" />}
                {selectedRow.ownerType === "character" ? "Nhân vật" : "Bối cảnh"}
              </span>
            }
            meta={
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Owner Info */}
                <div className="rounded-xl border p-4 border-card-light-border bg-card-light-bg">
                  <p className="text-xs font-semibold uppercase tracking-widest text-content-heading">
                    Đối tượng liên kết
                  </p>
                  <p className="mt-2 text-sm font-medium text-content-heading">
                    {selectedRow.ownerName}
                  </p>
                  {selectedRow.ownerSubtitle && (
                    <p className="text-xs mt-0.5 text-content-muted">
                      {selectedRow.ownerSubtitle}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDetailOpen(false);
                        router.push(
                          selectedRow.ownerType === "character"
                            ? `/staff/characters/${selectedRow.ownerId}`
                            : `/staff/contexts`,
                        );
                      }}
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Mở {selectedRow.ownerType === "character" ? "nhân vật" : "bối cảnh"}
                    </Button>
                    {getDocumentId(selectedRow.document) && hasPdf(selectedRow.document) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={getPdfUrl.isPending}
                        onClick={async () => {
                          const docId = getDocumentId(selectedRow.document);
                          if (!docId) return;
                          setViewerLoading(true);
                          setViewerOpen(true);
                          try {
                            const result = await getPdfUrl.mutateAsync(docId);
                            if (result.url) {
                              setViewerUrl(result.url);
                            }
                          } catch {
                            setViewerUrl(null);
                          } finally {
                            setViewerLoading(false);
                          }
                        }}
                        className="text-accent-gold border-[rgba(201,168,76,0.3)]"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        {getPdfUrl.isPending ? "Đang tải..." : "Xem PDF"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Linked Characters */}
                <div className="rounded-xl border p-4 border-card-light-border bg-card-light-bg">
                  <p className="text-xs font-semibold uppercase tracking-widest text-content-heading">
                    Nhân vật sử dụng
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedRow.linkedCharacters.length ? (
                      selectedRow.linkedCharacters.map((character) => (
                        <span
                          key={character.id}
                          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.08)] text-[rgb(37,99,235)]"
                        >
                          <User className="h-3 w-3" />
                          {character.name}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-content-muted">
                        Chưa có nhân vật liên quan.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            }
          />
        )}
      </section>
    </StaffShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border px-4 py-3 bg-card-light-bg border-card-light-border">
      <p className="text-xs text-content-muted">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-content-heading">
        {value.toLocaleString("vi-VN")}
      </p>
    </div>
  );
}

"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQueries } from "@tanstack/react-query";
import {
  BooksIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ScrollIcon,
  ArrowSquareOutIcon,
  XIcon,
  UploadSimpleIcon,
  FilePdfIcon,
  DownloadIcon,
  EyeIcon,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCharacters } from "@/features/characters/hooks";
import { useEvents } from "@/features/events/hooks";
import {
  useUploadDocumentPdf,
  useGetDocumentPdfUrl,
} from "@/features/documents/hooks";
import { documentService, type RagDocument } from "@/services/document.service";
import { PdfUploadDialog } from "@/components/staff/pdf-upload-dialog";
import { PdfViewerDialog } from "@/components/staff/pdf-viewer-dialog";
import type { Character } from "@/services/character.service";
import type { HistoricalEvent } from "@/services/event.service";
import { queryKeys } from "@/shared/query-key";

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

const FILTERS: { value: "all" | DocumentOwnerType; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "character", label: "Tài liệu nhân vật" },
  { value: "context", label: "Tài liệu bối cảnh" },
];

function getDocumentId(document: RagDocument) {
  return document.id ?? document.documentId;
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
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | DocumentOwnerType>("all");
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  // PDF upload/download
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [uploadTargetDocId, setUploadTargetDocId] = React.useState<string | null>(null);
  const uploadPdf = useUploadDocumentPdf();
  const getPdfUrl = useGetDocumentPdfUrl();

  // PDF viewer
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [viewerUrl, setViewerUrl] = React.useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = React.useState(false);

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
            <p className="text-sm font-semibold line-clamp-1" style={{ color: "var(--content-heading)" }}>
              {row.original.document.title || "Tài liệu chưa đặt tên"}
            </p>
            <p className="mt-0.5 max-w-[420px] truncate text-xs" style={{ color: "var(--content-muted)" }}>
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
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
              style={{
                borderColor: isCharacter ? "rgba(59,130,246,0.3)" : "rgba(201,168,76,0.35)",
                background: isCharacter ? "rgba(59,130,246,0.08)" : "rgba(201,168,76,0.1)",
                color: isCharacter ? "rgb(37,99,235)" : "rgb(146,64,14)",
              }}
            >
              {isCharacter ? <UserIcon className="h-3.5 w-3.5" /> : <ScrollIcon className="h-3.5 w-3.5" />}
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
            <p className="text-sm font-medium" style={{ color: "var(--content-heading)" }}>
              {row.original.ownerName}
            </p>
            {row.original.ownerSubtitle && (
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
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
                <p className="text-xs line-clamp-2" style={{ color: "var(--content-muted)" }}>
                  {linkedCharacters.map((character) => character.name).join(", ")}
                </p>
              ) : (
                <p className="text-xs" style={{ color: "var(--content-muted)" }}>
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
          return (
            <div className="flex justify-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(
                    row.original.ownerType === "character"
                      ? `/staff/characters/${row.original.ownerId}`
                      : `/staff/contexts`,
                  );
                }}
                style={{ color: "var(--header-text-muted)" }}
              >
                <ArrowSquareOutIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                disabled={!hasDocId || uploadPdf.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  if (docId) {
                    setUploadTargetDocId(docId);
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
                className="rounded-full"
                disabled={!hasDocId || getPdfUrl.isPending}
                onClick={async (e) => {
                  e.stopPropagation();
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
                style={{ color: "var(--accent-gold)" }}
                title="Xem PDF"
              >
                <EyeIcon className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router, uploadPdf.isPending, getPdfUrl, uploadTargetDocId, setUploadDialogOpen, setUploadTargetDocId, setViewerOpen, setViewerUrl, setViewerLoading],
  );

  return (
    <StaffShell
      title="Quản lý tài liệu"
      description="Xem toàn bộ tài liệu RAG và đối tượng đang sử dụng tài liệu."
      icon={BooksIcon}
      accent="var(--accent-blue)"
    >
      <section
        className="rounded-2xl border p-6"
        style={{
          background: "var(--bg-content)",
          borderColor: "var(--card-light-border)",
        }}
      >
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
              <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--content-muted)" }}
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm tài liệu, nhân vật, bối cảnh..."
                className="h-10 rounded-xl pl-9"
              />
            </div>
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
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="!w-[95vw] !max-w-none max-h-[90vh] overflow-hidden p-0">
            {selectedRow ? (
              <>
                <DialogHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--card-light-border)" }}>
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="h-5 w-5" style={{ color: "var(--accent-blue)" }} />
                    <DialogTitle className="text-base font-semibold" style={{ color: "var(--content-heading)" }}>
                      Chi tiết tài liệu
                    </DialogTitle>
                  </div>
                </DialogHeader>

                <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-140px)] space-y-5">
                  {/* Title & Type */}
                  <div>
                    <p className="text-lg font-semibold" style={{ color: "var(--content-heading)" }}>
                      {selectedRow.document.title || "Tài liệu chưa đặt tên"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        style={{
                          background: selectedRow.ownerType === "character" ? "rgba(59,130,246,0.12)" : "rgba(201,168,76,0.12)",
                          color: selectedRow.ownerType === "character" ? "rgb(37,99,235)" : "rgb(146,64,14)",
                          border: `1px solid ${selectedRow.ownerType === "character" ? "rgba(59,130,246,0.25)" : "rgba(201,168,76,0.3)"}`,
                        }}
                      >
                        {selectedRow.ownerType === "character" ? <UserIcon className="h-3 w-3" /> : <ScrollIcon className="h-3 w-3" />}
                        {selectedRow.ownerType === "character" ? "Nhân vật" : "Bối cảnh"}
                      </span>
                    </div>
                  </div>

                  {/* Two column layout for meta info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Owner Info */}
                    <div className="rounded-xl border p-4" style={{ borderColor: "var(--card-light-border)", background: "var(--card-light-bg)" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                        Đối tượng liên kết
                      </p>
                      <p className="mt-2 text-sm font-medium" style={{ color: "var(--content-heading)" }}>
                        {selectedRow.ownerName}
                      </p>
                      {selectedRow.ownerSubtitle && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
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
                          <ArrowSquareOutIcon className="mr-1.5 h-3.5 w-3.5" />
                          Mở {selectedRow.ownerType === "character" ? "nhân vật" : "bối cảnh"}
                        </Button>
                        {getDocumentId(selectedRow.document) && (
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
                            style={{ color: "var(--accent-gold)", borderColor: "rgba(201,168,76,0.3)" }}
                          >
                            <EyeIcon className="mr-1.5 h-3.5 w-3.5" />
                            {getPdfUrl.isPending ? "Đang tải..." : "Xem PDF"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Linked Characters */}
                    <div className="rounded-xl border p-4" style={{ borderColor: "var(--card-light-border)", background: "var(--card-light-bg)" }}>
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                        Nhân vật sử dụng
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedRow.linkedCharacters.length ? (
                          selectedRow.linkedCharacters.map((character) => (
                            <span
                              key={character.id}
                              className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
                              style={{
                                borderColor: "rgba(59,130,246,0.25)",
                                background: "rgba(59,130,246,0.08)",
                                color: "rgb(37,99,235)",
                              }}
                            >
                              <UserIcon className="h-3 w-3" />
                              {character.name}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                            Chưa có nhân vật liên quan.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--content-heading)" }}>
                      Nội dung tài liệu
                    </p>
                    <div
                      className="whitespace-pre-wrap rounded-xl border p-5 text-sm leading-7"
                      style={{
                        borderColor: "var(--card-light-border)",
                        background: "var(--card-light-bg)",
                        color: "var(--content-muted)",
                        maxHeight: "50vh",
                        overflowY: "auto",
                      }}
                    >
                      {selectedRow.document.content || "Chưa có nội dung."}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      </section>
    </StaffShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      <p className="text-xs" style={{ color: "var(--content-muted)" }}>
        {label}
      </p>
      <p className="mt-1 text-xl font-bold" style={{ color: "var(--content-heading)" }}>
        {value.toLocaleString("vi-VN")}
      </p>
    </div>
  );
}

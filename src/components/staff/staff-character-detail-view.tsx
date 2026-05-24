"use client";

import * as React from "react";
import {
  ArrowLeftIcon,
  PencilIcon,
  FloppyDiskIcon,
  ChatCircleDotsIcon,
  EyeIcon,
  LinkIcon,
  CheckCircleIcon,
  PlusIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidUrl } from "@/lib/utils/url";
import {
  StaffFormLabel,
  StaffFormInput,
  StaffFormTextarea,
} from "@/components/staff/staff-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { ChatMain } from "@/components/chat/chat-main";
import { useChatSessions, useCreateSession } from "@/features/chat/hooks";
import type { ChatCharacter } from "@/services/chat.service";
import type { HistoricalEvent, EventEraBackend } from "@/services/event.service";
import { useCreateEvent } from "@/features/events/hooks";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CharacterDraft = {
  id?: string;
  name: string;
  title: string;
  background: string;
  image: string;
  personality: string;
  lifespan: string;
  isActive: boolean;
  isPublished: boolean;
};

export const EMPTY_CHARACTER_DRAFT: CharacterDraft = {
  name: "",
  title: "",
  background: "",
  image: "",
  personality: "",
  lifespan: "",
  isActive: true,
  isPublished: false,
};

interface StaffCharacterDetailViewProps {
  mode: "create" | "edit";
  initialDraft?: CharacterDraft;
  onSave: (draft: CharacterDraft) => void;
  isPending: boolean;
  eventOptions: HistoricalEvent[];
  isLoadingEvents: boolean;
  /** After a character is created/exists, this is the created character id */
  createdCharacterId?: string | null;
  /** Callback to map a context to the character */
  onMapContext: (
    characterId: string,
    contextId: string,
    options?: { onSuccess?: () => void },
  ) => void;
  isMapContextPending?: boolean;
  /** The currently mapped contextId (from character data) */
  initialContextId?: string;
  /** If true, start in editing mode immediately (e.g. navigated from Edit button) */
  initialEditing?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StaffCharacterDetailView({
  mode,
  initialDraft,
  onSave,
  isPending,
  eventOptions,
  isLoadingEvents,
  createdCharacterId,
  onMapContext,
  isMapContextPending,
  initialContextId,
  initialEditing,
}: StaffCharacterDetailViewProps) {
  const router = useRouter();

  /* ── State ── */
  const [draft, setDraft] = React.useState<CharacterDraft>(initialDraft || EMPTY_CHARACTER_DRAFT);
  const [isEditing, setIsEditing] = React.useState(mode === "create" || !!initialEditing);
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false);

  /* Detect if form is dirty */
  const isDirty = React.useMemo(() => {
    if (!initialDraft) return draft.name !== "" || draft.title !== "";
    
    // Deep comparison of relevant fields
    const keys: (keyof CharacterDraft)[] = [
      "name", "title", "background", "image", "personality", "lifespan", "isActive", "isPublished"
    ];
    
    return keys.some(key => {
      const v1 = draft[key] ?? "";
      const v2 = initialDraft[key] ?? "";
      return v1 !== v2;
    });
  }, [draft, initialDraft]);

  /* helper to set a single field */
  const set =
    (field: keyof CharacterDraft) => (val: string | boolean) =>
      setDraft((s) => ({ ...s, [field]: val }));

  /* ── Chat state ── */
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  /* ── Context mapping state ── */
  const [selectedContextId, setSelectedContextId] = React.useState<string>("");
  const [mappedContextId, setMappedContextId] = React.useState<string>("");

  /* ── Quick-create context state ── */
  const [showQuickCreate, setShowQuickCreate] = React.useState(false);
  const [quickCtx, setQuickCtx] = React.useState({
    name: "",
    description: "",
    era: "" as EventEraBackend | "",
    year: "",
  });
  const createEvent = useCreateEvent();

  // Reset state/sync when props change (especially for edit mode)
  React.useEffect(() => {
    if (initialDraft) {
      setDraft(initialDraft);
    }
  }, [initialDraft]);

  React.useEffect(() => {
    setSelectedContextId(initialContextId ?? "");
    setMappedContextId(initialContextId ?? "");
  }, [initialContextId]);

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && isEditing) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isEditing]);

  // Auto-exit editing mode after save completes successfully
  const prevPendingRef = React.useRef(false);
  React.useEffect(() => {
    if (prevPendingRef.current && !isPending) {
      const nowCreated = !!(createdCharacterId || draft.id);
      if (nowCreated) {
        setIsEditing(false);
      }
    }
    prevPendingRef.current = isPending;
  }, [isPending, createdCharacterId, draft.id]);

  /* Whether the character has been persisted (has an id) */
  const isCreated = !!(createdCharacterId || draft.id);
  const characterId = createdCharacterId || draft.id || "";

  // Fetch or create session when character becomes active
  const { data: sessions, isSuccess: isSessionsSuccess } = useChatSessions(
    mappedContextId,
    characterId,
    isCreated && !!mappedContextId
  );

  const createSession = useCreateSession();
  const sessionInitialized = React.useRef(false);

  React.useEffect(() => {
    if (!isCreated || !mappedContextId) return;
    if (!isSessionsSuccess) return;
    if (sessionInitialized.current) return;
    if (sessionId) return;

    sessionInitialized.current = true;

    if (sessions && sessions.length > 0) {
      setSessionId(sessions[0].id);
    } else {
      createSession.mutateAsync({
        contextId: mappedContextId,
        characterId
      }).then((session) => {
        setSessionId(session.id);
      }).catch(console.error);
    }
  }, [isCreated, mappedContextId, characterId, isSessionsSuccess, sessions, sessionId, createSession]);

  /* Build a ChatCharacter object from the draft for the right panel */
  const chatCharacter: ChatCharacter = {
    id: characterId,
    name: draft.name || "Nhân vật mới",
    title: draft.title || "Chức vị",
    description: draft.background || undefined,
    imageUrl: isValidUrl(draft.image) ? draft.image : "",
    contextId: mappedContextId || undefined,
  };

  /* Determine if form can be submitted */
  const canSave = draft.name.trim() && draft.title.trim() && !isPending;

  /* Handle context mapping */
  const handleMapContext = () => {
    if (!selectedContextId || !characterId) return;
    onMapContext(characterId, selectedContextId, {
      onSuccess: () => {
        setMappedContextId(selectedContextId);
        setSessionId(null);
        sessionInitialized.current = false;
      },
    });
  };

  /* Get the name of the mapped context */
  const mappedContextName = React.useMemo(() => {
    if (!mappedContextId) return "";
    const ev = eventOptions.find((e) => e.id === mappedContextId);
    if (!ev) return "";
    return `${ev.title} — ${ev.year < 0 ? `${Math.abs(ev.year)} TCN` : ev.year}`;
  }, [mappedContextId, eventOptions]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-content)]">
      {/* ═══════ Header ═══════ */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: "var(--card-light-border)" }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isDirty && isEditing) {
                setLeaveDialogOpen(true);
              } else {
                router.push("/staff/characters");
              }
            }}
            style={{ color: "var(--content-muted)" }}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0"
              style={{ background: "var(--card-light-border)" }}
            >
              {isValidUrl(draft.image) && (
                <Image
                  src={draft.image}
                  alt={draft.name || "avatar"}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ color: "var(--content-heading)" }}>
                {mode === "create" && !isCreated
                  ? "Tạo nhân vật mới"
                  : draft.name || "Nhân vật"}
              </h1>
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                {mode === "create" && !isCreated
                  ? "Điền thông tin bên trái, xem preview chat bên phải"
                  : draft.title}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCreated && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-[var(--card-light-border)] hover:bg-black/5 text-[var(--content-heading)]"
              onClick={() => setIsEditing(true)}
            >
              <PencilIcon className="h-4 w-4 mr-1.5" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Hủy bỏ thay đổi?"
        description="Bạn có một số thay đổi chưa được lưu. Nếu hủy bỏ, các thay đổi này sẽ bị mất. Bạn có chắc chắn muốn tiếp tục không?"
        confirmLabel="Hủy và xóa thay đổi"
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="danger"
        onConfirm={() => {
          if (initialDraft) setDraft(initialDraft);
          setIsEditing(false);
          setCancelDialogOpen(false);
        }}
      />

      {/* Leave Page confirm */}
      <ConfirmDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        title="Bỏ dở phiên làm việc?"
        description="Bạn có một số thay đổi chưa được lưu và sẽ bị mất nếu bạn rời khỏi trang này. Bạn có chắc chắn muốn rời đi?"
        confirmLabel="Rời đi"
        cancelLabel="Ở lại"
        variant="danger"
        onConfirm={() => {
          setLeaveDialogOpen(false);
          router.push("/staff/characters");
        }}
      />

      {/* ═══════ Body — two columns ═══════ */}
      <div className="flex-1 flex min-h-0">
        {/* ── Left Panel: Form ── */}
        <div
          className="w-[480px] shrink-0 border-r overflow-y-auto"
          style={{ borderColor: "var(--card-light-border)" }}
        >
          <div className="px-6 py-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
              Thông tin nhân vật
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <StaffFormLabel>Tên nhân vật *</StaffFormLabel>
                <StaffFormInput
                  value={draft.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="VD: Ngô Quyền"
                  disabled={!isEditing}
                />
              </div>
              <div className="grid gap-1.5">
                <StaffFormLabel>Chức vị *</StaffFormLabel>
                <StaffFormInput
                  value={draft.title}
                  onChange={(e) => set("title")(e.target.value)}
                  placeholder="VD: Tiết độ sứ"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <StaffFormLabel>Năm sống</StaffFormLabel>
                <StaffFormInput
                  value={draft.lifespan}
                  onChange={(e) => set("lifespan")(e.target.value)}
                  placeholder="VD: 898–944"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <StaffFormLabel>URL hình ảnh</StaffFormLabel>
              <StaffFormInput
                value={draft.image}
                onChange={(e) => set("image")(e.target.value)}
                placeholder="https://..."
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-1.5">
              <StaffFormLabel>Tiểu sử / Bối cảnh</StaffFormLabel>
              <StaffFormTextarea
                value={draft.background}
                onChange={(e) => set("background")(e.target.value)}
                placeholder="Mô tả cuộc đời, vai trò lịch sử..."
                style={{ minHeight: "120px" }}
                disabled={!isEditing}
              />
            </div>

            <div className="grid gap-1.5">
              <StaffFormLabel>Tính cách</StaffFormLabel>
              <StaffFormTextarea
                value={draft.personality}
                onChange={(e) => set("personality")(e.target.value)}
                placeholder="Đặc điểm tính cách, phong cách nói chuyện..."
                style={{ minHeight: "90px" }}
                disabled={!isEditing}
              />
            </div>

            <div
              className="flex items-center gap-3 py-3 px-4 rounded-xl border transition-colors"
              style={{
                borderColor: !isEditing || mappedContextId
                  ? "var(--card-light-border)"
                  : "rgba(234,179,8,0.3)",
                background: !isEditing || mappedContextId
                  ? "rgba(27,38,50,0.03)"
                  : "rgba(234,179,8,0.05)",
              }}
            >
              <Checkbox
                checked={draft.isPublished}
                onCheckedChange={(val) => {
                  if (val) {
                    if (!mappedContextId) return;
                    setPublishDialogOpen(true);
                  } else {
                    set("isPublished")(false);
                  }
                }}
                disabled={!isEditing}
                id="isPublished"
              />
              <div className="flex-1">
                <Label htmlFor="isPublished" className="cursor-pointer text-sm font-medium">
                  Xuất bản cho người dùng
                </Label>
                <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
                  {!mappedContextId && isEditing
                    ? "⚠ Cần liên kết bối cảnh lịch sử trước khi xuất bản."
                    : "Chỉ nhân vật có isPublished = true mới hiển thị cho người dùng."}
                </p>
              </div>
            </div>

            <ConfirmDialog
              open={publishDialogOpen}
              onOpenChange={setPublishDialogOpen}
              title="Xác nhận xuất bản nhân vật?"
              description="Khi xuất bản, nhân vật này sẽ được hiển thị công khai cho người dùng."
              confirmLabel="Đồng ý, xuất bản"
              onConfirm={() => {
                set("isPublished")(true);
                setPublishDialogOpen(false);
              }}
            />

            {isEditing && (
              <div className="flex gap-2 pt-2">
                {isCreated && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent border-[var(--card-light-border)] hover:bg-black/5 text-[var(--content-heading)]"
                    onClick={() => {
                      if (isDirty) {
                        setCancelDialogOpen(true);
                      } else {
                        setIsEditing(false);
                      }
                    }}
                  >
                    Hủy chỉnh sửa
                  </Button>
                )}
                <Button
                  onClick={() => onSave(draft)}
                  disabled={!canSave}
                  className={isCreated ? "flex-1" : "w-full"}
                  style={{ background: "var(--accent-blue)", color: "#fff" }}
                >
                  <FloppyDiskIcon className="h-4 w-4 mr-2" />
                  {isPending
                    ? "Đang lưu..."
                    : isCreated
                      ? "Lưu thay đổi"
                      : "Tạo nhân vật ngay"}
                </Button>
              </div>
            )}

            {isCreated && (
              <div
                className="mt-8 pt-6 border-t space-y-4"
                style={{ borderColor: "var(--card-light-border)" }}
              >
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" style={{ color: "var(--accent-blue)" }} />
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                    Liên kết bối cảnh lịch sử
                  </p>
                </div>

                {mappedContextId && (
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                    style={{
                      borderColor: "rgba(34,197,94,0.3)",
                      background: "rgba(34,197,94,0.06)",
                    }}
                  >
                    <CheckCircleIcon className="h-4 w-4 shrink-0" style={{ color: "rgb(22,163,74)" }} />
                    <p className="text-xs font-medium flex-1 text-green-700">
                      Đã liên kết: {mappedContextName || mappedContextId}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select
                      value={selectedContextId}
                      onValueChange={setSelectedContextId}
                      disabled={isLoadingEvents || isMapContextPending}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isLoadingEvents ? "Đang tải..." : "Chọn bối cảnh để liên kết"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {eventOptions.map((ev) => (
                          <SelectItem key={ev.id} value={ev.id}>
                            {ev.title} — {ev.year < 0 ? `${Math.abs(ev.year)} TCN` : ev.year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleMapContext}
                    disabled={
                      !selectedContextId ||
                      isMapContextPending ||
                      selectedContextId === mappedContextId
                    }
                    className="shrink-0"
                    style={{
                      background: selectedContextId && selectedContextId !== mappedContextId ? "var(--accent-blue)" : undefined,
                      color: selectedContextId && selectedContextId !== mappedContextId ? "#fff" : undefined,
                    }}
                  >
                    <LinkIcon className="h-4 w-4 mr-1.5" />
                    {isMapContextPending ? "Đang liên kết..." : "Liên kết"}
                  </Button>
                </div>

                {/* ── Quick-create context ── */}
                <div
                  className="mt-2 rounded-xl border overflow-hidden"
                  style={{
                    borderColor: showQuickCreate ? "var(--accent-blue)" : "var(--card-light-border)",
                    background: showQuickCreate ? "rgba(59,130,246,0.03)" : "transparent",
                  }}
                >
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold transition-colors hover:bg-black/[0.03]"
                    style={{ color: "var(--accent-blue)" }}
                    onClick={() => setShowQuickCreate(!showQuickCreate)}
                  >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Tạo nhanh bối cảnh mới
                    <CaretDownIcon
                      className={`h-3 w-3 ml-auto transition-transform ${showQuickCreate ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showQuickCreate && (
                    <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: "var(--card-light-border)" }}>
                      <div className="pt-4 grid grid-cols-2 gap-3">
                        <div className="col-span-2 grid gap-1">
                          <Label className="text-[11px]">Tên bối cảnh *</Label>
                          <Input
                            value={quickCtx.name}
                            onChange={(e) => setQuickCtx((s) => ({ ...s, name: e.target.value }))}
                            placeholder="VD: Chiến thắng Bạch Đằng"
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-[11px]">Thời kỳ *</Label>
                          <Select
                            value={quickCtx.era}
                            onValueChange={(v) => setQuickCtx((s) => ({ ...s, era: v as EventEraBackend }))}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Chọn thời kỳ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ANCIENT">Cổ đại</SelectItem>
                              <SelectItem value="MEDIEVAL">Trung đại</SelectItem>
                              <SelectItem value="MODERN">Cận đại</SelectItem>
                              <SelectItem value="CONTEMPORARY">Hiện đại</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-[11px]">Năm *</Label>
                          <Input
                            type="number"
                            value={quickCtx.year}
                            onChange={(e) => setQuickCtx((s) => ({ ...s, year: e.target.value }))}
                            placeholder="VD: 938"
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-[11px]">Mô tả</Label>
                          <Input
                            value={quickCtx.description}
                            onChange={(e) => setQuickCtx((s) => ({ ...s, description: e.target.value }))}
                            placeholder="Mô tả ngắn..."
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                      <Button
                        className="w-full h-9 text-xs font-semibold"
                        disabled={
                          !quickCtx.name.trim() ||
                          !quickCtx.era ||
                          !quickCtx.year ||
                          createEvent.isPending
                        }
                        style={{ background: "var(--accent-blue)", color: "#fff" }}
                        onClick={() => {
                          createEvent.mutate(
                            {
                              name: quickCtx.name.trim(),
                              description: quickCtx.description.trim() || quickCtx.name.trim(),
                              era: quickCtx.era as EventEraBackend,
                              year: Number(quickCtx.year),
                            },
                            {
                              onSuccess: (newCtx) => {
                                setSelectedContextId(newCtx.id);
                                setShowQuickCreate(false);
                                setQuickCtx({ name: "", description: "", era: "", year: "" });
                                toast.success("Tạo bối cảnh thành công");
                              },
                            },
                          );
                        }}
                      >
                        <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
                        {createEvent.isPending ? "Đang tạo..." : "Khởi tạo bối cảnh"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Chat Preview ── */}
        <div className="flex-1 flex flex-col min-w-0 relative bg-[var(--bg-app)]">
          {isCreated && mappedContextId ? (
            <ChatMain
              character={chatCharacter}
              sessionId={sessionId}
              contextId={mappedContextId}
              onSessionCreated={setSessionId}
            />
          ) : (
            <div className="flex-1 flex flex-col relative items-center justify-center p-12">
              <div className="w-full max-w-2xl aspect-[4/3] relative rounded-3xl overflow-hidden shadow-2xl border border-[var(--card-light-border)]">
                {/* Blurred mock-up */}
                <div className="absolute inset-0 bg-white" style={{ filter: "blur(40px)", opacity: 0.6 }} />
                <div className="absolute inset-0 flex flex-col p-8 space-y-6 opacity-20 bg-gray-50">
                  <div className="h-12 w-48 bg-gray-300 rounded-full" />
                  <div className="h-24 w-2/3 bg-gray-200 rounded-2xl" />
                  <div className="h-24 w-1/2 ml-auto bg-blue-200 rounded-2xl" />
                  <div className="h-24 w-3/4 bg-gray-200 rounded-2xl" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4 px-6">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl border border-[var(--card-light-border)]">
                      <ChatCircleDotsIcon className="h-10 w-10" style={{ color: "var(--accent-blue)" }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold" style={{ color: "var(--content-heading)" }}>
                        Hệ thống đối thoại chưa khởi tạo
                      </h3>
                      <p className="text-sm mt-1 max-w-sm mx-auto" style={{ color: "var(--content-muted)" }}>
                        {!isCreated
                          ? "Hãy hoàn tất thông tin và 'Tạo nhân vật' để bắt đầu trải nghiệm AI."
                          : "Bạn cần liên kết nhân vật với một 'Bối cảnh lịch sử' ở khung bên trái để AI có thể hiểu được bối cảnh trò chuyện."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isCreated && (
            <div
              className="absolute top-6 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                background: draft.isPublished ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)",
                color: draft.isPublished ? "rgb(22,163,74)" : "rgb(161,98,7)",
                border: `1px solid ${draft.isPublished ? "rgba(34,197,94,0.2)" : "rgba(234,179,8,0.2)"}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                backdropFilter: "blur(8px)",
              }}
            >
              <EyeIcon className="h-4 w-4" />
              {draft.isPublished ? "ĐÃ XUẤT BẢN" : "CHƯA XUẤT BẢN"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

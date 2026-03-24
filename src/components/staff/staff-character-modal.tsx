"use client";

import * as React from "react";
import {
  XIcon,
  PencilIcon,
  FloppyDiskIcon,
  ChatCircleDotsIcon,
  EyeIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChatMain } from "@/components/chat/chat-main";
import { useChatSessions, useCreateSession } from "@/features/chat/hooks";
import type { ChatCharacter } from "@/services/chat.service";
import type { HistoricalEvent } from "@/services/event.service";

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
  side: string;
  contextId: string;
  isDraft: boolean;
};

export const EMPTY_CHARACTER_DRAFT: CharacterDraft = {
  name: "",
  title: "",
  background: "",
  image: "",
  personality: "",
  lifespan: "",
  side: "",
  contextId: "",
  isDraft: true,
};

interface StaffCharacterModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  draft: CharacterDraft;
  setDraft: React.Dispatch<React.SetStateAction<CharacterDraft>>;
  onSave: () => void;
  isPending: boolean;
  eventOptions: HistoricalEvent[];
  isLoadingEvents: boolean;
  /** After a character is created/exists, this is the created character id */
  createdCharacterId?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StaffCharacterModal({
  open,
  onClose,
  mode,
  draft,
  setDraft,
  onSave,
  isPending,
  eventOptions,
  isLoadingEvents,
  createdCharacterId,
}: StaffCharacterModalProps) {
  /* helper to set a single field */
  const set =
    (field: keyof CharacterDraft) => (val: string | boolean) =>
      setDraft((s) => ({ ...s, [field]: val }));

  /* ── Chat state ── */
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(mode === "create");

  // Reset editing state when modal opens / mode changes
  React.useEffect(() => {
    if (open) {
      setIsEditing(mode === "create");
      setSessionId(null);
    }
  }, [open, mode]);

  // Auto-exit editing mode after save completes successfully
  const prevPendingRef = React.useRef(false);
  React.useEffect(() => {
    if (prevPendingRef.current && !isPending) {
      // isPending went true → false (save finished)
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
    draft.contextId,
    characterId,
    isCreated && !!draft.contextId && open
  );

  const createSession = useCreateSession();
  const sessionInitialized = React.useRef(false);

  React.useEffect(() => {
    if (!open) {
      sessionInitialized.current = false;
      return;
    }
    if (!isCreated || !draft.contextId) return;
    if (!isSessionsSuccess) return;
    if (sessionInitialized.current) return;
    if (sessionId) return;

    sessionInitialized.current = true;

    if (sessions && sessions.length > 0) {
      setSessionId(sessions[0].id);
    } else {
      createSession.mutateAsync({
        contextId: draft.contextId,
        characterId
      }).then((session) => {
        setSessionId(session.id);
      }).catch(console.error);
    }
  }, [open, isCreated, draft.contextId, characterId, isSessionsSuccess, sessions, sessionId, createSession]);

  /* Build a ChatCharacter object from the draft for the right panel */
  const chatCharacter: ChatCharacter = {
    id: characterId,
    name: draft.name || "Nhân vật mới",
    title: draft.title || "Chức vị",
    description: draft.background || undefined,
    imageUrl: draft.image || "",
    side: draft.side || undefined,
    contextId: draft.contextId || undefined,
  };

  /* Determine if form can be submitted */
  const canSave = draft.name.trim() && draft.title.trim() && !isPending;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="relative w-[96vw] h-[94vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--bg-content)",
          border: "1px solid var(--card-light-border)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          color: "var(--content-heading)",
        }}
      >
        {/* ═══════ Header ═══════ */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "var(--card-light-border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg overflow-hidden relative shrink-0"
              style={{ background: "var(--card-light-border)" }}
            >
              {draft.image && (
                <Image
                  src={draft.image}
                  alt={draft.name || "avatar"}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <h2
                className="text-base font-bold"
                style={{ color: "var(--content-heading)" }}
              >
                {mode === "create" && !isCreated
                  ? "Tạo nhân vật mới"
                  : draft.name || "Nhân vật"}
              </h2>
              <p
                className="text-xs"
                style={{ color: "var(--content-muted)" }}
              >
                {mode === "create" && !isCreated
                  ? "Điền thông tin bên trái, xem preview chat bên phải"
                  : draft.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit toggle button — only when character exists */}
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
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-black/10"
              style={{ color: "var(--content-muted)" }}
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ═══════ Body — two columns ═══════ */}
        <div className="flex-1 flex min-h-0">
          {/* ── Left Panel: Form ── */}
          <div
            className="w-[440px] shrink-0 border-r overflow-y-auto"
            style={{ borderColor: "var(--card-light-border)" }}
          >
            <div className="px-6 py-5 space-y-4">
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--content-heading)" }}
              >
                Thông tin nhân vật
              </p>

              {/* Name + Title */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Tên nhân vật *</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => set("name")(e.target.value)}
                    placeholder="VD: Ngô Quyền"
                    disabled={!isEditing}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Chức vị *</Label>
                  <Input
                    value={draft.title}
                    onChange={(e) => set("title")(e.target.value)}
                    placeholder="VD: Tiết độ sứ"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Side + Lifespan */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Phe / Quốc gia</Label>
                  <Input
                    value={draft.side}
                    onChange={(e) => set("side")(e.target.value)}
                    placeholder="VD: Đại Việt"
                    disabled={!isEditing}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Năm sống</Label>
                  <Input
                    value={draft.lifespan}
                    onChange={(e) => set("lifespan")(e.target.value)}
                    placeholder="VD: 898–944"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {/* Context selector */}
              <div className="grid gap-1.5">
                <Label>Bối cảnh lịch sử</Label>
                <Select
                  value={draft.contextId}
                  onValueChange={set("contextId")}
                  disabled={isLoadingEvents || !isEditing}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingEvents
                          ? "Đang tải..."
                          : "Chọn bối cảnh liên quan"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {eventOptions.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.title} —{" "}
                        {ev.year < 0 ? `${Math.abs(ev.year)} TCN` : ev.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image URL */}
              <div className="grid gap-1.5">
                <Label>URL hình ảnh</Label>
                <Input
                  value={draft.image}
                  onChange={(e) => set("image")(e.target.value)}
                  placeholder="https://..."
                  disabled={!isEditing}
                />
              </div>

              {/* Background */}
              <div className="grid gap-1.5">
                <Label>Tiểu sử / Bối cảnh</Label>
                <Textarea
                  value={draft.background}
                  onChange={(e) => set("background")(e.target.value)}
                  placeholder="Mô tả cuộc đời, vai trò lịch sử..."
                  className="min-h-[90px] resize-none"
                  disabled={!isEditing}
                />
              </div>

              {/* Personality */}
              <div className="grid gap-1.5">
                <Label>Tính cách</Label>
                <Textarea
                  value={draft.personality}
                  onChange={(e) => set("personality")(e.target.value)}
                  placeholder="Đặc điểm tính cách, phong cách nói chuyện..."
                  className="min-h-[70px] resize-none"
                  disabled={!isEditing}
                />
              </div>

              {/* isDraft checkbox */}
              <div
                className="flex items-center gap-3 py-2 px-3 rounded-xl border"
                style={{
                  borderColor: "var(--card-light-border)",
                  background: "rgba(27,38,50,0.03)",
                }}
              >
                <Checkbox
                  checked={draft.isDraft}
                  onCheckedChange={(val) => set("isDraft")(!!val)}
                  disabled={!isEditing}
                  id="isDraft"
                />
                <div>
                  <Label htmlFor="isDraft" className="cursor-pointer text-sm font-medium">
                    Lưu dạng bản nháp (Draft)
                  </Label>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--content-muted)" }}
                  >
                    Bản nháp không hiển thị cho học sinh. Bỏ tick để xuất bản.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              {isEditing && (
                <div className="flex gap-2 pt-2">
                  {isCreated && (
                    <Button
                      variant="outline"
                      className="bg-transparent border-[var(--card-light-border)] hover:bg-black/5 text-[var(--content-heading)]"
                      onClick={() => setIsEditing(false)}
                    >
                      Hủy
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      onSave();
                      // After save, if character was created, exit editing mode
                      // The parent will set createdCharacterId, which triggers isCreated
                    }}
                    disabled={!canSave}
                    className="flex-1"
                    style={{
                      background: "var(--accent-blue)",
                      color: "#fff",
                    }}
                  >
                    <FloppyDiskIcon className="h-4 w-4 mr-1.5" />
                    {isPending
                      ? "Đang lưu..."
                      : isCreated
                        ? "Cập nhật"
                        : "Tạo nhân vật"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Panel: Chat Preview ── */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            {isCreated && draft.contextId ? (
              /* Character exists — full interactive chat */
              <ChatMain
                character={chatCharacter}
                sessionId={sessionId}
                contextId={draft.contextId}
                onSessionCreated={setSessionId}
              />
            ) : (
              /* Not yet created — blurred preview placeholder */
              <div className="flex-1 flex flex-col relative">
                {/* Blurred chat mock-up */}
                <div
                  className="absolute inset-0 flex flex-col"
                  style={{ filter: "blur(4px)", pointerEvents: "none" }}
                >
                  {/* Fake header */}
                  <div
                    className="px-6 py-4 border-b flex items-center gap-3 shrink-0"
                    style={{
                      borderColor: "var(--card-light-border)",
                      background: "var(--bg-content)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg overflow-hidden relative"
                      style={{ background: "var(--card-light-border)" }}
                    >
                      {draft.image && (
                        <Image
                          src={draft.image}
                          alt="preview"
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p
                        className="text-sm font-bold"
                        style={{ color: "var(--content-heading)" }}
                      >
                        {draft.name || "Tên nhân vật"}
                      </p>
                      <p
                        className="text-[11px]"
                        style={{ color: "var(--content-muted)" }}
                      >
                        {draft.title || "Chức vị"}
                      </p>
                    </div>
                  </div>

                  {/* Fake messages */}
                  <div className="flex-1 px-6 py-8 space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex ${i % 2 === 0 ? "" : "justify-end"}`}
                      >
                        <div
                          className="rounded-2xl px-4 py-3"
                          style={{
                            background:
                              i % 2 === 0
                                ? "var(--card-light-border)"
                                : "var(--accent-blue)",
                            width: `${50 + i * 10}%`,
                            maxWidth: "70%",
                            height: 40 + i * 8,
                            opacity: 0.5,
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Fake input */}
                  <div
                    className="px-4 py-3 border-t"
                    style={{ borderColor: "var(--card-light-border)" }}
                  >
                    <div
                      className="h-10 rounded-xl"
                      style={{
                        background: "rgba(27,38,50,0.05)",
                        border: "1px solid var(--card-light-border)",
                      }}
                    />
                  </div>
                </div>

                {/* Overlay message */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div
                    className="text-center px-8 py-6 rounded-2xl border backdrop-blur-sm"
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      borderColor: "var(--card-light-border)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                    }}
                  >
                    <ChatCircleDotsIcon
                      className="h-10 w-10 mx-auto mb-3"
                      style={{ color: "var(--accent-blue)", opacity: 0.6 }}
                    />
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ color: "var(--content-heading)" }}
                    >
                      Chat chưa sẵn sàng
                    </p>
                    <p
                      className="text-xs max-w-[240px]"
                      style={{ color: "var(--content-muted)" }}
                    >
                      {!draft.contextId
                        ? "Vui lòng chọn bối cảnh lịch sử và nhấn \"Tạo nhân vật\" để bắt đầu trò chuyện."
                        : "Vui lòng nhấn \"Tạo nhân vật\" để bắt đầu trò chuyện."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status badge */}
            {isCreated && (
              <div
                className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: draft.isDraft
                    ? "rgba(234,179,8,0.12)"
                    : "rgba(34,197,94,0.12)",
                  color: draft.isDraft
                    ? "rgb(161,98,7)"
                    : "rgb(22,163,74)",
                  border: `1px solid ${draft.isDraft ? "rgba(234,179,8,0.3)" : "rgba(34,197,94,0.3)"}`,
                }}
              >
                <EyeIcon className="h-3.5 w-3.5" />
                {draft.isDraft ? "Bản nháp" : "Đã xuất bản"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

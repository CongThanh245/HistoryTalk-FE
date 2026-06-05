"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ChatCharacter } from "@/services/chat.service";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/shared/query-key";
import { ChatLeftPanel } from "./chat-left-panel";
import { ChatMain } from "./chat-main";
import { ChatRightPanel } from "./chat-right-panel";
import { useCreateSession, useChatSessions } from "@/features/chat/hooks";

interface ChatClientProps {
  initialCharacterId: string;
  initialContextId?: string;
  initialSessionId?: string;
}

export function ChatClient({
  initialCharacterId,
  initialContextId,
  initialSessionId,
}: ChatClientProps) {
  const [activeCharacterId, setActiveCharacterId] =
    useState(initialCharacterId);
  const [activeContextId, setActiveContextId] = useState(initialContextId ?? "");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessionId ?? null,
  );
  const sessionInitialized = useRef(false); // ← tránh gọi nhiều lần

  const { data: activeCharacter, isLoading: isLoadingCharacter } = useQuery({
    queryKey: queryKeys.chat.character(activeCharacterId),
    queryFn: () => chatService.getCharacter(activeCharacterId),
    staleTime: 1000 * 60 * 10,
  });

  const contextId =
    activeContextId ||
    (activeCharacter?.contexts?.length === 1
      ? activeCharacter.contexts[0].contextId
      : activeCharacter?.contextId || "");

  const characterId = activeCharacter?.id ?? "";

  // Fetch sessions — chỉ khi đã có character
  const {
    data: sessions,
    isLoading: isLoadingSessions,
    isSuccess: isSessionsSuccess, // ← thêm
  } = useChatSessions(
    contextId,
    characterId,
    !!activeCharacter, // ← thêm param enabled
  );

  const createSession = useCreateSession();

  // Reset ref khi character thay đổi (bao gồm lần mount đầu tiên)
  useEffect(() => {
    sessionInitialized.current = false;
  }, [characterId, contextId]);

  // Init session: dùng session gần nhất nếu có, không thì tạo mới
  useEffect(() => {
    if (!contextId || !characterId) return;
    if (!isSessionsSuccess) return; // chờ fetch xong
    if (sessionInitialized.current) return; // đã init rồi
    if (activeSessionId) return; // đã có session rồi

    sessionInitialized.current = true;

    if (sessions && sessions.length > 0) {
      setActiveSessionId(sessions[0].id); // dùng session gần nhất
    } else {
      // Chưa có session nào → tạo mới
      createSession.mutateAsync({ contextId, characterId }).then((session) => {
        setActiveSessionId(session.id);
      });
    }
  }, [contextId, characterId, isSessionsSuccess, sessions, activeSessionId, createSession]);
  // Reset khi đổi nhân vật
  const handleSelectCharacter = useCallback((char: ChatCharacter) => {
    setActiveCharacterId(char.id);
    setActiveContextId(char.contextId ?? "");
    setActiveSessionId(null);
    sessionInitialized.current = false; // ← reset để init lại cho nhân vật mới
  }, []);

  const handleNewSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);
  const handleSessionCreated = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    // invalidate để left panel cập nhật list
  }, []);

  const handleDeleteSession = useCallback((deletedSessionId: string) => {
    if (activeSessionId === deletedSessionId) {
      setActiveSessionId(null);
      sessionInitialized.current = false;
    }
  }, [activeSessionId]);

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  if (isLoadingCharacter || !activeCharacter) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div
          className="w-6 h-6 rounded-full border-2 animate-spin"
          style={{
            borderColor: "var(--accent-gold)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  if (activeCharacter?.contexts && activeCharacter.contexts.length > 1 && !activeContextId) {
    return (
      <div className="flex h-full w-full items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--content-heading)" }}>
            Chọn sự kiện / trận chiến
          </h2>
          <p className="mb-6 text-sm" style={{ color: "var(--content-muted)" }}>
            Nhân vật {activeCharacter.name} có mặt trong nhiều sự kiện lịch sử khác nhau. Vui lòng chọn sự kiện bạn muốn trò chuyện:
          </p>
          <div className="flex flex-col gap-3">
            {activeCharacter.contexts.map(ctx => (
              <button
                key={ctx.contextId}
                className="px-4 py-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--accent-gold)] hover:bg-[var(--surface-sunken)] transition-colors text-left"
                onClick={() => setActiveContextId(ctx.contextId)}
              >
                <span className="font-semibold" style={{ color: "var(--content-heading)" }}>{ctx.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!contextId) {
    return (
      <div className="flex h-full w-full items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <h2 className="text-lg font-bold" style={{ color: "var(--content-heading)" }}>
            Chưa thể bắt đầu chat
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--content-muted)" }}>
            Nhân vật này chưa được liên kết với bối cảnh lịch sử. Vui lòng chọn nhân vật khác hoặc đợi quản trị viên hoàn tất dữ liệu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <ChatLeftPanel
        characterId={characterId}
        contextId={contextId}
        sessions={sessions ?? []}
        isLoadingSessions={isLoadingSessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        isOpen={isLeftPanelOpen}
        setIsOpen={setIsLeftPanelOpen}
      />
      <ChatMain
        character={activeCharacter}
        sessionId={activeSessionId}
        contextId={contextId}
        onSessionCreated={handleSessionCreated}
        toggleLeftPanel={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
        toggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
        isLeftOpen={isLeftPanelOpen}
        isRightOpen={isRightPanelOpen}
      />
      <ChatRightPanel
        activeCharacter={activeCharacter}
        onSelectCharacter={handleSelectCharacter}
        isOpen={isRightPanelOpen}
        setIsOpen={setIsRightPanelOpen}
      />
    </div>
  );
}

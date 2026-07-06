"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ChatCharacter } from "@/services/chat.service";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/shared/query-key";
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
    useState<string | null>(initialCharacterId || null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessionId || null,
  );
  const sessionInitialized = useRef(false); // ← tránh gọi nhiều lần

  const { data: activeCharacter, isLoading: isLoadingCharacter } = useQuery({
    queryKey: queryKeys.chat.character(activeCharacterId ?? ""),
    queryFn: () => chatService.getCharacter(activeCharacterId ?? ""),
    staleTime: 1000 * 60 * 10,
    enabled: !!activeCharacterId,
  });

  const characterId = activeCharacter?.id ?? "";
  const routeContextId =
    activeCharacterId === initialCharacterId ? initialContextId : undefined;
  const contextId =
    routeContextId ??
    activeCharacter?.contextId ??
    activeCharacter?.contexts?.[0]?.contextId ??
    "";

  // Fetch sessions — chỉ khi đã có character
  const {
    data: sessions,
    isLoading: isLoadingSessions,
    isSuccess: isSessionsSuccess, // ← thêm
  } = useChatSessions(
    characterId,
    contextId,
    !!activeCharacter, // ← thêm param enabled
  );

  const createSession = useCreateSession();

  // Reset ref khi character thay đổi (bao gồm lần mount đầu tiên)
  useEffect(() => {
    sessionInitialized.current = false;
  }, [characterId, contextId]);

  // Init session: dùng session gần nhất nếu có, không thì tạo mới
  useEffect(() => {
    if (!characterId) return;
    if (!contextId) return;
    if (!isSessionsSuccess) return; // chờ fetch xong
    if (sessionInitialized.current) return; // đã init rồi
    if (activeSessionId) return; // đã có session rồi

    sessionInitialized.current = true;

    if (sessions && sessions.length > 0) {
      setActiveSessionId(sessions[0].id); // dùng session gần nhất
    } else {
      // Chưa có session nào → tạo mới
      createSession.mutateAsync({ characterId, contextId }).then((session) => {
        setActiveSessionId(session.id);
      });
    }
  }, [characterId, contextId, isSessionsSuccess, sessions, activeSessionId, createSession]);
  // Reset khi đổi nhân vật
  const handleSelectCharacter = useCallback((char: ChatCharacter) => {
    setActiveCharacterId(char.id);
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

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <ChatMain
        character={activeCharacter}
        contextId={contextId}
        sessionId={activeSessionId}
        onSessionCreated={handleSessionCreated}
        toggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
        isRightOpen={isRightPanelOpen}
      />
      <ChatRightPanel
        activeCharacter={activeCharacter}
        onSelectCharacter={handleSelectCharacter}
        isOpen={isRightPanelOpen}
        setIsOpen={setIsRightPanelOpen}
        characterId={characterId}
        contextId={contextId}
        sessions={sessions ?? []}
        isLoadingSessions={isLoadingSessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />
    </div>
  );
}

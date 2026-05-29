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

  const contextId = activeContextId || activeCharacter?.contextId || "";
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

  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Default hide on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsLeftPanelOpen(false);
      setIsRightPanelOpen(false);
    }
  }, []);

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

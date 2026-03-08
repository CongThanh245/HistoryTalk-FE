  "use client";

  import { useCallback, useEffect, useRef, useState } from "react";
  import { useQuery, useQueryClient } from "@tanstack/react-query";
  import type { ChatCharacter } from "@/services/chat.service";
  import { chatService } from "@/services/chat.service";
  import { queryKeys } from "@/shared/query-key";
  import { ChatLeftPanel } from "./chat-left-panel";
  import { ChatMain } from "./chat-main";
  import { ChatRightPanel } from "./chat-right-panel";
  import { useCreateSession, useChatSessions } from "@/features/chat/hooks";

  interface ChatClientProps {
    initialCharacterId: string;
  }

  export function ChatClient({ initialCharacterId }: ChatClientProps) {
    const [activeCharacterId, setActiveCharacterId] =
      useState(initialCharacterId);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const sessionInitialized = useRef(false); // ← tránh gọi nhiều lần

    const { data: activeCharacter, isLoading: isLoadingCharacter } = useQuery({
      queryKey: queryKeys.chat.character(activeCharacterId),
      queryFn: () => chatService.getCharacter(activeCharacterId),
      staleTime: 1000 * 60 * 10,
    });

    const contextId = activeCharacter?.contextId ?? "";
    const characterId = activeCharacter?.id ?? "";

    // Fetch sessions — chỉ khi đã có character
    const { data: sessions, isLoading: isLoadingSessions } = useChatSessions(
      contextId,
      characterId,
      !!activeCharacter, // ← thêm param enabled
    );

    useEffect(() => {
      console.log("contextId/characterId changed:", contextId, characterId);
    }, [contextId, characterId]);

    const createSession = useCreateSession();

    // Init session: dùng session đầu tiên nếu có, không thì tạo mới
    useEffect(() => {
      if (!contextId || !characterId) return;
      if (isLoadingSessions) return; // ← chờ fetch xong
      if (sessionInitialized.current) return;
      if (activeSessionId) return;

      sessionInitialized.current = true;

      if (sessions && sessions.length > 0) {
        setActiveSessionId(sessions[0].id);
      } else {
        // Chỉ tạo mới khi sessions đã fetch xong VÀ thực sự rỗng
        createSession.mutateAsync({ contextId, characterId }).then((session) => {
          setActiveSessionId(session.id);
        });
      }
    }, [contextId, characterId, isLoadingSessions, sessions]);

    // Reset khi đổi nhân vật
    const handleSelectCharacter = useCallback((char: ChatCharacter) => {
      setActiveCharacterId(char.id);
      setActiveSessionId(null);
      sessionInitialized.current = false; // ← reset để init lại cho nhân vật mới
    }, []);

    const handleNewSession = useCallback((sessionId: string) => {
      setActiveSessionId(sessionId);
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
      <div className="flex h-full w-full overflow-hidden">
        <ChatLeftPanel
          characterId={characterId}
          contextId={contextId}
          sessions={sessions ?? []}
          isLoadingSessions={isLoadingSessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={handleNewSession}
        />
        <ChatMain
          character={activeCharacter}
          sessionId={activeSessionId}
          contextId={contextId}
        />
        <ChatRightPanel
          activeCharacter={activeCharacter}
          onSelectCharacter={handleSelectCharacter}
        />
      </div>
    );
  }

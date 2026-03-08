"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ChatCharacter } from "@/services/chat.service";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/shared/query-key";
import { ChatLeftPanel } from "./chat-left-panel";
import { ChatMain } from "./chat-main";
import { ChatRightPanel } from "./chat-right-panel";

interface ChatClientProps {
  initialCharacterId: string;
}

export function ChatClient({ initialCharacterId }: ChatClientProps) {
  const [activeCharacterId, setActiveCharacterId] =
    useState(initialCharacterId);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const { data: activeCharacter, isLoading } = useQuery({
    queryKey: ["chat", "character", activeCharacterId],
    queryFn: () => chatService.getCharacter(activeCharacterId),
    staleTime: 1000 * 60 * 10,
  });

  const handleSelectCharacter = (char: ChatCharacter) => {
    setActiveCharacterId(char.id);
    setActiveSessionId(null);
  };

  const handleNewSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  if (isLoading || !activeCharacter) {
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
        characterId={activeCharacter.id}
        contextId={activeCharacter.contextId ?? ""}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
      />

      <ChatMain
        character={activeCharacter}
        sessionId={activeSessionId}
        contextId={activeCharacter.contextId ?? ""}
      />

      <ChatRightPanel
        activeCharacter={activeCharacter}
        onSelectCharacter={handleSelectCharacter}
      />
    </div>
  );
}

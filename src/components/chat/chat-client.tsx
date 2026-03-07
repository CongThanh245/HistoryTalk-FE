"use client";

import { useState } from "react";
import type { ChatCharacter } from "@/services/chat.service";
import { MOCK_CHARACTERS } from "./chat.mock";
import { ChatLeftPanel } from "./chat-left-panel";
import { ChatMain } from "./chat-main";
import { ChatRightPanel } from "./chat-right-panel";

interface ChatClientProps {
  initialCharacterId: string;
}

export function ChatClient({ initialCharacterId }: ChatClientProps) {
  const [activeCharacter, setActiveCharacter] = useState<ChatCharacter>(
    // TODO: thay bằng data từ server khi có API
    MOCK_CHARACTERS[initialCharacterId] ?? MOCK_CHARACTERS["ngo-quyen"],
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const handleSelectCharacter = (char: ChatCharacter) => {
    setActiveCharacter(char);
    setActiveSessionId(null); // reset session khi đổi nhân vật
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left panel — lịch sử chat */}
      <ChatLeftPanel
        characterId={activeCharacter.id}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={handleNewSession}
      />

      {/* Chat chính */}
      <ChatMain character={activeCharacter} sessionId={activeSessionId} />

      {/* Right panel — info + đổi nhân vật */}
      <ChatRightPanel
        activeCharacter={activeCharacter}
        onSelectCharacter={handleSelectCharacter}
      />
    </div>
  );
}

export const runtime = 'nodejs';

/**
 * src/app/(app)/chat/[id]/page.tsx
 * Server Component — không có "use client"
 *
 * [id] = characterId — vd: /chat/ngo-quyen
 */

import { ChatClient } from "@/components/chat/chat-client";

interface ChatPageProps {
  params: Promise<{ id: string }>;
  /** mode=chat skips the Phỏng vấn / Vấn đáp choice; call=2d|3d opens a call, which is always an interview. */
  searchParams: Promise<{ contextId?: string; sessionId?: string; mode?: string; call?: string }>;
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { id } = await params;
  const { contextId, sessionId, mode, call } = await searchParams;

  return (
    // h-full kế thừa từ layout — không có padding vì chat cần full height
    <div className="flex h-full w-full overflow-hidden">
      <ChatClient
        initialCharacterId={id}
        initialContextId={contextId}
        initialSessionId={sessionId}
        skipModeChoice={mode === "chat" || !!call}
      />
    </div>
  );
}

// TODO: generateMetadata khi có API
// export async function generateMetadata({ params }: ChatPageProps) {
//   const { id } = await params;
//   const character = await chatService.getCharacter(id);
//   return { title: `Chat với ${character.name} | HistoryTalk` };
// }

export const runtime = 'edge';

/**
 * src/app/(app)/chat/[id]/page.tsx
 * Server Component — không có "use client"
 *
 * [id] = characterId — vd: /chat/ngo-quyen
 */

import { ChatClient } from "@/components/chat/chat-client";

interface ChatPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ contextId?: string; sessionId?: string }>;
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { id } = await params;
  const { contextId, sessionId } = await searchParams;

  return (
    // h-full kế thừa từ layout — không có padding vì chat cần full height
    <div className="flex h-full w-full overflow-hidden">
      <ChatClient
        initialCharacterId={id}
        initialContextId={contextId}
        initialSessionId={sessionId}
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

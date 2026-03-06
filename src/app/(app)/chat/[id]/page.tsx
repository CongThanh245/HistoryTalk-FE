/**
 * src/app/(app)/chat/[id]/page.tsx
 * Server Component — không có "use client"
 *
 * [id] = characterId — vd: /chat/ngo-quyen
 */

import { ChatClient } from "@/components/chat/chat-client";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  return (
    // h-full kế thừa từ layout — không có padding vì chat cần full height
    <div className="flex h-full w-full overflow-hidden">
      <ChatClient initialCharacterId={id} />
    </div>
  );
}

// TODO: generateMetadata khi có API
// export async function generateMetadata({ params }: ChatPageProps) {
//   const { id } = await params;
//   const character = await chatService.getCharacter(id);
//   return { title: `Chat với ${character.name} | HistoryTalk` };
// }

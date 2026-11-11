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
  /**
   * The Phỏng vấn / Vấn đáp choice is a popup shown before coming here. mode=exam&questions=N starts a Vấn đáp
   * session; anything else (mode=chat, call=2d|3d, no mode) opens the interview.
   */
  searchParams: Promise<{ contextId?: string; sessionId?: string; mode?: string; questions?: string; call?: string }>;
}

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { id } = await params;
  const { contextId, sessionId, mode, questions } = await searchParams;
  const examQuestions = mode === "exam" && !sessionId ? Number(questions) || undefined : undefined;

  return (
    // h-full kế thừa từ layout — không có padding vì chat cần full height
    <div className="flex h-full w-full overflow-hidden">
      <ChatClient
        initialCharacterId={id}
        initialContextId={contextId}
        initialSessionId={sessionId}
        initialExamQuestions={examQuestions}
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

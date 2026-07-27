"use client";

import * as React from "react";
import { MessageCircle } from "lucide-react";
import { ChatMain } from "@/components/chat/chat-main";
import type { ChatPreviewPanelProps } from "./types";

export function ChatPreviewPanel({
  canStartChat,
  chatCharacter,
  activeChatContextId,
  sessionId,
  setSessionId,
  chatInitializingLabel,
  isCreated,
  hasPublishErrors,
}: ChatPreviewPanelProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 relative bg-[var(--bg-app)]">
      {canStartChat ? (
        <ChatMain
          character={chatCharacter}
          contextId={activeChatContextId}
          sessionId={sessionId}
          onSessionCreated={setSessionId}
          initializingLabel={chatInitializingLabel}
        />
      ) : (
        <div className="flex-1 flex flex-col relative items-center justify-center p-12">
          <div className="w-full max-w-2xl aspect-[4/3] relative rounded-3xl overflow-hidden shadow-2xl border border-[var(--card-light-border)]">
            {/* Blurred mock-up */}
            <div className="absolute inset-0 bg-white blur-[40px] opacity-60" />
            <div className="absolute inset-0 flex flex-col p-8 space-y-6 opacity-20 bg-gray-50">
              <div className="h-12 w-48 bg-gray-300 rounded-full" />
              <div className="h-24 w-2/3 bg-gray-200 rounded-2xl" />
              <div className="h-24 w-1/2 ml-auto bg-blue-200 rounded-2xl" />
              <div className="h-24 w-3/4 bg-gray-200 rounded-2xl" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 px-6">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl border border-[var(--card-light-border)]">
                  <MessageCircle className="h-10 w-10 text-accent-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-content-heading">
                    Hệ thống đối thoại chưa khởi tạo
                  </h3>
                  <p className="text-sm mt-1 max-w-sm mx-auto text-content-muted">
                    {!isCreated
                      ? "Hãy hoàn tất thông tin và 'Tạo nhân vật' để bắt đầu trải nghiệm AI."
                      : hasPublishErrors
                        ? "Nhân vật cần đủ thông tin và URL hình ảnh hợp lệ trước khi chat."
                        : "Bạn cần liên kết nhân vật với một 'Bối cảnh lịch sử' ở khung bên trái để AI có thể hiểu được bối cảnh trò chuyện."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

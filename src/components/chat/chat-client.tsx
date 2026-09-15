"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ChatCharacter } from "@/services/chat.service";
import { chatService } from "@/services/chat.service";
import { queryKeys } from "@/shared/query-key";
import { ChatMain } from "./chat-main";
import { ChatRightPanel } from "./chat-right-panel";
import { DocumentCitationDialog } from "./document-citation-dialog";
import { useCreateSession, useChatSessions } from "@/features/chat/hooks";
import { isTokenExhaustionError } from "@/lib/utils/api-error";

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
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(
    initialCharacterId || null,
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessionId || null,
  );
  const [tokenExhaustedFor, setTokenExhaustedFor] = useState<string | null>(
    null,
  );
  const sessionInitialized = useRef(false);

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
  const tokenExhaustionKey =
    characterId && contextId ? `${characterId}:${contextId}` : "";
  const isTokenExhausted = tokenExhaustedFor === tokenExhaustionKey;

  const {
    data: sessions,
    isLoading: isLoadingSessions,
    isSuccess: isSessionsSuccess,
  } = useChatSessions(characterId, contextId, !!activeCharacter);

  const createSession = useCreateSession();

  useEffect(() => {
    sessionInitialized.current = false;
  }, [characterId, contextId]);

  useEffect(() => {
    if (!characterId) return;
    if (!contextId) return;
    if (!isSessionsSuccess) return;
    if (sessionInitialized.current) return;
    if (activeSessionId) return;
    if (isTokenExhausted) return;

    sessionInitialized.current = true;

    if (sessions && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    } else {
      createSession
        .mutateAsync({ characterId, contextId })
        .then((session) => {
          setActiveSessionId(session.id);
        })
        .catch((error) => {
          if (isTokenExhaustionError(error)) {
            setTokenExhaustedFor(tokenExhaustionKey);
            return;
          }

          sessionInitialized.current = false;
        });
    }
  }, [
    characterId,
    contextId,
    isSessionsSuccess,
    sessions,
    activeSessionId,
    isTokenExhausted,
    tokenExhaustionKey,
    createSession,
  ]);

  const handleSelectCharacter = useCallback((char: ChatCharacter) => {
    setActiveCharacterId(char.id);
    setActiveSessionId(null);
    setTokenExhaustedFor(null);
    sessionInitialized.current = false;
  }, []);

  const handleSessionCreated = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setTokenExhaustedFor(null);
  }, []);

  const handleDeleteSession = useCallback(
    (deletedSessionId: string) => {
      if (activeSessionId === deletedSessionId) {
        setActiveSessionId(null);
        sessionInitialized.current = false;
      }
    },
    [activeSessionId],
  );

  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [citationRequest, setCitationRequest] = useState<{
    quote?: string;
    documentId?: string;
  } | null>(null);

  const handleStartNewSession = useCallback(() => {
    if (!characterId || !contextId) return;
    if (isTokenExhausted) return;

    sessionInitialized.current = true;
    setActiveSessionId(null);
    setIsRightPanelOpen(false);
    createSession
      .mutateAsync({ characterId, contextId })
      .then((session) => {
        setActiveSessionId(session.id);
      })
      .catch((error) => {
        if (isTokenExhaustionError(error)) {
          setTokenExhaustedFor(tokenExhaustionKey);
          return;
        }

        sessionInitialized.current = false;
      });
  }, [characterId, contextId, isTokenExhausted, tokenExhaustionKey, createSession]);

  if (isLoadingCharacter || !activeCharacter) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="w-6 h-6 border-2 rounded-full border-accent-gold border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex w-full h-full overflow-hidden">
      <ChatMain
        character={activeCharacter}
        contextId={contextId}
        sessionId={activeSessionId}
        onSessionCreated={handleSessionCreated}
        toggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
        isRightOpen={isRightPanelOpen}
        onOpenCitation={(quote) => setCitationRequest({ quote })}
        isTokenExhausted={isTokenExhausted}
        onTokenExhausted={() => setTokenExhaustedFor(tokenExhaustionKey)}
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
        onNewSession={handleStartNewSession}
        onDeleteSession={handleDeleteSession}
        onOpenDocument={(documentId) => setCitationRequest({ documentId })}
      />
      {citationRequest && (
        <DocumentCitationDialog
          quote={citationRequest.quote}
          initialDocumentId={citationRequest.documentId}
          characterId={characterId}
          contextId={contextId}
          contextIds={
            activeCharacter?.contexts?.map((c) => c.contextId) ??
            (contextId ? [contextId] : [])
          }
          onClose={() => setCitationRequest(null)}
        />
      )}
    </div>
  );
}

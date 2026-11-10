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
import { ChatModeChooser } from "./chat-mode-chooser";

interface ChatClientProps {
  initialCharacterId: string;
  initialContextId?: string;
  initialSessionId?: string;
  /** Open the interview right away (assignment links, calls) instead of asking Phỏng vấn or Vấn đáp. */
  skipModeChoice?: boolean;
}

export function ChatClient({
  initialCharacterId,
  initialContextId,
  initialSessionId,
  skipModeChoice = false,
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
  /** Phỏng vấn or Vấn đáp has been picked for this character (or a session was opened directly). */
  const [modeChosen, setModeChosen] = useState(!!initialSessionId || skipModeChoice);

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
    if (!modeChosen) return;

    sessionInitialized.current = true;

    // "Phỏng vấn" resumes the latest interview, never an exam session.
    const interview = sessions?.find((s) => s.mode !== "EXAM");
    if (interview) {
      setActiveSessionId(interview.id);
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
    modeChosen,
  ]);

  const handleSelectCharacter = useCallback((char: ChatCharacter) => {
    setActiveCharacterId(char.id);
    setActiveSessionId(null);
    setTokenExhaustedFor(null);
    sessionInitialized.current = false;
    // A new character asks again which mode.
    setModeChosen(false);
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
    setModeChosen(true);
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

  // Creating an exam session asks question 1 straight away, which takes a few seconds.
  const [isStartingExam, setIsStartingExam] = useState(false);
  const handleStartExamSession = useCallback(
    (questionCount: number) => {
      if (!characterId || !contextId) return;
      if (isTokenExhausted) return;

      const previousSessionId = activeSessionId;
      sessionInitialized.current = true;
      setModeChosen(true);
      setActiveSessionId(null);
      setIsRightPanelOpen(false);
      setIsStartingExam(true);
      createSession
        .mutateAsync({ characterId, contextId, exam: { questionCount } })
        .then((session) => setActiveSessionId(session.id))
        .catch((error) => {
          if (isTokenExhaustionError(error)) {
            setTokenExhaustedFor(tokenExhaustionKey);
            return;
          }
          // e.g. the character has too few documents: go back to the conversation the learner was in,
          // or to the mode choice when the exam was picked there.
          setActiveSessionId(previousSessionId);
          if (!previousSessionId) {
            sessionInitialized.current = false;
            setModeChosen(false);
          }
        })
        .finally(() => setIsStartingExam(false));
    },
    [activeSessionId, characterId, contextId, isTokenExhausted, tokenExhaustionKey, createSession],
  );

  if (isLoadingCharacter || !activeCharacter) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="w-6 h-6 border-2 rounded-full border-[var(--text-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex w-full h-full overflow-hidden">
      {!modeChosen && !activeSessionId ? (
        <ChatModeChooser
          character={activeCharacter}
          hasInterview={(sessions ?? []).some((s) => s.mode !== "EXAM")}
          busy={!isSessionsSuccess || createSession.isPending}
          onInterview={() => setModeChosen(true)}
          onExam={handleStartExamSession}
        />
      ) : (
      <ChatMain
        character={activeCharacter}
        contextId={contextId}
        sessionId={activeSessionId}
        onSessionCreated={handleSessionCreated}
        initializingLabel={isStartingExam ? `${activeCharacter.name} đang chuẩn bị câu hỏi vấn đáp...` : undefined}
        toggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
        isRightOpen={isRightPanelOpen}
        onOpenCitation={(quote) => setCitationRequest({ quote })}
        isTokenExhausted={isTokenExhausted}
        onTokenExhausted={() => setTokenExhaustedFor(tokenExhaustionKey)}
      />
      )}
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
        onSelectSession={(id) => {
          setModeChosen(true);
          setActiveSessionId(id);
        }}
        onNewSession={handleStartNewSession}
        onNewExamSession={handleStartExamSession}
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

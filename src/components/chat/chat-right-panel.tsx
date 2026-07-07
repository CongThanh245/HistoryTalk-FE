"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChatTextIcon,
  BankIcon,
  ClockCounterClockwiseIcon,
  UsersThreeIcon,
  ExamIcon,
  CaretRightIcon,
  CaretLeftIcon,
  PlusIcon,
  TimerIcon,
  TrashIcon,
  CircleNotchIcon,
  FileTextIcon,
} from "@phosphor-icons/react";
import type { ChatCharacter, ChatSession } from "@/services/chat.service";
import { characterService } from "@/services/character.service";
import { queryKeys } from "@/shared/query-key";
import { isValidUrl } from "@/lib/utils/url";
import { useQuizSets } from "@/features/quiz/hooks";
import { useEventDetail } from "@/features/events/hooks";
import {
  usePublicCharacterDocuments,
  usePublicContextDocuments,
} from "@/features/documents/hooks";
import { QuizCard } from "@/components/quiz/quiz-card";
import { useCreateSession, useSoftDeleteSession } from "@/features/chat/hooks";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { HistoricalContextHoverCard } from "@/components/commons/historical-context-hover-card";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

import { cn } from "@/lib/utils/cn";

type PanelSection = "menu" | "history" | "characters" | "quiz" | "contexts" | "documents";
type DetailSection = Exclude<PanelSection, "menu">;

interface ChatRightPanelProps {
  activeCharacter: ChatCharacter;
  onSelectCharacter: (character: ChatCharacter) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  characterId: string;
  contextId: string;
  sessions: ChatSession[];
  isLoadingSessions: boolean;
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onOpenDocument?: (documentId: string) => void;
}

const sectionTitles: Record<DetailSection, string> = {
  history: "Lịch sử trò chuyện",
  characters: "Nhân vật khác",
  quiz: "Kiểm tra kiến thức",
  contexts: "Bối cảnh liên quan",
  documents: "Tài liệu tham khảo",
};

function MenuRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-white/5 text-left"
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "var(--accent-gold-active-bg)", color: "var(--accent-gold)" }}
      >
        {icon}
      </div>
      <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
        {label}
      </span>
      {value && (
        <span className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
          {value}
        </span>
      )}
      <CaretRightIcon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-secondary)" }} />
    </button>
  );
}

function SectionHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-3 border-b shrink-0"
      style={{ borderColor: "var(--border-default)" }}
    >
      <button
        onClick={onBack}
        aria-label="Quay lại"
        className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors hover:bg-white/5"
        style={{ color: "var(--text-secondary)" }}
      >
        <CaretLeftIcon className="w-4 h-4" />
      </button>
      <h4 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
        {title}
      </h4>
    </div>
  );
}

function ImageHoverPreview({
  imageUrl,
  alt,
  fit = "cover",
  children,
}: {
  imageUrl: string;
  alt: string;
  fit?: "cover" | "contain";
  children: React.ReactNode;
}) {
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        className="w-56 overflow-hidden p-0"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="relative w-full aspect-3/4">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className={fit === "contain" ? "object-contain" : "object-cover object-top"}
            sizes="224px"
          />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function ContextRow({
  contextId,
  fallbackLabel,
  onOpen,
}: {
  contextId: string;
  fallbackLabel: string;
  onOpen: (contextId: string) => void;
}) {
  const { data: event, isLoading } = useEventDetail(contextId);
  const imageUrl = isValidUrl(event?.imageUrl) ? event!.imageUrl! : null;

  return (
    <HistoricalContextHoverCard contextId={contextId} fallbackLabel={fallbackLabel}>
      <button
        onClick={() => onOpen(contextId)}
        className="w-full flex items-center gap-3 p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
        }}
      >
        <div
          className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0"
          style={{ background: "var(--card-light-hover)" }}
        >
          {isLoading ? (
            <div className="w-full h-full animate-pulse" />
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt={event?.title ?? fallbackLabel}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BankIcon className="w-4 h-4" style={{ color: "var(--accent-gold)" }} />
            </div>
          )}
        </div>
        <span
          className="flex-1 text-xs font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {event?.title ?? fallbackLabel}
        </span>
        <CaretRightIcon
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: "var(--text-secondary)" }}
        />
      </button>
    </HistoricalContextHoverCard>
  );
}

export function ChatRightPanel({
  activeCharacter,
  onSelectCharacter,
  isOpen,
  setIsOpen,
  characterId,
  contextId,
  sessions,
  isLoadingSessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onOpenDocument,
}: ChatRightPanelProps) {
  const [section, setSection] = useState<PanelSection>("menu");
  const [lastDetailSection, setLastDetailSection] = useState<DetailSection>("history");
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  const disableSheetAnimationOnDesktop = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 768;
  }, []);

  // Reset to main menu whenever the active character changes or the mobile sheet reopens.
  // Keep the last visited detail section rendered so the slide-out animation has content to show.
  const [prevCharacterId, setPrevCharacterId] = useState(activeCharacter.id);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (activeCharacter.id !== prevCharacterId) {
    setPrevCharacterId(activeCharacter.id);
    setSection("menu");
  }
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setSection("menu");
  }
  if (section !== "menu" && section !== lastDetailSection) {
    setLastDetailSection(section);
  }

  const { data: characters = [], isLoading: isLoadingCharacters } = useQuery({
    queryKey: queryKeys.characters.byContext(activeCharacter.contextId ?? ""),
    queryFn: () => characterService.getByContext(activeCharacter.contextId!),
    enabled: !!activeCharacter.contextId,
    staleTime: 1000 * 60 * 5,
    select: (data) =>
      data.map(
        (c): ChatCharacter => ({
          id: c.id,
          name: c.name,
          title: c.title,
          description: c.background,
          imageUrl: isValidUrl(c.imageUrl) ? c.imageUrl : "/card.jpg",
          modelUrl: c.modelUrl ?? null,
          side: c.side,
          contextId: c.contextId ?? activeCharacter.contextId,
        }),
      ),
  });

  const otherCharacters = characters.filter((c) => c.id !== activeCharacter.id);
  const contexts = activeCharacter.contexts ?? [];

  const router = useRouter();
  const { data: quizData, isLoading: isLoadingQuiz } = useQuizSets(
    contextId ? { contextId } : undefined,
  );
  const quizzes = quizData?.content ?? [];

  const { data: characterDocuments = [], isLoading: isLoadingCharacterDocuments } =
    usePublicCharacterDocuments(characterId);
  const { data: contextDocuments = [], isLoading: isLoadingContextDocuments } =
    usePublicContextDocuments(contextId);
  const documents = [...characterDocuments, ...contextDocuments];
  const isLoadingDocuments = isLoadingCharacterDocuments || isLoadingContextDocuments;

  const createSession = useCreateSession();
  const softDeleteSession = useSoftDeleteSession();

  const handleNewSession = () => {
    if (!characterId || !contextId) return;
    createSession.mutate(
      { characterId, contextId },
      {
        onSuccess: (created) => {
          onNewSession(created.id);
          setIsOpen(false);
        },
      },
    );
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });

  const renderMenu = () => (
    <>
      {/* Compact hero */}
      <div
        className="shrink-0 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <ImageHoverPreview
            imageUrl={isValidUrl(activeCharacter.imageUrl) ? activeCharacter.imageUrl! : "/card.jpg"}
            alt={activeCharacter.name}
            fit="contain"
          >
            <div
              className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 cursor-pointer"
              style={{ border: "2px solid var(--border-default)" }}
            >
              <Image
                src={isValidUrl(activeCharacter.imageUrl) ? activeCharacter.imageUrl! : "/card.jpg"}
                alt={activeCharacter.name}
                fill
                className="object-cover object-top"
              />
            </div>
          </ImageHoverPreview>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3
                className="text-sm font-bold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {activeCharacter.name}
              </h3>
              {activeCharacter.side && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{
                    background: "rgba(201,162,77,0.2)",
                    color: "var(--accent-gold)",
                    border: "1px solid rgba(201,162,77,0.3)",
                  }}
                >
                  {activeCharacter.side}
                </span>
              )}
            </div>
            <p
              className="text-[11px] mt-0.5 leading-snug"
              style={{ color: "var(--accent-gold-soft)" }}
            >
              {activeCharacter.title}
            </p>
          </div>
        </div>
        {activeCharacter.description && (
          <p
            className="px-4 pb-3 text-[11px] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {activeCharacter.description}
          </p>
        )}
      </div>

      {/* Menu list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <button
          onClick={handleNewSession}
          disabled={createSession.isPending}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors hover:bg-white/5 text-left disabled:opacity-60"
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-gold-active-bg)", color: "var(--accent-gold)" }}
          >
            {createSession.isPending ? (
              <CircleNotchIcon className="w-4 h-4 animate-spin" />
            ) : (
              <PlusIcon className="w-4 h-4" />
            )}
          </div>
          <span className="flex-1 text-sm font-semibold" style={{ color: "var(--accent-gold-soft)" }}>
            Cuộc trò chuyện mới
          </span>
        </button>

        <MenuRow
          icon={<ClockCounterClockwiseIcon className="w-4 h-4" />}
          label="Lịch sử trò chuyện"
          value={`${sessions.length}`}
          onClick={() => setSection("history")}
        />
        <MenuRow
          icon={<UsersThreeIcon className="w-4 h-4" />}
          label="Nhân vật khác"
          value={otherCharacters.length ? `${otherCharacters.length}` : undefined}
          onClick={() => setSection("characters")}
        />
        <MenuRow
          icon={<ExamIcon className="w-4 h-4" />}
          label="Kiểm tra kiến thức"
          value={quizzes.length ? `${quizzes.length}` : undefined}
          onClick={() => setSection("quiz")}
        />
        {contexts.length > 0 && (
          <MenuRow
            icon={<BankIcon className="w-4 h-4" />}
            label="Bối cảnh liên quan"
            value={`${contexts.length}`}
            onClick={() => setSection("contexts")}
          />
        )}
        <MenuRow
          icon={<FileTextIcon className="w-4 h-4" />}
          label="Tài liệu tham khảo"
          value={documents.length ? `${documents.length}` : undefined}
          onClick={() => setSection("documents")}
        />
      </div>
    </>
  );

  const renderHistory = () => (
    <>
      <SectionHeader title={sectionTitles.history} onBack={() => setSection("menu")} />
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {isLoadingSessions ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg animate-pulse"
                style={{ background: "var(--card-light-hover)" }}
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p
            className="text-[11px] text-center py-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Chưa có cuộc trò chuyện nào
          </p>
        ) : (
          <div className="space-y-1.5">
            {sessions.map((session, index) => (
              <div
                key={`session-${session.id ?? index}-${index}`}
                className="group relative w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer border"
                onClick={() => {
                  onSelectSession(session.id);
                  setIsOpen(false);
                }}
                style={{
                  background:
                    activeSessionId === session.id
                      ? "var(--accent-gold-active-bg)"
                      : "transparent",
                  borderColor:
                    activeSessionId === session.id
                      ? "var(--border-strong)"
                      : "transparent",
                }}
              >
                <div className="flex items-start gap-2">
                  <ChatTextIcon
                    className="w-3.5 h-3.5 mt-0.5 shrink-0"
                    style={{
                      color:
                        activeSessionId === session.id
                          ? "var(--accent-gold)"
                          : "var(--text-secondary)",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] font-semibold truncate"
                      style={{
                        color:
                          activeSessionId === session.id
                            ? "var(--accent-gold-soft)"
                            : "var(--text-primary)",
                      }}
                    >
                      {session.title || "Cuộc trò chuyện"}
                    </p>
                    <p
                      className="text-[10px] truncate mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {session.lastMessage}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <TimerIcon
                        className="w-2.5 h-2.5"
                        style={{ color: "var(--text-secondary)" }}
                      />
                      <span
                        className="text-[9px]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatDate(session.lastMessageAt)} · {session.messageCount} tin
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  disabled={softDeleteSession.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (softDeleteSession.isPending) return;
                    setDeleteSessionId(session.id);
                  }}
                  className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer hover:bg-red-50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ color: "var(--content-subtle)" }}
                >
                  {softDeleteSession.isPending && deleteSessionId === session.id ? (
                    <CircleNotchIcon className="w-3.5 h-3.5 animate-spin text-red-500" />
                  ) : (
                    <TrashIcon className="w-3.5 h-3.5 hover:text-red-500 transition-colors" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div
        className="px-3 py-3 border-t shrink-0"
        style={{ borderColor: "var(--border-default)" }}
      >
        <button
          onClick={handleNewSession}
          disabled={createSession.isPending}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150"
          style={{
            background: "var(--accent-gold-active-bg)",
            border: "1px solid var(--border-strong)",
            color: "var(--accent-gold-soft)",
          }}
        >
          <PlusIcon className="w-3.5 h-3.5" />
          {createSession.isPending ? "Đang tạo..." : "Cuộc trò chuyện mới"}
        </button>
      </div>
    </>
  );

  const renderCharacters = () => (
    <>
      <SectionHeader title={sectionTitles.characters} onBack={() => setSection("menu")} />
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isLoadingCharacters ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl animate-pulse"
                style={{ background: "var(--card-light-hover)" }}
              />
            ))}
          </div>
        ) : otherCharacters.length === 0 ? (
          <p
            className="text-[11px] text-center py-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Không có nhân vật nào khác
          </p>
        ) : (
          <div className="space-y-2">
            {otherCharacters.map((char) => (
              <ImageHoverPreview
                key={char.id}
                imageUrl={isValidUrl(char.imageUrl) ? char.imageUrl! : "/card.jpg"}
                alt={char.name}
              >
                <button
                  onClick={() => {
                    onSelectCharacter(char);
                    setIsOpen(false);
                  }}
                  className="group w-full flex items-center gap-3 p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border-default)",
                  }}
                >
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={isValidUrl(char.imageUrl) ? char.imageUrl! : "/card.jpg"}
                      alt={char.name}
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold truncate group-hover:text-[var(--accent-gold)] transition-colors"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {char.name}
                    </p>
                    <p
                      className="text-[10px] truncate mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {char.title}
                    </p>
                    {char.side && (
                      <span
                        className="text-[9px] font-medium"
                        style={{ color: "var(--accent-gold)", opacity: 0.7 }}
                      >
                        {char.side}
                      </span>
                    )}
                  </div>
                  <ChatTextIcon
                    className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--accent-gold)" }}
                  />
                </button>
              </ImageHoverPreview>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderQuiz = () => (
    <>
      <SectionHeader title={sectionTitles.quiz} onBack={() => setSection("menu")} />
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isLoadingQuiz ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl animate-pulse"
                style={{ background: "var(--card-light-hover)" }}
              />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <p
            className="text-[11px] text-center py-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Chưa có bài kiểm tra nào cho bối cảnh này
          </p>
        ) : (
          <div className="space-y-2">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.quizId}
                quiz={quiz}
                onStart={(quizId) => router.push(`/quiz/${quizId}`)}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderContexts = () => (
    <>
      <SectionHeader title={sectionTitles.contexts} onBack={() => setSection("menu")} />
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {contexts.map((ctx) => (
          <ContextRow
            key={ctx.contextId}
            contextId={ctx.contextId}
            fallbackLabel={ctx.name}
            onOpen={(id) => router.push(`/events?event=${id}`)}
          />
        ))}
      </div>
    </>
  );

  const renderDocuments = () => (
    <>
      <SectionHeader title={sectionTitles.documents} onBack={() => setSection("menu")} />
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {isLoadingDocuments ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl animate-pulse"
                style={{ background: "var(--card-light-hover)" }}
              />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <p
            className="text-[11px] text-center py-4"
            style={{ color: "var(--text-secondary)" }}
          >
            Chưa có tài liệu tham khảo nào
          </p>
        ) : (
          documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => doc.id && onOpenDocument?.(doc.id)}
              className="w-full flex items-start gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border-default)",
              }}
            >
              <FileTextIcon
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "var(--accent-gold)" }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {doc.title}
                </p>
                <p
                  className="text-[10px] mt-0.5 line-clamp-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {doc.content}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );

  const renderDetail = () => {
    switch (lastDetailSection) {
      case "history":
        return renderHistory();
      case "characters":
        return renderCharacters();
      case "quiz":
        return renderQuiz();
      case "contexts":
        return renderContexts();
      case "documents":
        return renderDocuments();
    }
  };

  const renderSlidingPanel = () => (
    <div className="relative flex-1 overflow-hidden">
      <div
        className="flex h-full w-[200%] transition-transform duration-300 ease-in-out motion-reduce:transition-none"
        style={{ transform: section === "menu" ? "translateX(0%)" : "translateX(-50%)" }}
      >
        <div className="w-1/2 h-full flex flex-col overflow-hidden">{renderMenu()}</div>
        <div className="w-1/2 h-full flex flex-col overflow-hidden">{renderDetail()}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: Sidebar */}
      <div
        className={cn(
          "hidden md:flex shrink-0 h-full flex-col z-50 border-l overflow-hidden",
          "relative w-[280px]",
        )}
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-default)",
        }}
      >
        {renderSlidingPanel()}
      </div>

      {/* Mobile: Bottom Sheet */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent
            side="bottom"
            disableAnimation={disableSheetAnimationOnDesktop}
            disableOverlayAnimation={disableSheetAnimationOnDesktop}
            className="h-[80vh] p-0 border-t"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border-default)",
            }}
          >
            <SheetTitle className="sr-only">Bảng điều khiển</SheetTitle>
            <div className="flex flex-col h-full">
              {renderSlidingPanel()}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <ConfirmDialog
        open={!!deleteSessionId}
        onOpenChange={(open) => !open && setDeleteSessionId(null)}
        title="Xóa cuộc trò chuyện?"
        description="Cuộc trò chuyện này sẽ bị xóa vĩnh viễn và không thể khôi phục."
        confirmLabel="Xóa"
        variant="danger"
        isPending={softDeleteSession.isPending}
        onConfirm={() => {
          if (deleteSessionId && !softDeleteSession.isPending) {
            const sessionId = deleteSessionId;
            softDeleteSession.mutate(sessionId, {
              onSuccess: () => {
                onDeleteSession?.(sessionId);
                setDeleteSessionId(null);
              },
            });
          }
        }}
      />
    </>
  );
}

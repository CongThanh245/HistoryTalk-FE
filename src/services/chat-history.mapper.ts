import type { ChatHistoryGroup } from "./chat.service";

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

export const normalizeChatHistoryGroups = (value: unknown): ChatHistoryGroup[] => {
  if (!Array.isArray(value)) return [];

  const groupsByContextId = new Map<string, ChatHistoryGroup>();

  value.forEach((rawGroup, groupIndex) => {
    const group = asRecord(rawGroup);
    const sessions = Array.isArray(group.sessions) ? group.sessions : [];
    const contextId = asString(group.contextId) || `unknown-context-${groupIndex}`;

    const normalizedGroup = groupsByContextId.get(contextId) ?? {
      contextId,
      contextName: asString(group.contextName),
      sessions: [],
    };

    if (!normalizedGroup.contextName) {
      normalizedGroup.contextName = asString(group.contextName);
    }

    sessions.forEach((rawSession, sessionIndex) => {
        const session = asRecord(rawSession);
        const id = asString(session.id) || `${contextId}-session-${sessionIndex}`;

        if (normalizedGroup.sessions.some((item) => item.id === id)) return;

        normalizedGroup.sessions.push({
          id,
          characterId: asString(session.characterId),
          characterName: asString(session.characterName),
          characterTitle: asString(session.characterTitle),
          characterImage: asString(session.characterImage),
          contextId: asString(session.contextId),
          contextName: asString(session.contextName),
          sessionTitle: asString(session.sessionTitle),
          lastMessage: asString(session.lastMessage),
          lastMessageAt: asString(session.lastMessageAt),
          messageCount:
            typeof session.messageCount === "number" ? session.messageCount : 0,
        });
      });

    groupsByContextId.set(contextId, normalizedGroup);
  });

  return Array.from(groupsByContextId.values());
};

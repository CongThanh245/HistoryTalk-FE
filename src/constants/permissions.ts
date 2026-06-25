import { Role } from "./roles";

export const PERMISSIONS = {
  // Users
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  // Contexts
  CONTEXTS_READ: "contexts.read",
  CONTEXTS_CREATE: "contexts.create",
  CONTEXTS_UPDATE: "contexts.update",
  CONTEXTS_DELETE: "contexts.delete",

  // Characters
  CHARACTERS_READ: "characters.read",
  CHARACTERS_CREATE: "characters.create",
  CHARACTERS_UPDATE: "characters.update",
  CHARACTERS_DELETE: "characters.delete",

  // Quizzes
  QUIZZES_READ: "quizzes.read",
  QUIZZES_CREATE: "quizzes.create",
  QUIZZES_UPDATE: "quizzes.update",
  QUIZZES_DELETE: "quizzes.delete",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SYSTEM_ADMIN]: Object.values(PERMISSIONS),
  [Role.CONTENT_ADMIN]: [
    PERMISSIONS.CONTEXTS_READ,
    PERMISSIONS.CONTEXTS_CREATE,
    PERMISSIONS.CONTEXTS_UPDATE,
    PERMISSIONS.CONTEXTS_DELETE,
    PERMISSIONS.CHARACTERS_READ,
    PERMISSIONS.CHARACTERS_CREATE,
    PERMISSIONS.CHARACTERS_UPDATE,
    PERMISSIONS.CHARACTERS_DELETE,
    PERMISSIONS.QUIZZES_READ,
    PERMISSIONS.QUIZZES_CREATE,
    PERMISSIONS.QUIZZES_UPDATE,
    PERMISSIONS.QUIZZES_DELETE,
  ],
  [Role.CUSTOMER]: [
    PERMISSIONS.CONTEXTS_READ,
    PERMISSIONS.CHARACTERS_READ,
    PERMISSIONS.QUIZZES_READ,
  ],
};
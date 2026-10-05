/**
 * Gói trường học (SaaS B2B) — data shapes used by the mock UI.
 * Mirrors what the backend (Sprint 5–6: SaaS Roles, Classroom, Global + Custom Map) is expected to return,
 * so the mock store can later be swapped for API services without touching the screens.
 */

export type AccountStatus = "ACTIVE" | "LOCKED" | "INVITED";

/** Token packages for schools (Role Matrix row 20: Enterprise 1, 2, 3). */
export type SchoolPlan = "ENTERPRISE_1" | "ENTERPRISE_2" | "ENTERPRISE_3";

export interface School {
  id: string;
  name: string;
  code: string;
  province: string;
  address?: string;
  plan: SchoolPlan;
  /** Daily token quota per student, reset every day (row 20). */
  dailyTokensPerStudent: number;
  /** Daily token quota per teacher ("trải nghiệm", row 19). */
  dailyTokensPerTeacher: number;
  maxStudents: number;
  status: "ACTIVE" | "SUSPENDED";
  contractEndsAt: string;
  createdAt: string;
}

/** Account created by the System Admin (row 2). */
export interface SchoolAdminAccount {
  id: string;
  schoolId: string;
  fullName: string;
  email: string;
  phone?: string;
  status: AccountStatus;
  createdAt: string;
}

/** Account created by the School Admin (row 3). */
export interface TeacherAccount {
  id: string;
  schoolId: string;
  fullName: string;
  email: string;
  subject: string;
  status: AccountStatus;
  createdAt: string;
}

/** Account created or bulk-imported by the School Admin (row 4). */
export interface StudentAccount {
  id: string;
  schoolId: string;
  fullName: string;
  studentCode: string;
  username: string;
  grade: number;
  dateOfBirth?: string;
  status: AccountStatus;
  /** Tokens used today against the school's daily quota. */
  tokensUsedToday: number;
  createdAt: string;
}

/** A class of one school (rows 6–8). */
export interface Classroom {
  id: string;
  schoolId: string;
  name: string;
  grade: number;
  schoolYear: string;
  homeroomTeacherId: string | null;
  /** Teachers who teach History in this class (may include the homeroom teacher). */
  teacherIds: string[];
  studentIds: string[];
  createdAt: string;
}

/** Custom map: a pin a teacher puts on the class map layer (visible only to that class). */
export interface ClassMapPin {
  id: string;
  classId: string;
  createdBy: string;
  kind: "LOCAL_HISTORY" | "ASSIGNMENT";
  label: string;
  description: string;
  latitude: number;
  longitude: number;
  year?: number;
  /** Assignment pins carry a deadline (Sprint 6: giao bài tập kèm deadline). */
  dueDate?: string;
  createdAt: string;
}

/** Personal study pin of a customer or school student (visible only to its owner). */
export interface PersonalMapPin {
  id: string;
  ownerId: string;
  label: string;
  note: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

/** A row parsed from the student import file before it is committed. */
export interface StudentImportRow {
  line: number;
  fullName: string;
  studentCode: string;
  grade: number;
  dateOfBirth?: string;
  className?: string;
  error?: string;
}

// ── Lịch sử địa phương (Role Matrix IV, rows 12–14) ─────────────────────────

/** Content status flow: teacher drafts and submits, School Admin publishes / deactivates / trashes (row 13). */
export type LocalContentStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "INACTIVE" | "TRASH";

export type LocalContentKind = "CONTEXT" | "CHARACTER" | "QUIZ";

interface LocalContentBase {
  id: string;
  schoolId: string;
  authorId: string;
  /** Classes allowed to see it once published (row 14: "Lớp mình"). */
  classIds: string[];
  status: LocalContentStatus;
  /** School Admin's note when sending back or deactivating. */
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalContext extends LocalContentBase {
  kind: "CONTEXT";
  title: string;
  era: "ANCIENT" | "MEDIEVAL" | "MODERN" | "CONTEMPORARY";
  year: number;
  location: string;
  summary: string;
  body: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface LocalCharacter extends LocalContentBase {
  kind: "CHARACTER";
  name: string;
  title: string;
  bornYear?: number;
  deathYear?: number;
  biography: string;
  /** Personality / speaking style used by the AI when students chat with this character. */
  persona: string;
  contextId?: string;
  imageUrl?: string;
}

export interface LocalQuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface LocalQuiz extends LocalContentBase {
  kind: "QUIZ";
  title: string;
  level: "EASY" | "MEDIUM" | "HARD";
  contextId?: string;
  durationMinutes: number;
  questions: LocalQuizQuestion[];
}

export type LocalContent = LocalContext | LocalCharacter | LocalQuiz;

// ── Bài tập & bài kiểm tra (Role Matrix V, rows 16–17) ─────────────────────

/** EVENT = đọc một sự kiện, CHAT = trò chuyện với nhân vật, TEST = bài kiểm tra lấy điểm. */
export type AssignmentType = "EVENT" | "CHAT" | "TEST";

/** Where the assigned item comes from: shared (global) content or the school's local content. */
export type AssignmentSource = "GLOBAL" | "LOCAL";

export interface Assignment {
  id: string;
  classId: string;
  teacherId: string;
  type: AssignmentType;
  source: AssignmentSource;
  /** Id of the event / character / quiz (global API id or local content id). */
  targetId: string;
  /** Snapshot of the target's title so lists render without fetching it. */
  targetTitle: string;
  title: string;
  instructions: string;
  openAt: string;
  dueAt: string;
  /** CHAT: minimum number of messages the student must send. */
  minMessages?: number;
  /** TEST: max score (scale 10) and whether it counts towards the grade book. */
  maxScore?: number;
  graded?: boolean;
  allowLate: boolean;
  createdAt: string;
}

export type SubmissionStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "LATE" | "MISSING";

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  /** TEST score on the assignment's scale. */
  score?: number;
  /** CHAT: messages sent to the character for this assignment. */
  messageCount?: number;
  /** TEST: chosen option per question (local quizzes). */
  answers?: number[];
  submittedAt?: string;
  teacherComment?: string;
}

// ── Analytics (Role Matrix VIII, rows 23–25) ───────────────────────────────

/** Daily AI-chat activity of one student (Sprint 6: thống kê tần suất / số lượng tin nhắn). */
export interface ChatActivity {
  studentId: string;
  date: string;
  messages: number;
  tokens: number;
}

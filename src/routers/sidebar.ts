import type { ComponentType, CSSProperties } from "react";
import {
  House,
  Landmark,
  MessageCircle,
  ClipboardList,
  BookOpen,
  User,
  Shield,
  Scroll,
  Users,
  Gauge,
  CreditCard,
  Receipt,
  Flame,
  Map,
  School,
  GraduationCap,
  Presentation,
  UsersRound,
  Coins,
  NotebookPen,
  FilePenLine,
  ClipboardCheck,
  ChartColumn,
  BadgeCheck,
  LibraryBig,
  MessagesSquare,
  BookOpenText,
  ListChecks,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";

export interface SidebarMenuItem {
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  label: string;
  href: string;
  /** Nếu true, chỉ active khi pathname khớp chính xác href */
  exact?: boolean;
  /** Trang con nằm ở đường dẫn khác nhưng thuộc mục này (vd. bản đồ Kho tư liệu "/map/class"). */
  activePaths?: string[];
}

/** One entry of the sidebar quick menu: what it makes or starts, in a line the user can scan. */
export interface SidebarQuickItem {
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  label: string;
  description: string;
  href: string;
}

/** The button above the nav ("Tạo" for authors, "Bắt đầu" for learners) and the menu it opens. */
export interface SidebarQuickMenu {
  label: string;
  items: SidebarQuickItem[];
}

export interface SidebarSection {
  title: string;
  /** Section owned by HistoryTalk (the provider): shown with the HistoryTalk mark instead of a label. */
  brand?: boolean;
  /** Section owned by the viewer's school: the title is replaced by the school name once it is known. */
  schoolOwned?: boolean;
  items: SidebarMenuItem[];
}

export const CUSTOMER_SIDEBAR: SidebarSection[] = [
  {
    title: "Menu",
    items: [
      { icon: House, label: "Trang chủ", href: ROUTES.HOME },
      { icon: Landmark, label: "Sự kiện lịch sử", href: ROUTES.EVENTS },
      { icon: User, label: "Nhân vật", href: ROUTES.CHARACTERS },
      { icon: MessageCircle, label: "Lịch sử trò chuyện", href: ROUTES.CHAT_HISTORY },
      { icon: ClipboardList, label: "Câu đố lịch sử", href: ROUTES.QUIZ },
      { icon: Map, label: "Bản đồ lịch sử", href: ROUTES.HISTORICAL_MAP },
      // MVP: Ẩn Bản đồ lịch sử, Library và Đã lưu
      // { icon: Map, label: "Bản đồ lịch sử", href: "/map" },
      // { icon: BookOpen, label: "Library", href: "/library" },
      // { icon: Bookmark, label: "Đã lưu", href: "/saved" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: ChartColumn, label: "Tiến độ học tập", href: ROUTES.GRADES },
      { icon: User, label: "Hồ sơ", href: ROUTES.PROFILE },
    ],
  },
];


/**
 * Catalogs curated by Content Admin. School accounts reach them in a section named after the provider, next to the
 * section named after their school, so the two sources are told apart by where they live, not by a label.
 */
const HISTORYTALK_LIBRARY: SidebarSection = {
  title: "HistoryTalk",
  brand: true,
  items: [
    { icon: Landmark, label: "Sự kiện lịch sử", href: ROUTES.EVENTS },
    { icon: User, label: "Nhân vật", href: ROUTES.CHARACTERS },
    { icon: ClipboardList, label: "Câu đố lịch sử", href: ROUTES.QUIZ },
    { icon: Map, label: "Bản đồ trận đánh", href: ROUTES.HISTORICAL_MAP },
  ],
};

const SCHOOL_ACCOUNT: SidebarSection = {
  title: "Account",
  items: [
    { icon: MessageCircle, label: "Lịch sử trò chuyện", href: ROUTES.CHAT_HISTORY },
    { icon: User, label: "Hồ sơ", href: ROUTES.PROFILE },
  ],
};

/** School student: the class workspace ("Không gian lớp học") first, then the official library (Role Matrix rows 8, 14, 17, 25). */
export const SCHOOL_STUDENT_SIDEBAR: SidebarSection[] = [
  {
    title: "Không gian lớp học",
    schoolOwned: true,
    items: [
      { icon: GraduationCap, label: "Lớp học", href: ROUTES.CLASSES },
      { icon: ClipboardCheck, label: "Bài tập", href: ROUTES.MY_ASSIGNMENTS },
      { icon: LibraryBig, label: "Kho tư liệu", href: ROUTES.CLASS_MATERIALS, activePaths: [ROUTES.CLASS_MAP] },
      { icon: ChartColumn, label: "Bảng điểm", href: ROUTES.GRADES },
    ],
  },
  HISTORYTALK_LIBRARY,
  SCHOOL_ACCOUNT,
];

/** Teacher: the class workspace first, then the official library they also use (rows 7, 8, 12, 16, 19, 21). */
export const TEACHER_SIDEBAR: SidebarSection[] = [
  {
    title: "Không gian lớp học",
    schoolOwned: true,
    items: [
      { icon: Gauge, label: "Tổng quan", href: ROUTES.TEACHING.HOME, exact: true },
      { icon: Presentation, label: "Lớp học", href: ROUTES.CLASSES },
      { icon: NotebookPen, label: "Bài tập", href: ROUTES.TEACHING.ASSIGNMENTS },
      { icon: FilePenLine, label: "Soạn tư liệu", href: ROUTES.TEACHING.LOCAL, activePaths: [ROUTES.CLASS_MAP] },
      { icon: Coins, label: "Yêu cầu token", href: ROUTES.TEACHING.TOKEN_REQUESTS },
    ],
  },
  HISTORYTALK_LIBRARY,
  SCHOOL_ACCOUNT,
];

/** School Admin: accounts, classes and the school's token quota (rows 3, 4, 6, 7, 20, 21). */
export const SCHOOL_ADMIN_SIDEBAR: SidebarSection[] = [
  {
    title: "Trường học",
    items: [
      { icon: Gauge, label: "Tổng quan", href: ROUTES.SCHOOL.HOME, exact: true },
      { icon: School, label: "Lớp học", href: ROUTES.SCHOOL.CLASSES },
      { icon: BadgeCheck, label: "Giám sát nội dung", href: ROUTES.SCHOOL.CONTENT },
    ],
  },
  {
    title: "Tài khoản",
    items: [
      { icon: Presentation, label: "Giáo viên", href: ROUTES.SCHOOL.TEACHERS },
      { icon: UsersRound, label: "Học sinh", href: ROUTES.SCHOOL.STUDENTS },
    ],
  },
  {
    title: "Cấu hình",
    items: [
      { icon: Coins, label: "Hạn mức token", href: ROUTES.SCHOOL.TOKENS },
    ],
  },
];

export const STAFF_SIDEBAR: SidebarSection[] = [
  {
    title: "Content Admin",
    items: [
      { icon: Shield, label: "Tổng quan", href: ROUTES.STAFF.HOME, exact: true },
      { icon: Scroll, label: "Bối cảnh", href: ROUTES.STAFF.CONTEXTS },
      { icon: Map, label: "Bản đồ lịch sử", href: ROUTES.STAFF.MAP },
      { icon: User, label: "Nhân vật", href: ROUTES.STAFF.CHARACTERS },
      { icon: BookOpen, label: "Tài liệu", href: ROUTES.STAFF.DOCUMENTS },
      { icon: ClipboardList, label: "Bộ đề", href: ROUTES.STAFF.QUIZZES },
      { icon: Flame, label: "Nhiệm vụ hằng ngày", href: ROUTES.STAFF.QUESTS },
    ],
  },
  // MVP: Ẩn mục Hồ sơ trong sidebar Content Admin
  // {
  //   title: "Account",
  //   items: [{ icon: User, label: "Hồ sơ", href: ROUTES.PROFILE }],
  // },
];

export const SYSTEM_ADMIN_SIDEBAR: SidebarSection[] = [
  {
    title: "Dashboard",
    items: [
      { icon: Gauge, label: "Tổng quan", href: ROUTES.STAFF.ADMIN.HOME, exact: true },
    ],
  },
  {
    title: "Tài khoản",
    items: [
      { icon: Users, label: "Customer", href: ROUTES.STAFF.ADMIN.ACCOUNTS.CUSTOMER },
      { icon: User, label: "Content Admin", href: ROUTES.STAFF.ADMIN.ACCOUNTS.CONTENT_ADMIN },
    ],
  },
  {
    title: "Gói trường học",
    items: [
      { icon: School, label: "Trường & School Admin", href: ROUTES.STAFF.ADMIN.SCHOOLS },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { icon: CreditCard, label: "Gói dịch vụ", href: ROUTES.STAFF.ADMIN.SUBSCRIPTIONS },
      { icon: Receipt, label: "Lịch sử giao dịch", href: ROUTES.STAFF.ADMIN.PAYMENT_HISTORY },
    ],
  },
  // MVP: Ẩn mục Hồ sơ trong sidebar System Admin
  // {
  //   title: "Account",
  //   items: [{ icon: User, label: "Hồ sơ", href: ROUTES.PROFILE }],
  // },
];

/* ───────────────────────── Quick menus ───────────────────────── */

export const CUSTOMER_QUICK_MENU: SidebarQuickMenu = {
  label: "Bắt đầu",
  items: [
    { icon: MessagesSquare, label: "Trò chuyện với nhân vật", description: "Hỏi trực tiếp nhân vật lịch sử bạn quan tâm", href: ROUTES.CHARACTERS },
    { icon: Landmark, label: "Khám phá sự kiện", description: "Đọc bối cảnh các sự kiện theo từng thời kỳ", href: ROUTES.EVENTS },
    { icon: ClipboardList, label: "Làm câu đố", description: "Ôn lại kiến thức bằng bộ câu hỏi ngắn", href: ROUTES.QUIZ },
    { icon: Map, label: "Mở bản đồ trận đánh", description: "Xem diễn biến trận đánh trên bản đồ", href: ROUTES.HISTORICAL_MAP },
  ],
};

export const SCHOOL_STUDENT_QUICK_MENU: SidebarQuickMenu = {
  label: "Bắt đầu",
  items: [
    { icon: ClipboardCheck, label: "Làm bài tập", description: "Bài giáo viên giao cho lớp của bạn, kèm hạn nộp", href: ROUTES.MY_ASSIGNMENTS },
    { icon: MessagesSquare, label: "Trò chuyện với nhân vật", description: "Hỏi trực tiếp nhân vật lịch sử bạn quan tâm", href: ROUTES.CHARACTERS },
    { icon: LibraryBig, label: "Mở kho tư liệu", description: "Tư liệu của lớp và của trường", href: ROUTES.CLASS_MATERIALS },
    { icon: ClipboardList, label: "Làm câu đố", description: "Ôn lại kiến thức bằng bộ câu hỏi ngắn", href: ROUTES.QUIZ },
  ],
};

export const TEACHER_QUICK_MENU: SidebarQuickMenu = {
  label: "Tạo",
  items: [
    { icon: NotebookPen, label: "Bài tập", description: "Đọc bối cảnh, trò chuyện với nhân vật hoặc kiểm tra, kèm hạn nộp", href: ROUTES.TEACHING.ASSIGNMENT_NEW },
    { icon: BookOpenText, label: "Bối cảnh lịch sử", description: "Tư liệu riêng của bạn để giao cho lớp", href: ROUTES.TEACHING.LOCAL_NEW("CONTEXT") },
    { icon: User, label: "Nhân vật lịch sử", description: "Nhân vật của riêng bạn, trả lời dựa trên tư liệu bạn soạn", href: ROUTES.TEACHING.LOCAL_NEW("CHARACTER") },
    { icon: ListChecks, label: "Bộ đề", description: "Câu hỏi soạn trước để giao làm bài kiểm tra", href: ROUTES.TEACHING.LOCAL_QUIZ_NEW() },
  ],
};

export const STAFF_QUICK_MENU: SidebarQuickMenu = {
  label: "Tạo",
  items: [
    { icon: Scroll, label: "Bối cảnh", description: "Sự kiện lịch sử mới trong thư viện HistoryTalk", href: `${ROUTES.STAFF.CONTEXTS}/create` },
    { icon: User, label: "Nhân vật", description: "Nhân vật trò chuyện, gắn với bối cảnh và tài liệu", href: `${ROUTES.STAFF.CHARACTERS}/create` },
    { icon: ClipboardList, label: "Bộ đề", description: "Câu đố cho người học ôn tập", href: `${ROUTES.STAFF.QUIZZES}?create=1` },
  ],
};

export const SYSTEM_ADMIN_QUICK_MENU: SidebarQuickMenu = {
  label: "Tạo",
  items: [
    { icon: School, label: "Trường học", description: "Trường mới, gói dịch vụ và tài khoản School Admin", href: ROUTES.STAFF.ADMIN.SCHOOL_NEW },
  ],
};

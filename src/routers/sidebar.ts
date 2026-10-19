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
} from "lucide-react";

import { ROUTES } from "@/constants/routes";

export interface SidebarMenuItem {
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  label: string;
  href: string;
  /** Nếu true, chỉ active khi pathname khớp chính xác href */
  exact?: boolean;
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

/** Bản đồ lớp: only class & school content; official battles live in the HistoryTalk library (Role Matrix row 21). */
const CLASS_MAP_HREF = ROUTES.CLASS_MAP;

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
      { icon: LibraryBig, label: "Tư liệu lớp & trường", href: ROUTES.CLASS_MATERIALS },
      { icon: Map, label: "Bản đồ lớp", href: CLASS_MAP_HREF },
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
      { icon: FilePenLine, label: "Tư liệu lớp & trường", href: ROUTES.TEACHING.LOCAL },
      { icon: Map, label: "Bản đồ lớp", href: CLASS_MAP_HREF },
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
      { icon: BadgeCheck, label: "Giám sát nội dung giáo viên", href: ROUTES.SCHOOL.CONTENT },
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
      { icon: ClipboardList, label: "Câu đố lịch sử", href: ROUTES.STAFF.QUIZZES },
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

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

/** School student: the learning app plus the classes they belong to (Role Matrix row 8). */
export const SCHOOL_STUDENT_SIDEBAR: SidebarSection[] = [
  CUSTOMER_SIDEBAR[0],
  {
    title: "Lớp học",
    items: [
      { icon: GraduationCap, label: "Lớp của tôi", href: ROUTES.CLASSES },
      { icon: ClipboardCheck, label: "Bài tập được giao", href: ROUTES.MY_ASSIGNMENTS },
      { icon: ChartColumn, label: "Bảng điểm", href: ROUTES.GRADES },
    ],
  },
  { title: "Account", items: [{ icon: User, label: "Hồ sơ", href: ROUTES.PROFILE }] },
];

/** Teacher: classes first, then the learning content they also use (rows 7, 8, 19, 21). */
export const TEACHER_SIDEBAR: SidebarSection[] = [
  {
    title: "Giảng dạy",
    items: [
      { icon: Gauge, label: "Tổng quan", href: ROUTES.TEACHING.HOME, exact: true },
      { icon: Presentation, label: "Lớp của tôi", href: ROUTES.CLASSES },
      { icon: NotebookPen, label: "Bài tập", href: ROUTES.TEACHING.ASSIGNMENTS },
      { icon: FilePenLine, label: "Lịch sử địa phương", href: ROUTES.TEACHING.LOCAL },
      { icon: Map, label: "Bản đồ lớp", href: ROUTES.HISTORICAL_MAP },
    ],
  },
  {
    title: "Nội dung",
    items: [
      { icon: Landmark, label: "Sự kiện lịch sử", href: ROUTES.EVENTS },
      { icon: User, label: "Nhân vật", href: ROUTES.CHARACTERS },
      { icon: MessageCircle, label: "Lịch sử trò chuyện", href: ROUTES.CHAT_HISTORY },
      { icon: ClipboardList, label: "Câu đố lịch sử", href: ROUTES.QUIZ },
    ],
  },
  { title: "Account", items: [{ icon: User, label: "Hồ sơ", href: ROUTES.PROFILE }] },
];

/** School Admin: accounts, classes and the school's token quota (rows 3, 4, 6, 7, 20, 21). */
export const SCHOOL_ADMIN_SIDEBAR: SidebarSection[] = [
  {
    title: "Trường học",
    items: [
      { icon: Gauge, label: "Tổng quan", href: ROUTES.SCHOOL.HOME, exact: true },
      { icon: School, label: "Lớp học", href: ROUTES.SCHOOL.CLASSES },
      { icon: BadgeCheck, label: "Duyệt nội dung địa phương", href: ROUTES.SCHOOL.CONTENT },
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
      { icon: Map, label: "Bản đồ lịch sử", href: ROUTES.SCHOOL.MAP },
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
      { icon: Map, label: "Bản đồ lịch sử", href: ROUTES.STAFF.ADMIN.MAP },
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

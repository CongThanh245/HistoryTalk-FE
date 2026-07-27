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
      // MVP: Ẩn Bản đồ lịch sử, Library và Đã lưu
      // { icon: Map, label: "Bản đồ lịch sử", href: "/map" },
      // { icon: BookOpen, label: "Library", href: "/library" },
      // { icon: Bookmark, label: "Đã lưu", href: "/saved" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: User, label: "Hồ sơ", href: ROUTES.PROFILE },
    ],
  },
];

export const STAFF_SIDEBAR: SidebarSection[] = [
  {
    title: "Content Admin",
    items: [
      { icon: Shield, label: "Tổng quan", href: ROUTES.STAFF.HOME, exact: true },
      { icon: Scroll, label: "Bối cảnh", href: ROUTES.STAFF.CONTEXTS },
      { icon: User, label: "Nhân vật", href: ROUTES.STAFF.CHARACTERS },
      { icon: BookOpen, label: "Tài liệu", href: ROUTES.STAFF.DOCUMENTS },
      { icon: ClipboardList, label: "Câu đố lịch sử", href: ROUTES.STAFF.QUIZZES },
    ],
  },
  {
    title: "Account",
    items: [{ icon: User, label: "Hồ sơ", href: ROUTES.PROFILE }],
  },
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
      { icon: Shield, label: "System Admin", href: ROUTES.STAFF.ADMIN.ACCOUNTS.SYSTEM_ADMIN },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { icon: CreditCard, label: "Gói dịch vụ", href: ROUTES.STAFF.ADMIN.SUBSCRIPTIONS },
      { icon: Receipt, label: "Lịch sử giao dịch", href: ROUTES.STAFF.ADMIN.PAYMENT_HISTORY },
    ],
  },
  {
    title: "Account",
    items: [{ icon: User, label: "Hồ sơ", href: ROUTES.PROFILE }],
  },
];
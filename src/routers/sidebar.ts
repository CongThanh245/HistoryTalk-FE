import type { ComponentType, CSSProperties } from "react";
import {
  HouseIcon,
  BankIcon,
  ChatTextIcon,
  ClipboardTextIcon,
  BooksIcon,
  BookmarkIcon,
  UserIcon,
  ShieldIcon,
  ScrollIcon,
  MapTrifoldIcon,
  UsersIcon,
  GaugeIcon,
  CreditCardIcon,
  ReceiptIcon,
} from "@phosphor-icons/react";

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
      { icon: HouseIcon, label: "Trang chủ", href: ROUTES.HOME },
      { icon: BankIcon, label: "Sự kiện lịch sử", href: ROUTES.EVENTS },
      { icon: UserIcon, label: "Nhân vật", href: ROUTES.CHARACTERS },
      { icon: ChatTextIcon, label: "Trò chuyện", href: ROUTES.CHAT_HISTORY },
      { icon: ClipboardTextIcon, label: "Câu đố lịch sử", href: ROUTES.QUIZ },
      // MVP: Ẩn Bản đồ lịch sử, Library và Đã lưu
      // { icon: MapTrifoldIcon, label: "Bản đồ lịch sử", href: "/map" },
      // { icon: BooksIcon, label: "Library", href: "/library" },
      // { icon: BookmarkIcon, label: "Đã lưu", href: "/saved" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: UserIcon, label: "Hồ sơ", href: ROUTES.PROFILE },
    ],
  },
];

export const STAFF_SIDEBAR: SidebarSection[] = [
  {
    title: "Content Admin",
    items: [
      { icon: ShieldIcon, label: "Tổng quan", href: ROUTES.STAFF.HOME, exact: true },
      { icon: ScrollIcon, label: "Bối cảnh", href: ROUTES.STAFF.CONTEXTS },
      { icon: UserIcon, label: "Nhân vật", href: ROUTES.STAFF.CHARACTERS },
      { icon: BooksIcon, label: "Tài liệu", href: ROUTES.STAFF.DOCUMENTS },
      { icon: ClipboardTextIcon, label: "Câu đố lịch sử", href: ROUTES.STAFF.QUIZZES },
    ],
  },
  {
    title: "Account",
    items: [{ icon: UserIcon, label: "Hồ sơ", href: ROUTES.PROFILE }],
  },
];

export const SYSTEM_ADMIN_SIDEBAR: SidebarSection[] = [
  {
    title: "Dashboard",
    items: [
      { icon: GaugeIcon, label: "Tổng quan", href: ROUTES.STAFF.ADMIN.HOME, exact: true },
    ],
  },
  {
    title: "Tài khoản",
    items: [
      { icon: UsersIcon, label: "Khách hàng", href: ROUTES.STAFF.ADMIN.ACCOUNTS.CUSTOMER },
      { icon: UserIcon, label: "Content Admin", href: ROUTES.STAFF.ADMIN.ACCOUNTS.CONTENT_ADMIN },
      { icon: ShieldIcon, label: "System Admin", href: ROUTES.STAFF.ADMIN.ACCOUNTS.SYSTEM_ADMIN },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { icon: CreditCardIcon, label: "Gói dịch vụ", href: ROUTES.STAFF.ADMIN.SUBSCRIPTIONS },
      { icon: ReceiptIcon, label: "Lịch sử giao dịch", href: ROUTES.STAFF.ADMIN.PAYMENT_HISTORY },
    ],
  },
  {
    title: "Account",
    items: [{ icon: UserIcon, label: "Hồ sơ", href: ROUTES.PROFILE }],
  },
];
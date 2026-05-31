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
      { icon: HouseIcon, label: "Trang chủ", href: "/home" },
      { icon: BankIcon, label: "Sự kiện lịch sử", href: "/events" },
      { icon: UserIcon, label: "Nhân vật", href: "/characters" },
      { icon: ChatTextIcon, label: "Lịch sử chat", href: "/chat-history" },
      { icon: ClipboardTextIcon, label: "Trắc nghiệm", href: "/quiz" },
      { icon: MapTrifoldIcon, label: "Bản đồ lịch sử", href: "/map" },
      { icon: BooksIcon, label: "Library", href: "/library" },
      { icon: BookmarkIcon, label: "Đã lưu", href: "/saved" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: UserIcon, label: "Hồ sơ", href: "/profile" },
    ],
  },
];

export const STAFF_SIDEBAR: SidebarSection[] = [
  {
    title: "Content Admin",
    items: [
      { icon: ShieldIcon, label: "Tổng quan", href: "/staff", exact: true },
      { icon: ScrollIcon, label: "Bối cảnh", href: "/staff/contexts" },
      { icon: UserIcon, label: "Nhân vật", href: "/staff/characters" },
      { icon: BooksIcon, label: "Tài liệu", href: "/staff/documents" },
      { icon: ClipboardTextIcon, label: "Trắc nghiệm", href: "/staff/quizzes" },
    ],
  },
  {
    title: "Account",
    items: [{ icon: UserIcon, label: "Hồ sơ", href: "/profile" }],
  },
];

export const SYSTEM_ADMIN_SIDEBAR: SidebarSection[] = [
  {
    title: "Dashboard",
    items: [
      { icon: GaugeIcon, label: "Tổng quan", href: "/staff/admin", exact: true },
    ],
  },
  {
    title: "Tài khoản",
    items: [
      { icon: UsersIcon, label: "Khách hàng", href: "/staff/admin/accounts/customer" },
      { icon: UserIcon, label: "Content Admin", href: "/staff/admin/accounts/content-admin" },
      { icon: ShieldIcon, label: "System Admin", href: "/staff/admin/accounts/system-admin" },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { icon: CreditCardIcon, label: "Gói dịch vụ", href: "/staff/admin/subscriptions" },
      { icon: ReceiptIcon, label: "Lịch sử giao dịch", href: "/staff/admin/payment/history" },
    ],
  },
  {
    title: "Account",
    items: [{ icon: UserIcon, label: "Hồ sơ", href: "/profile" }],
  },
];
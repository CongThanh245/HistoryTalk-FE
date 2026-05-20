import type { ComponentType } from "react";
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
} from "@phosphor-icons/react";

export interface SidebarMenuItem {
  icon: ComponentType<any>;
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
      { icon: MapTrifoldIcon, label: "Bản đồ lịch sử", href: "/map" }, // ← thêm
      { icon: BooksIcon, label: "Library", href: "/library" },
      { icon: BookmarkIcon, label: "Đã lưu", href: "/saved" },
    ],
  },
  {
    title: "Account",
    items: [{ icon: UserIcon, label: "Hồ sơ", href: "/profile" }],
  },
];

export const STAFF_SIDEBAR: SidebarSection[] = [
  {
    title: "Staff",
    items: [
      { icon: ShieldIcon, label: "Tổng quan", href: "/staff", exact: true },
      { icon: ScrollIcon, label: "Bối cảnh", href: "/staff/contexts" },
      { icon: UserIcon, label: "Nhân vật", href: "/staff/characters" },
      { icon: ClipboardTextIcon, label: "Trắc nghiệm", href: "/staff/quizzes" },
    ],
  },
  {
    title: "Account",
    items: [{ icon: UserIcon, label: "Hồ sơ", href: "/profile" }],
  },
];

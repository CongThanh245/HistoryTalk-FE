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
} from "@phosphor-icons/react";

export interface SidebarMenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
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
      { icon: ShieldIcon, label: "Tổng quan", href: "/staff" },
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

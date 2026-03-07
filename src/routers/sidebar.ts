import {
  Home,
  Landmark,
  Users,
  MessageSquare,
  ClipboardList,
  Library,
  Bookmark,
  User,
  Shield,
  ScrollText,
} from "lucide-react";

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
      { icon: Home, label: "Trang chủ", href: "/home" },
      { icon: Landmark, label: "Sự kiện lịch sử", href: "/events" },
      { icon: Users, label: "Nhân vật", href: "/characters" },
      { icon: MessageSquare, label: "Lịch sử chat", href: "/chat-history" },
      { icon: ClipboardList, label: "Trắc nghiệm", href: "/quiz" },
      { icon: Library, label: "Library", href: "/library" },
      { icon: Bookmark, label: "Đã lưu", href: "/saved" },
    ],
  },
  {
    title: "Account",
    items: [{ icon: User, label: "Hồ sơ", href: "/profile" }],
  },
];

export const STAFF_SIDEBAR: SidebarSection[] = [
  {
    title: "Staff",
    items: [
      { icon: Shield, label: "Tổng quan", href: "/staff" },
      { icon: ScrollText, label: "Bối cảnh", href: "/staff/contexts" },
      { icon: Users, label: "Nhân vật", href: "/staff/characters" },
      { icon: ClipboardList, label: "Trắc nghiệm", href: "/staff/quizzes" },
    ],
  },
  {
    title: "Account",
    items: [{ icon: User, label: "Hồ sơ", href: "/profile" }],
  },
];

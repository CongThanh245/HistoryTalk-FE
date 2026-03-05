import {
  Home,
  Landmark,
  Users,
  MessageSquare,
  ClipboardList,
  Library,
  Bookmark,
  TrendingUp,
  User,
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

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: "Main",
    items: [
      { icon: Home, label: "Trang chủ", href: "/home" },
      { icon: Landmark, label: "Sự kiện lịch sử", href: "/events" },
      { icon: Users, label: "Nhân vật", href: "/characters" },
      { icon: MessageSquare, label: "Lịch sử chat", href: "/chat" },
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

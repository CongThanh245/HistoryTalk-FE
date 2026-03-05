import {
  ScrollText,
  Users,
  ClipboardList,
  TrendingUp,
  User,
  Shield,
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
    title: "Staff",
    items: [
      { icon: Shield,      label: "Tổng quan",   href: "/staff" },
      { icon: ScrollText,  label: "Bối cảnh",    href: "/staff/contexts" },
      { icon: Users,       label: "Nhân vật",    href: "/staff/characters" },
      { icon: ClipboardList, label: "Trắc nghiệm", href: "/staff/quizzes" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: TrendingUp, label: "Tiến độ", href: "/progress" },
      { icon: User,       label: "Hồ sơ",   href: "/profile" },
    ],
  },
];
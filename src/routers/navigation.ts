import { Role } from "@/constants/roles";

export interface NavItem {
  id: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  badge?: string | number;
  allowedRoles: Role[];
  requiredPermissions?: string[];
  children?: NavItem[];
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  allowedRoles: Role[];
}

export const commonNavItems: NavItem[] = [];
export const customerNavItems: NavItem[] = [];
export const mainNavSections: NavSection[] = [];

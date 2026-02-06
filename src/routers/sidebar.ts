import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  FileText,
  Settings,
  FolderTree,
  Star,
  Shield,
  Flag,
  Server,
  Key,
  FileSearch,
  Store,
  PackageSearch,
  TrendingUp,
} from 'lucide-react';
import { Role } from '@/constants/roles';
import { ROUTES } from './index';

export interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles: Role[];
  badge?: string | number; // Optional badge (e.g., count)
  permission?: string; // Optional permission check
  children?: NavItem[]; // Submenu
}

export interface NavSection {
  title: string;
  items: NavItem[];
  roles: Role[]; // Section chỉ hiện với roles này
}
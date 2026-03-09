import {
  SquaresFourIcon,
  UserIcon,
  PackageIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  FileTextIcon,
  GearIcon,
  TreeStructureIcon,
  StarIcon,
  ShieldIcon,
  FlagIcon,
  DatabaseIcon,
  KeyIcon,
  FileMagnifyingGlassIcon,
  StorefrontIcon,
  MagnifyingGlassIcon,
  TrendUpIcon,
  HouseIcon,
  BellIcon,
  HeartIcon,
} from '@phosphor-icons/react';
import { Role } from '@/constants/roles';
import { ROUTES } from './index';

export interface NavItem {
  id: string; // Unique ID
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  badge?: string | number;
  allowedRoles: Role[]; // Roles được phép truy cập
  requiredPermissions?: string[]; // Permissions bắt buộc (optional)
  children?: NavItem[];
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  allowedRoles: Role[]; // Section chỉ hiện với roles này
}

/**
 * NAVIGATION CONFIG
 * Mỗi item CHỈ định nghĩa 1 lần
 * Roles được define trong allowedRoles array
 */

// ===== Common Navigation (All UserIcon) =====
export const commonNavItems: NavItem[] = [
  {
    id: 'profile',
    href: ROUTES.PROFILE,
    icon: UserIcon,
    label: 'Tài khoản',
    allowedRoles: [Role.ADMIN, Role.MODERATOR, Role.SELLER, Role.CUSTOMER],
  },
  {
    id: 'notifications',
    href: ROUTES.NOTIFICATIONS,
    icon: BellIcon,
    label: 'Thông báo',
    allowedRoles: [Role.ADMIN, Role.MODERATOR, Role.SELLER, Role.CUSTOMER],
    badge: 5,
  },
  {
    id: 'settings',
    href: ROUTES.SETTINGS,
    icon: GearIcon,
    label: 'Cài đặt',
    allowedRoles: [Role.ADMIN, Role.MODERATOR, Role.SELLER, Role.CUSTOMER],
  },
];

// ===== Customer Navigation =====
export const customerNavItems: NavItem[] = [
  {
    id: 'home',
    href: ROUTES.HOME,
    icon: HouseIcon,
    label: 'Trang chủ',
    allowedRoles: [Role.CUSTOMER],
  },
  {
    id: 'products',
    href: ROUTES.PRODUCTS,
    icon: PackageIcon,
    label: 'Sản phẩm',
    allowedRoles: [Role.CUSTOMER],
  },
  {
    id: 'orders',
    href: ROUTES.ORDERS,
    icon: ShoppingCartIcon,
    label: 'Đơn hàng của tôi',
    allowedRoles: [Role.CUSTOMER],
  },
  {
    id: 'wishlist',
    href: ROUTES.WISHLIST,
    icon: HeartIcon,
    label: 'Yêu thích',
    allowedRoles: [Role.CUSTOMER],
  },
];

// ===== Main Navigation (Dashboard) =====
export const mainNavSections: NavSection[] = [
  // ----- OVERVIEW SECTION -----
  {
    id: 'overview',
    title: 'Tổng quan',
    allowedRoles: [Role.ADMIN, Role.MODERATOR, Role.SELLER],
    items: [
      {
        id: 'dashboard',
        href: ROUTES.DASHBOARD,
        icon: SquaresFourIcon,
        label: 'Dashboard',
        description: 'Tổng quan hệ thống',
        allowedRoles: [Role.ADMIN, Role.MODERATOR, Role.SELLER],
      },
      {
        id: 'analytics',
        href: ROUTES.ANALYTICS,
        icon: ChartBarIcon,
        label: 'Phân tích',
        description: 'Thống kê và báo cáo',
        allowedRoles: [Role.ADMIN, Role.SELLER], // Seller chỉ thấy data của mình
      },
      {
        id: 'reports',
        href: ROUTES.REPORTS,
        icon: FileTextIcon,
        label: 'Báo cáo',
        allowedRoles: [Role.ADMIN],
      },
    ],
  },

  // ----- MANAGEMENT SECTION -----
  {
    id: 'management',
    title: 'Quản lý',
    allowedRoles: [Role.ADMIN, Role.MODERATOR, Role.SELLER],
    items: [
      {
        id: 'users',
        href: ROUTES.USERS,
        icon: UserIcon,
        label: 'Người dùng',
        description: 'Quản lý người dùng',
        allowedRoles: [Role.ADMIN, Role.MODERATOR],
        requiredPermissions: ['users.read'],
      },
      {
        id: 'products',
        href: ROUTES.PRODUCTS_MANAGE,
        icon: PackageIcon,
        label: 'Sản phẩm',
        description: 'Quản lý sản phẩm',
        allowedRoles: [Role.ADMIN, Role.MODERATOR, Role.SELLER],
        requiredPermissions: ['products.read'],
        children: [
          {
            id: 'products-list',
            href: ROUTES.PRODUCTS_MANAGE,
            icon: PackageIcon,
            label: 'Danh sách',
            allowedRoles: [Role.ADMIN, Role.MODERATOR, Role.SELLER],
          },
          {
            id: 'products-create',
            href: ROUTES.PRODUCT_CREATE,
            icon: PackageIcon,
            label: 'Thêm mới',
            allowedRoles: [Role.ADMIN, Role.SELLER],
          },
          {
            id: 'categories',
            href: ROUTES.CATEGORIES,
            icon: TreeStructureIcon,
            label: 'Danh mục',
            allowedRoles: [Role.ADMIN],
          },
        ],
      },
      {
        id: 'orders',
        href: ROUTES.ORDERS_MANAGE,
        icon: ShoppingCartIcon,
        label: 'Đơn hàng',
        description: 'Quản lý đơn hàng',
        allowedRoles: [Role.ADMIN, Role.MODERATOR, Role.SELLER],
        requiredPermissions: ['orders.read'],
        badge: 12,
      },
      {
        id: 'inventory',
        href: ROUTES.INVENTORY,
        icon: MagnifyingGlassIcon,
        label: 'Kho hàng',
        description: 'Quản lý tồn kho',
        allowedRoles: [Role.ADMIN, Role.SELLER],
      },
      {
        id: 'reviews',
        href: ROUTES.REVIEWS,
        icon: StarIcon,
        label: 'Đánh giá',
        allowedRoles: [Role.ADMIN, Role.MODERATOR, Role.SELLER],
      },
    ],
  },

  // ----- SELLER SPECIFIC -----
  {
    id: 'my-store',
    title: 'Cửa hàng của tôi',
    allowedRoles: [Role.SELLER],
    items: [
      {
        id: 'my-store-overview',
        href: ROUTES.MY_STORE,
        icon: StorefrontIcon,
        label: 'Tổng quan cửa hàng',
        allowedRoles: [Role.SELLER],
      },
      {
        id: 'my-products',
        href: ROUTES.MY_PRODUCTS,
        icon: PackageIcon,
        label: 'Sản phẩm của tôi',
        allowedRoles: [Role.SELLER],
      },
      {
        id: 'my-orders',
        href: ROUTES.MY_ORDERS,
        icon: ShoppingCartIcon,
        label: 'Đơn hàng của tôi',
        allowedRoles: [Role.SELLER],
        badge: 8,
      },
    ],
  },

  // ----- MODERATION SECTION -----
  {
    id: 'moderation',
    title: 'Kiểm duyệt',
    allowedRoles: [Role.MODERATOR, Role.ADMIN],
    items: [
      {
        id: 'content-moderation',
        href: ROUTES.CONTENT_MODERATION,
        icon: ShieldIcon,
        label: 'Kiểm duyệt nội dung',
        allowedRoles: [Role.MODERATOR, Role.ADMIN],
      },
      {
        id: 'user-reports',
        href: ROUTES.USER_REPORTS,
        icon: FlagIcon,
        label: 'Báo cáo vi phạm',
        allowedRoles: [Role.MODERATOR, Role.ADMIN],
        badge: 5,
      },
    ],
  },

  // ----- SYSTEM SECTION (Admin only) -----
  {
    id: 'system',
    title: 'Hệ thống',
    allowedRoles: [Role.ADMIN],
    items: [
      {
        id: 'system-config',
        href: ROUTES.SYSTEM,
        icon: DatabaseIcon,
        label: 'Cấu hình',
        allowedRoles: [Role.ADMIN],
      },
      {
        id: 'roles-permissions',
        href: ROUTES.ROLES_PERMISSIONS,
        icon: KeyIcon,
        label: 'Phân quyền',
        allowedRoles: [Role.ADMIN],
      },
      {
        id: 'system-logs',
        href: ROUTES.LOGS,
        icon: FileMagnifyingGlassIcon,
        label: 'Nhật ký',
        allowedRoles: [Role.ADMIN],
      },
    ],
  },
];

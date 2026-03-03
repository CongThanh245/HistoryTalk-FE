import { NavSection, NavItem, customerNavItems, commonNavItems, mainNavSections } from './navigation';
import { Role } from '@/constants/roles';

/**
 * Filter navigation theo role và permissions
 */
export function filterNavigation(
  sections: NavSection[],
  userRole: Role,
  userPermissions: string[] = []
): NavSection[] {
  return sections
    // Filter sections
    .filter((section) => section.allowedRoles.includes(userRole))
    .map((section) => ({
      ...section,
      items: filterNavItems(section.items, userRole, userPermissions),
    }))
    // Remove empty sections
    .filter((section) => section.items.length > 0);
}

/**
 * Filter nav items recursively
 */
function filterNavItems(
  items: NavItem[],
  userRole: Role,
  userPermissions: string[]
): NavItem[] {
  return items
    .filter((item) => {
      // Check role
      if (!item.allowedRoles.includes(userRole)) {
        return false;
      }

      // Check permissions (nếu có)
      if (item.requiredPermissions && item.requiredPermissions.length > 0) {
        const hasPermission = item.requiredPermissions.every((permission) =>
          userPermissions.includes(permission)
        );
        if (!hasPermission) {
          return false;
        }
      }

      return true;
    })
    .map((item) => ({
      ...item,
      // Filter children recursively
      children: item.children
        ? filterNavItems(item.children, userRole, userPermissions)
        : undefined,
    }));
}

/**
 * Get navigation by role
 * Helper function để lấy navigation phù hợp
 */
export function getNavigationByRole(role: Role): NavSection[] {
  switch (role) {
    case Role.CUSTOMER:
      return [
        {
          id: 'main',
          title: 'Menu',
          allowedRoles: [Role.CUSTOMER],
          items: [...customerNavItems, ...commonNavItems],
        },
      ];

    case Role.ADMIN:
    case Role.MODERATOR:
    case Role.SELLER:
      return mainNavSections;

    default:
      return [];
  }
}

/**
 * Check xem user có quyền truy cập route không
 */
export function canAccessRoute(
  route: string,
  userRole: Role,
  userPermissions: string[] = []
): boolean {
  const allSections = getNavigationByRole(userRole);
  const filteredSections = filterNavigation(allSections, userRole, userPermissions);

  const checkItems = (items: NavItem[]): boolean => {
    for (const item of items) {
      if (item.href === route) {
        return true;
      }
      if (item.children && checkItems(item.children)) {
        return true;
      }
    }
    return false;
  };

  for (const section of filteredSections) {
    if (checkItems(section.items)) {
      return true;
    }
  }

  return false;
}

/**
 * Find nav item by route
 */
export function findNavItem(
  route: string,
  sections: NavSection[]
): NavItem | null {
  const findInItems = (items: NavItem[]): NavItem | null => {
    for (const item of items) {
      if (item.href === route) {
        return item;
      }
      if (item.children) {
        const found = findInItems(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  for (const section of sections) {
    const found = findInItems(section.items);
    if (found) return found;
  }

  return null;
}
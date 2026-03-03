
export const ROUTES = {
  // ===== Auth =====
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // ===== Public =====
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (id: string) => `/products/${id}`,
  ABOUT: '/about',
  CONTACT: '/contact',

  // ===== User Common (All authenticated users) =====
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',

  // ===== Shopping (Customer + Seller can view) =====
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
  ORDER_DETAIL: (id: string) => `/orders/${id}`,
  WISHLIST: '/wishlist',
  REVIEWS: '/reviews',

  // ===== Dashboard (Admin + Moderator + Seller) =====
  DASHBOARD: '/dashboard',
  
  // Users Management (Admin + Moderator)
  USERS: '/dashboard/users',
  USER_DETAIL: (id: string) => `/dashboard/users/${id}`,
  
  // Products Management (Admin + Moderator + Seller)
  PRODUCTS_MANAGE: '/dashboard/products',
  PRODUCT_CREATE: '/dashboard/products/create',
  PRODUCT_EDIT: (id: string) => `/dashboard/products/${id}/edit`,
  
  // Categories (Admin only)
  CATEGORIES: '/dashboard/categories',
  
  // Orders Management (Admin + Moderator + Seller)
  ORDERS_MANAGE: '/dashboard/orders',
  ORDER_MANAGE_DETAIL: (id: string) => `/dashboard/orders/${id}`,
  
  // Inventory (Admin + Seller)
  INVENTORY: '/dashboard/inventory',
  
  // Analytics (Admin + Seller)
  ANALYTICS: '/dashboard/analytics',
  REPORTS: '/dashboard/reports',
  
  // Content Moderation (Admin + Moderator)
  CONTENT_MODERATION: '/dashboard/moderation',
  USER_REPORTS: '/dashboard/reports/users',
  
  // System (Admin only)
  SYSTEM: '/dashboard/system',
  ROLES_PERMISSIONS: '/dashboard/system/roles',
  LOGS: '/dashboard/system/logs',
  
  // Store Management (Seller only)
  MY_STORE: '/dashboard/my-store',
  MY_PRODUCTS: '/dashboard/my-products',
  MY_ORDERS: '/dashboard/my-orders',
} as const;
// src/features/admin/mock-data.ts

export interface MockUser {
  uid: string;
  tier_id: string;
  user_name: string;
  email: string;
  role: "CUSTOMER" | "CONTENT_ADMIN" | "SYSTEM_ADMIN";
  token: number;
  is_active: boolean;
  created_date: string;
  updated_date: string;
  deleted_date: string | null;
  last_active_date: string;
}

export interface MockTier {
  tier_id: string;
  title: string;
  amount: number;
  limited_token: number;
  is_active: boolean;
}

export interface MockOrder {
  order_id: string;
  uid: string;
  user_name: string;
  tier_title: string;
  order_code: string;
  amount: number;
  status: "PAID" | "PENDING" | "FAILED";
  paid_at: string | null;
  created_date: string;
}

const DEFAULT_TIERS: MockTier[] = [
  { tier_id: "tier_free", title: "Free", amount: 0, limited_token: 50, is_active: true },
  { tier_id: "tier_plus", title: "Plus", amount: 99000, limited_token: 500, is_active: true },
  { tier_id: "tier_pro", title: "Pro", amount: 199000, limited_token: 2000, is_active: true },
];

const DEFAULT_USERS: MockUser[] = [
  // Customers
  {
    uid: "usr_1",
    tier_id: "tier_pro",
    user_name: "Nguyễn Văn Anh",
    email: "vananh.nguyen@gmail.com",
    role: "CUSTOMER",
    token: 1850,
    is_active: true,
    created_date: "2026-04-10T08:30:00Z",
    updated_date: "2026-05-20T10:00:00Z",
    deleted_date: null,
    last_active_date: "2026-05-22T15:45:00Z",
  },
  {
    uid: "usr_2",
    tier_id: "tier_plus",
    user_name: "Trần Thị Bình",
    email: "thibinh.tran@yahoo.com",
    role: "CUSTOMER",
    token: 320,
    is_active: true,
    created_date: "2026-04-15T09:15:00Z",
    updated_date: "2026-05-18T14:20:00Z",
    deleted_date: null,
    last_active_date: "2026-05-22T08:12:00Z",
  },
  {
    uid: "usr_3",
    tier_id: "tier_free",
    user_name: "Lê Hoàng Châu",
    email: "hoangchau.le@outlook.com",
    role: "CUSTOMER",
    token: 12,
    is_active: true,
    created_date: "2026-05-01T14:00:00Z",
    updated_date: "2026-05-01T14:00:00Z",
    deleted_date: null,
    last_active_date: "2026-05-21T21:30:00Z",
  },
  {
    uid: "usr_4",
    tier_id: "tier_pro",
    user_name: "Phạm Đông Dương",
    email: "dongduong.pham@gmail.com",
    role: "CUSTOMER",
    token: 1980,
    is_active: false, // Suspended user
    created_date: "2026-03-20T11:22:00Z",
    updated_date: "2026-05-10T16:05:00Z",
    deleted_date: null,
    last_active_date: "2026-05-10T16:00:00Z",
  },
  {
    uid: "usr_5",
    tier_id: "tier_free",
    user_name: "Vũ Hải Đăng",
    email: "haidang.vu@gmail.com",
    role: "CUSTOMER",
    token: 0,
    is_active: true,
    created_date: "2026-05-05T07:45:00Z",
    updated_date: "2026-05-05T07:45:00Z",
    deleted_date: "2026-05-20T11:00:00Z", // Soft deleted user
    last_active_date: "2026-05-19T18:25:00Z",
  },
  {
    uid: "usr_6",
    tier_id: "tier_plus",
    user_name: "Ngô Mỹ Dung",
    email: "mydung.ngo@hotmail.com",
    role: "CUSTOMER",
    token: 480,
    is_active: true,
    created_date: "2026-05-12T10:10:00Z",
    updated_date: "2026-05-12T10:10:00Z",
    deleted_date: null,
    last_active_date: "2026-05-22T23:10:00Z",
  },

  // Content Admins
  {
    uid: "ca_1",
    tier_id: "tier_free",
    user_name: "Lê Content Specialist",
    email: "content.editor@historytalk.vn",
    role: "CONTENT_ADMIN",
    token: 0,
    is_active: true,
    created_date: "2026-01-15T09:00:00Z",
    updated_date: "2026-05-01T09:00:00Z",
    deleted_date: null,
    last_active_date: "2026-05-22T17:30:00Z",
  },
  {
    uid: "ca_2",
    tier_id: "tier_free",
    user_name: "Nguyễn Biên Tập Viên",
    email: "bientap@historytalk.vn",
    role: "CONTENT_ADMIN",
    token: 0,
    is_active: true,
    created_date: "2026-02-10T10:30:00Z",
    updated_date: "2026-02-10T10:30:00Z",
    deleted_date: null,
    last_active_date: "2026-05-22T11:20:00Z",
  },
  {
    uid: "ca_3",
    tier_id: "tier_free",
    user_name: "Trần Nhập Liệu",
    email: "nhaplieu.tran@historytalk.vn",
    role: "CONTENT_ADMIN",
    token: 0,
    is_active: false,
    created_date: "2026-03-01T08:15:00Z",
    updated_date: "2026-05-15T15:40:00Z",
    deleted_date: null,
    last_active_date: "2026-05-15T15:30:00Z",
  },

  // System Admins
  {
    uid: "sa_1",
    tier_id: "tier_free",
    user_name: "Hệ Thống Trưởng",
    email: "sysadmin@historytalk.vn",
    role: "SYSTEM_ADMIN",
    token: 0,
    is_active: true,
    created_date: "2026-01-01T00:00:00Z",
    updated_date: "2026-01-01T00:00:00Z",
    deleted_date: null,
    last_active_date: "2026-05-22T23:50:00Z",
  },
  {
    uid: "sa_2",
    tier_id: "tier_free",
    user_name: "Phó Admin Kỹ Thuật",
    email: "techadmin@historytalk.vn",
    role: "SYSTEM_ADMIN",
    token: 0,
    is_active: true,
    created_date: "2026-03-15T09:40:00Z",
    updated_date: "2026-03-15T09:40:00Z",
    deleted_date: null,
    last_active_date: "2026-05-22T19:15:00Z",
  },
];

const DEFAULT_ORDERS: MockOrder[] = [
  {
    order_id: "ord_1",
    uid: "usr_1",
    user_name: "Nguyễn Văn Anh",
    tier_title: "Pro",
    order_code: "10284758392",
    amount: 199000,
    status: "PAID",
    paid_at: "2026-05-10T08:45:00Z",
    created_date: "2026-05-10T08:30:00Z",
  },
  {
    order_id: "ord_2",
    uid: "usr_2",
    user_name: "Trần Thị Bình",
    tier_title: "Plus",
    order_code: "10284758501",
    amount: 99000,
    status: "PAID",
    paid_at: "2026-05-18T14:30:00Z",
    created_date: "2026-05-18T14:20:00Z",
  },
  {
    order_id: "ord_3",
    uid: "usr_6",
    user_name: "Ngô Mỹ Dung",
    tier_title: "Plus",
    order_code: "10284759082",
    amount: 99000,
    status: "PENDING",
    paid_at: null,
    created_date: "2026-05-22T23:05:00Z",
  },
  {
    order_id: "ord_4",
    uid: "usr_4",
    user_name: "Phạm Đông Dương",
    tier_title: "Pro",
    order_code: "10284752940",
    amount: 199000,
    status: "FAILED",
    paid_at: null,
    created_date: "2026-05-09T10:00:00Z",
  },
];

const KEY_USERS = "ht-admin-users";
const KEY_TIERS = "ht-admin-tiers";
const KEY_ORDERS = "ht-admin-orders";

// Helper checking if localStorage is available
const isClient = typeof window !== "undefined";

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (!isClient) return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T) {
  if (!isClient) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export const seedMockDatabase = () => {
  if (!isClient) return;
  if (!localStorage.getItem(KEY_USERS)) {
    saveToStorage(KEY_USERS, DEFAULT_USERS);
  }
  if (!localStorage.getItem(KEY_TIERS)) {
    saveToStorage(KEY_TIERS, DEFAULT_TIERS);
  }
  if (!localStorage.getItem(KEY_ORDERS)) {
    saveToStorage(KEY_ORDERS, DEFAULT_ORDERS);
  }
};

// Seeding immediately on load
if (isClient) {
  seedMockDatabase();
}

export const adminMockService = {
  // Get system statistics for Dashboard
  getStats: () => {
    const users = loadFromStorage<MockUser[]>(KEY_USERS, DEFAULT_USERS).filter(u => !u.deleted_date);
    const orders = loadFromStorage<MockOrder[]>(KEY_ORDERS, DEFAULT_ORDERS);

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    
    // Revenue calculations (paid orders)
    const paidOrders = orders.filter(o => o.status === "PAID");
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);

    // Subscriptions tiers breakdown
    const freeCount = users.filter(u => u.role === "CUSTOMER" && u.tier_id === "tier_free").length;
    const plusCount = users.filter(u => u.role === "CUSTOMER" && u.tier_id === "tier_plus").length;
    const proCount = users.filter(u => u.role === "CUSTOMER" && u.tier_id === "tier_pro").length;

    // Token statistics
    const totalTokens = users.filter(u => u.role === "CUSTOMER").reduce((sum, u) => sum + u.token, 0);

    // Build user growth mock chart data
    const registrationTrend = [
      { date: "16/05", count: 8 },
      { date: "17/05", count: 12 },
      { date: "18/05", count: 15 },
      { date: "19/05", count: 19 },
      { date: "20/05", count: 24 },
      { date: "21/05", count: 28 },
      { date: "22/05", count: 32 },
    ];

    // Build revenue trend chart data
    const revenueTrend = [
      { date: "16/05", revenue: 199000 },
      { date: "17/05", revenue: 199000 },
      { date: "18/05", revenue: 298000 },
      { date: "19/05", revenue: 397000 },
      { date: "20/05", revenue: 397000 },
      { date: "21/05", revenue: 496000 },
      { date: "22/05", revenue: 595000 },
    ];

    // Recent events logs
    const recentActivities = [
      { id: "act_1", user: "Hệ Thống Trưởng", action: "Thay đổi phân quyền cho Lê Content Specialist", time: "5 phút trước" },
      { id: "act_2", user: "Nguyễn Biên Tập Viên", action: "Đã xuất bản nhân vật 'Quang Trung'", time: "30 phút trước" },
      { id: "act_3", user: "Lê Content Specialist", action: "Đã thêm bối cảnh 'Chiến dịch Điện Biên Phủ'", time: "2 giờ trước" },
      { id: "act_4", user: "Hệ Thống Trưởng", action: "Cập nhật giá gói PRO lên 199,000đ", time: "1 ngày trước" },
      { id: "act_5", user: "Phó Admin Kỹ Thuật", action: "Khóa tài khoản vi phạm spam của Phạm Đông Dương", time: "2 ngày trước" },
    ];

    return {
      totalUsers,
      activeUsers,
      totalRevenue,
      freeCount,
      plusCount,
      proCount,
      totalTokens,
      registrationTrend,
      revenueTrend,
      recentActivities,
      recentOrders: orders.slice(0, 5),
    };
  },

  // Get users list by role
  getUsersByRole: (role: "CUSTOMER" | "CONTENT_ADMIN" | "SYSTEM_ADMIN") => {
    const users = loadFromStorage<MockUser[]>(KEY_USERS, DEFAULT_USERS);
    return users.filter(u => u.role === role);
  },

  // Create new user account
  createUser: (user: Omit<MockUser, "uid" | "created_date" | "updated_date" | "deleted_date" | "last_active_date">) => {
    const users = loadFromStorage<MockUser[]>(KEY_USERS, DEFAULT_USERS);
    const newUser: MockUser = {
      ...user,
      uid: `usr_${Date.now()}`,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      deleted_date: null,
      last_active_date: new Date().toISOString(),
    };
    users.unshift(newUser);
    saveToStorage(KEY_USERS, users);
    return newUser;
  },

  // Update existing user account
  updateUser: (uid: string, updates: Partial<MockUser>) => {
    const users = loadFromStorage<MockUser[]>(KEY_USERS, DEFAULT_USERS);
    const updatedUsers = users.map((u) => {
      if (u.uid === uid) {
        return {
          ...u,
          ...updates,
          updated_date: new Date().toISOString(),
        };
      }
      return u;
    });
    saveToStorage(KEY_USERS, updatedUsers);
    return updatedUsers.find((u) => u.uid === uid)!;
  },

  // Soft delete user
  softDeleteUser: (uid: string) => {
    const users = loadFromStorage<MockUser[]>(KEY_USERS, DEFAULT_USERS);
    const updatedUsers = users.map((u) => {
      if (u.uid === uid) {
        return {
          ...u,
          deleted_date: new Date().toISOString(),
        };
      }
      return u;
    });
    saveToStorage(KEY_USERS, updatedUsers);
    return true;
  },

  // Restore user from trash bin
  restoreUser: (uid: string) => {
    const users = loadFromStorage<MockUser[]>(KEY_USERS, DEFAULT_USERS);
    const updatedUsers = users.map((u) => {
      if (u.uid === uid) {
        return {
          ...u,
          deleted_date: null,
        };
      }
      return u;
    });
    saveToStorage(KEY_USERS, updatedUsers);
    return true;
  },

  // Permanently delete user
  permanentDeleteUser: (uid: string) => {
    const users = loadFromStorage<MockUser[]>(KEY_USERS, DEFAULT_USERS);
    const filteredUsers = users.filter((u) => u.uid !== uid);
    saveToStorage(KEY_USERS, filteredUsers);
    return true;
  },

  // Add tokens to a customer
  addTokens: (uid: string, amount: number) => {
    const users = loadFromStorage<MockUser[]>(KEY_USERS, DEFAULT_USERS);
    const updatedUsers = users.map((u) => {
      if (u.uid === uid) {
        return {
          ...u,
          token: u.token + amount,
          updated_date: new Date().toISOString(),
        };
      }
      return u;
    });
    saveToStorage(KEY_USERS, updatedUsers);
    return updatedUsers.find((u) => u.uid === uid)!;
  },
};

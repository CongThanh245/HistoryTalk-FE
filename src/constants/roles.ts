export enum Role {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  SELLER = 'seller',
  CUSTOMER = 'customer',
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Quản trị viên',
  [Role.MODERATOR]: 'Kiểm duyệt viên',
  [Role.SELLER]: 'Người bán',
  [Role.CUSTOMER]: 'Khách hàng',
};
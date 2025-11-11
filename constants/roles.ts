export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',  
  EMPLOYEE: 'employee'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ROLE_ROUTES = {
  [USER_ROLES.ADMIN]: '/(admin)',
  [USER_ROLES.MANAGER]: '/(manager)', 
  [USER_ROLES.EMPLOYEE]: '/(tabs)'
} as const;

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Quản trị viên',
  [USER_ROLES.MANAGER]: 'Quản lý dự án',
  [USER_ROLES.EMPLOYEE]: 'Nhân viên'
} as const;

export const TASK_STATUS = {
  CHO_XU_LY: 'cho_xu_ly',
  DANG_THUC_HIEN: 'dang_thuc_hien',
  HOAN_THANH: 'hoan_thanh',
  TAM_DUNG: 'tam_dung',
  HUY_BO: 'huy_bo'
} as const;

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.CHO_XU_LY]: 'Chờ xử lý',
  [TASK_STATUS.DANG_THUC_HIEN]: 'Đang thực hiện', 
  [TASK_STATUS.HOAN_THANH]: 'Hoàn thành',
  [TASK_STATUS.TAM_DUNG]: 'Tạm dừng',
  [TASK_STATUS.HUY_BO]: 'Hủy bỏ'
} as const;

export const PRIORITY_LEVELS = {
  THAP: 'thap',
  TRUNG_BINH: 'trung_binh', 
  CAO: 'cao',
  KHAN_CAP: 'khan_cap'
} as const;

export const PRIORITY_LABELS = {
  [PRIORITY_LEVELS.THAP]: 'Thấp',
  [PRIORITY_LEVELS.TRUNG_BINH]: 'Trung bình',
  [PRIORITY_LEVELS.CAO]: 'Cao', 
  [PRIORITY_LEVELS.KHAN_CAP]: 'Khẩn cấp'
} as const;
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'userId',
  USER_NAME: 'hoten',
  USER_CODE: 'manv',
  USER_ROLE: 'role',
  USER_AVATAR: 'avatar',
  LAST_AUTH_EVENT: 'lastAuthEvent'
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh'
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    UPDATE: (id: number) => `/users/${id}`,
    DELETE: (id: number) => `/users/${id}`,
    PROFILE: '/users/me',
    AVATAR: '/users/avatar'
  },
  PROJECTS: {
    LIST: '/duan/getAll',
    CREATE: '/duan/create', 
    UPDATE: (id: number) => `/duan/update/${id}`,
    DELETE: (id: number) => `/duan/delete/${id}`,
    BY_ID: (id: string) => `/duan/getById/${id}`,
    BY_MANAGER: (managerId: string) => `/duan/byManager/${managerId}`
  },
  TASKS: {
    LIST: '/tasks',
    CREATE: '/tasks',
    UPDATE: (id: number) => `/tasks/${id}`,
    DELETE: (id: number) => `/tasks/${id}`,
    BY_PROJECT: (projectId: string) => `/tasks/project/${projectId}`,
    MY_TASKS: '/tasks/my-tasks',
    KANBAN: (projectId: string) => `/tasks/project/${projectId}/kanban`,
    UPDATE_STATUS: (id: number) => `/tasks/${id}/status`
  }
} as const;
export interface MemberStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingApprovalTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface TodayTask {
  id: number;
  tentask: string;
  tenSubtask?: string;
  priority: string;
  deadline: string;
  status: string;
  type: 'task' | 'subtask';
  mucDoUuTien?: string;
  trangThai: string;
  ngayKetThuc?: string;
}

export interface UpcomingTask {
  id: number;
  title: string;
  deadline: string;
  priority: string;
  daysLeft: number;
}

export interface OverdueTask {
  id: number;
  title: string;
  tentask?: string;
  tenSubtask?: string;
  deadline: string;
  ngayKetThuc?: string;
  priority: string;
  mucDoUuTien?: string;
  status: string;
  trangThai?: string;
  daysOverdue: number;
  type: 'task' | 'subtask';
  project?: string;
  parentTask?: string;
}

export interface Activity {
  id: number;
  action: string;
  taskTitle: string;
  timestamp: string;
  type: 'status_change' | 'comment' | 'worklog';
  description?: string;
  createdAt: string;
}

export interface MemberTask {
  id: number;
  title?: string;
  tentask: string;
  description?: string;
  mota?: string;
  status?: string;
  trangThai: string;
  priority?: string;
  mucDoUuTien?: string;
  deadline?: string;
  ngayKetThuc?: string;
  ngayBatDau?: string;
  tienDo?: number;
  project?: string;
  type?: 'task' | 'subtask';
  parentTask?: string;
  completedSubtasks?: number;
  totalSubtasks?: number;
  duan?: {
    id: number;
    tenduan: string;
    status: string;
  };
  nguoiGiao?: {
    id: number;
    hoten: string;
    manv: string;
  };
  subtasks?: any[];
}

export interface MemberSubtask {
  id: number;
  tenSubtask: string;
  trangThai: string;
  ngayKetThuc?: string;
  taskId?: number;
  duanId?: number;
  tentask?: string;
  tenduan?: string;
  // Legacy structure for backward compatibility
  task?: {
    id: number;
    tentask: string;
    duan?: {
      id: number;
      tenduan: string;
    };
  };
}

export interface MemberProject {
  id: number;
  name: string;
  tenduan: string;
  description: string;
  mota?: string;
  status: string;
  progress: number;
  startDate: string;
  ngaybatdau: string;
  endDate: string;
  deadline: string;
  ngayketthuc: string;
  teamSize: number;
  totalMembers: number;
  manager: string;
  managerPosition?: string;
  totalTasks: number;
  completedTasks: number;
  myTasks: number;
  myCompletedTasks: number;
  myRole?: string;
  documents?: number;
}

export interface Worklog {
  id: number;
  date: string;
  taskName: string;
  project: string;
  hours: number;
  description: string;
  taskId?: number;
  subtaskId?: number;
  createdAt?: string;
  updatedAt?: string;
  note?: string;
}

export interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  currentTask: string;
  currentProject: string;
  elapsedSeconds: number;
  selectedSubtaskId: number | null;
}

export interface UserProfile {
  id: number;
  fullName?: string;
  hoten: string;
  username?: string;
  email: string;
  phone?: string;
  sdt: string;
  address?: string;
  dateOfBirth?: string;
  position?: string;
  chucvu: string;
  department?: string;
  manv: string;
  avatar?: string | null;
  avatarUrl?: string;
  role: {
    name: string;
  };
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'project' | 'task' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'published';
  targetAudience: string;
  authorId: number;
  author: {
    id: number;
    manv: string;
    hoten: string;
  };
  userMeta?: any;
  isRead?: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

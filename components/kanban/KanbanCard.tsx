"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import assignmentAPI from '@/axios/assignmentAPI';
import taskAPI from '@/axios/taskAPI';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, User, Clock, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Subtask {
  id: number;
  tenSubtask: string;
  trangThai: string;
}

interface Task {
  id: number;
  tentask: string;
  mota?: string;
  trangThai: string;
  mucDoUuTien: 'low' | 'medium' | 'high';
  ngayKetThuc: string;
  ngayBatDau?: string;
  nguoiDuocGiao?: {
    id: number;
    hoten: string;
    manv: string;
    email?: string;
  };
  subtasks?: Subtask[];
  progress?: number;
}

interface KanbanCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onClick?: (task: Task) => void;
  onDeleted?: (taskId: number) => void;
}

const priorityConfig = {
  low: { label: 'Thấp', color: 'bg-blue-100 text-blue-800' },
  medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Cao', color: 'bg-red-100 text-red-800' },
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onDragStart, onDragEnd, onClick, onDeleted }) => {
  const priority = priorityConfig[task.mucDoUuTien] || priorityConfig.medium;
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();
  // taskAPI imported above
  
  // Kiểm tra deadline
  const isOverdue = new Date(task.ngayKetThuc) < new Date() && task.trangThai !== 'Hoàn thành';
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <Card 
      className="cursor-move hover:shadow sm:shadow-sm transition-shadow bg-white mb-2 p-2"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(task)}
    >
      <CardHeader className="pb-1">
        <div className="flex justify-between items-start mb-1">
          <Badge className={priority.color}>
            {priority.label}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="flex items-center gap-1 text-xs">
              <AlertCircle className="w-3 h-3" />
              Trễ hạn
            </Badge>
          )}
        </div>
        <CardTitle className="text-sm font-semibold line-clamp-2">
          {task.tentask}
        </CardTitle>
        {task.mota && (
          <CardDescription className="line-clamp-2 text-xs">
            {task.mota}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Progress bar */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Tiến độ</span>
              <span>{task.progress || 0}%</span>
            </div>
            <Progress value={task.progress || 0} className="h-1" />
            <div className="text-xs text-gray-500">
              {task.subtasks.filter(st => st.trangThai === 'Hoàn thành').length}/{task.subtasks.length} subtasks
            </div>
          </div>
        )}

        {/* Deadline */}
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
            {formatDate(task.ngayKetThuc)}
          </span>
        </div>

        {/* Assignee */}
        {task.nguoiDuocGiao && (
          <div className="flex items-center gap-2">
            <Avatar className="w-5 h-5">
              <AvatarFallback className="text-xs">
                {task.nguoiDuocGiao.hoten.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-700">{task.nguoiDuocGiao.hoten}</span>
          </div>
        )}
      </CardContent>
      {/* Member: request to join button */}
  {auth && auth.role === 'member' && (!task.nguoiDuocGiao || !task.nguoiDuocGiao.id) && (
        <div className="px-2 pb-2">
          <button
            disabled={loadingRequest}
            onClick={async (e) => {
              e.stopPropagation();
              if (!confirm('Gửi yêu cầu tham gia công việc này tới người quản lý?')) return;
              try {
                setLoadingRequest(true);
                const payload: any = { taskId: task.id };
                const res = await assignmentAPI.requestToJoin(payload);
                if (res && res.success) {
                  toast({ title: 'Đã gửi yêu cầu', description: 'Yêu cầu tham gia đã được gửi tới người quản lý.' });
                } else {
                  toast({ title: 'Lỗi', description: (res && res.message) || 'Không thể gửi yêu cầu' });
                }
              } catch (err: any) {
                console.error('requestToJoin error', err);
                toast({ title: 'Lỗi', description: err?.response?.data?.message || 'Lỗi khi gửi yêu cầu' });
              } finally {
                setLoadingRequest(false);
              }
            }}
            className="text-xs text-blue-600 hover:underline"
          >
            {loadingRequest ? 'Đang gửi...' : 'Yêu cầu tham gia'}
          </button>
        </div>
      )}
      {/* Delete button for owner or managers/admins */}
      {(auth && (String(auth.id) === String(task.nguoiDuocGiao?.id) || ['manager', 'admin'].includes(auth.role || ''))) && (
        <div className="px-2 pb-2">
          <button
            disabled={deleting}
            onClick={async (e) => {
              e.stopPropagation();
              if (!confirm('Bạn có chắc muốn xóa công việc này? (Không thể hoàn tác)')) return;
              try {
                setDeleting(true);
                const res = await taskAPI.deleteTask(task.id);
                if (res && res.success) {
                  toast({ title: 'Đã xóa', description: 'Công việc đã được xóa.' });
                  if (typeof onDeleted === 'function') {
                    onDeleted(task.id);
                  }
                } else {
                  toast({ title: 'Lỗi', description: (res && res.message) || 'Không thể xóa công việc' });
                }
              } catch (err: any) {
                console.error('deleteTask error', err);
                toast({ title: 'Lỗi', description: err?.response?.data?.message || 'Lỗi khi xóa công việc' });
              } finally {
                setDeleting(false);
              }
            }}
            className="text-xs text-red-600 hover:underline"
          >
            {deleting ? 'Đang xóa...' : 'Xóa công việc'}
          </button>
        </div>
      )}
    </Card>
  );
};

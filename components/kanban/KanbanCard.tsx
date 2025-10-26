"use client";

import React from 'react';
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
}

const priorityConfig = {
  low: { label: 'Thấp', color: 'bg-blue-100 text-blue-800' },
  medium: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Cao', color: 'bg-red-100 text-red-800' },
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onDragStart, onDragEnd, onClick }) => {
  const priority = priorityConfig[task.mucDoUuTien] || priorityConfig.medium;
  
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
    </Card>
  );
};

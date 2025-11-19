"use client";

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { KanbanCard } from './KanbanCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

// Use flexible types here to avoid duplicated local Task interfaces across files
interface KanbanColumnProps {
  title: string;
  status: string;
  tasks: any[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetStatus: string) => void;
  onDragStart: (e: React.DragEvent, task: any) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onTaskClick?: (task: any) => void;
  color?: string;
  isCustom?: boolean;
  onDelete?: () => void;
  onTaskDeleted?: (taskId: number) => void;
}

const statusColors: Record<string, string> = {
  'Chưa bắt đầu': 'bg-gray-500',
  'Đang chạy': 'bg-blue-500',
  'Hoàn thành': 'bg-green-500',
  subtasks: 'bg-gray-400',
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  tasks = [],
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onTaskClick,
  color,
  isCustom,
  onDelete,
  onTaskDeleted,
}) => {
  return (
    <div className="flex flex-col h-full">
      <Card className="h-full flex flex-col bg-white/60 border border-gray-100 shadow-sm p-2">
        <CardHeader className="pb-2 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${statusColors[status] || color || 'bg-gray-400'}`}
                aria-hidden
              />
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full text-xs px-2 py-0.5">
                {Array.isArray(tasks) ? tasks.length : 0}
              </Badge>
              {isCustom && onDelete && (
                <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Xóa cột ${title}`}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <div
          className="flex-1 px-2 pb-2 overflow-y-auto space-y-2 min-h-0 scrollbar-thin scrollbar-thumb-rounded"
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, status)}
        >
          {!tasks || (Array.isArray(tasks) && tasks.length === 0) ? (
            <div className="flex items-center justify-center h-20 text-gray-400 text-xs">Không có công việc</div>
          ) : (
            tasks.map((task: any) => (
              <KanbanCard
                key={task.id}
                task={task}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onClick={onTaskClick}
                onDeleted={(taskId: number) => {
                  if (typeof onTaskDeleted === 'function') onTaskDeleted(taskId);
                }}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default KanbanColumn;

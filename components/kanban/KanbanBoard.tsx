"use client";

import React, { useState, useEffect } from 'react';
import KanbanColumn from './KanbanColumn';
import { getKanbanTasks, updateTaskStatus } from '@/axios/api';
import { useToast } from '@/hooks/use-toast-notification';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Task {
  id: number;
  tentask: string;
  mota?: string;
  trangThai: string;
  mucDoUuTien: 'low' | 'medium' | 'high';
  ngayKetThuc: string;
  nguoiDuocGiao?: {
    id: number;
    hoten: string;
    manv: string;
    email?: string;
  };
  subtasks?: any[];
  progress?: number;
}

interface KanbanData {
  'Chưa bắt đầu': Task[];
  'Đang chạy': Task[];
  'Hoàn thành': Task[];
  subtasks?: Task[];
}

interface Subtask {
  id: number;
  title: string;
  description?: string;
  status: 'not started' | 'in progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo?: {
    id: number;
    name: string;
    email?: string;
  };
  progress?: number;
}

interface KanbanSubtaskData {
  'Chưa bắt đầu': Subtask[];
  'Đang chạy': Subtask[];
  'Hoàn thành': Subtask[];
}
interface Column {
  id: string;
  title: string;
  status: string;
  color?: string;
  isCustom?: boolean;
}

interface KanbanBoardProps {
  projectId: string | number;
  isSubtaskView? : boolean;
  onTaskClick?: (task: Task) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, onTaskClick , isSubtaskView }) => {
  
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    'Chưa bắt đầu': [],
    'Đang chạy': [],
    'Hoàn thành': [],
  });
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showSuccess, showError } = useToast();

  const defaultColumns: Column[] = [
    { id: 'col-not-started', title: 'Chưa bắt đầu', status: 'Chưa bắt đầu', color: 'gray' },
    { id: 'col-in-progress', title: 'Đang thực hiện', status: 'Đang chạy', color: 'blue' },
    { id: 'col-done', title: 'Hoàn thành', status: 'Hoàn thành', color: 'green' },
  ];

  const [columns, setColumns] = useState<Column[]>(() => {
    try {
      const key = `kanban_columns_${projectId}`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* ignore */
    }
    return defaultColumns;
  });

  const [newColumnTitle, setNewColumnTitle] = useState('');

  const fetchKanbanData = async () => {
    try {
  const response = await getKanbanTasks(projectId);
  setKanbanData(response.kanban);
    } catch (error: any) {
      console.error('Kanban fetch error:', error);
      showError(error.message || 'Không thể tải dữ liệu Kanban');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKanbanData();
  }, [projectId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchKanbanData();
  };

  // Persist columns when changed
  useEffect(() => {
    try {
      const key = `kanban_columns_${projectId}`;
      localStorage.setItem(key, JSON.stringify(columns));
    } catch (e) {
      // ignore
    }
  }, [columns, projectId]);

  const handleAddColumn = () => {
    const title = newColumnTitle.trim();
    if (!title) return;
    const status = title; // use title as status string
    const id = `col-${Date.now()}`;
    const newCol: Column = { id, title, status, color: 'gray', isCustom: true };
    setColumns((c) => [...c, newCol]);
    setNewColumnTitle('');
  };

  const handleDeleteColumn = (id: string) => {
    setColumns((c) => c.filter(col => col.id !== id));
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.trangThai === targetStatus) {
      return;
    }

    const oldStatus = draggedTask.trangThai;
    
    // Optimistic update
    const updatedKanbanData: KanbanData = { ...kanbanData } as KanbanData;
    // Ensure arrays exist for both statuses
    const oldArr = (updatedKanbanData[oldStatus as keyof KanbanData] || []) as Task[];
    const targetArr = (updatedKanbanData[targetStatus as keyof KanbanData] || []) as Task[];

    updatedKanbanData[oldStatus as keyof KanbanData] = oldArr.filter((t) => t.id !== draggedTask.id);
    updatedKanbanData[targetStatus as keyof KanbanData] = [
      ...targetArr,
      { ...draggedTask, trangThai: targetStatus },
    ];
    setKanbanData(updatedKanbanData);

    // Update on server
    try {
      await updateTaskStatus(draggedTask.id, targetStatus);
      showSuccess(`Đã chuyển "${draggedTask.tentask}" sang ${targetStatus}`);
      // Refresh để có dữ liệu mới nhất
      fetchKanbanData();
    } catch (error: any) {
      // Revert on error
      setKanbanData(kanbanData);
      showError(error.message || 'Không thể cập nhật trạng thái');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kanban Board</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-border rounded-md px-2 py-1 shadow-sm">
            <input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Tên cột mới"
              className="outline-none text-sm w-48 px-2 py-1"
            />
            <Button size="sm" onClick={handleAddColumn} className="ml-2">Thêm</Button>
          </div>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="ml-1">Làm mới</span>
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-3 overflow-x-auto min-h-[360px]">
       
        {isSubtaskView ? (
          <div className="flex-1 min-w-[240px]">
            <KanbanColumn
              title="Subtasks"
              status="subtasks"
              tasks={(kanbanData as KanbanData)['subtasks'] || []}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onTaskClick={onTaskClick}
              color={'gray'}
            />
          </div>
        ) : (
          columns.map((column) => {
            const tasksForColumn = kanbanData[column.status as keyof KanbanData] || [];
            console.log(`🔍 Rendering column ${column.status} with ${tasksForColumn.length} tasks:`, tasksForColumn);

            return (
              <div key={column.id} className="flex-1 min-w-[240px]">
                <KanbanColumn
                  title={column.title}
                  status={column.status}
                  tasks={tasksForColumn}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onTaskClick={onTaskClick}
                  color={column.color || 'gray'}
                  isCustom={!!column.isCustom}
                  onDelete={() => handleDeleteColumn(column.id)}
                  onTaskDeleted={async (taskId: number) => {
                    // refresh board after a task was deleted
                    try {
                      setLoading(true);
                      await fetchKanbanData();
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-700">
              {kanbanData['Chưa bắt đầu'].length + kanbanData['Đang chạy'].length + kanbanData['Hoàn thành'].length}
            </div>
            <div className="text-sm text-gray-500">Tổng công việc</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {kanbanData['Chưa bắt đầu'].length}
            </div>
            <div className="text-sm text-gray-500">Chưa bắt đầu</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {kanbanData['Đang chạy'].length}
            </div>
            <div className="text-sm text-gray-500">Đang thực hiện</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {kanbanData['Hoàn thành'].length}
            </div>
            <div className="text-sm text-gray-500">Hoàn thành</div>
          </div>
        </div>
      </div>
    </div>
  );
};

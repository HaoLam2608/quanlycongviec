"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { getProjectById } from '@/axios/api';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Project {
  id: number;
  tenduan: string;
  mota?: string;
}

export default function KanbanPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const subtasksView = searchParams.get('subtasks') === 'true';
  const actualSubtasksView = false;
  
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await getProjectById(projectId);
        setProject(data);
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleTaskClick = (task: any) => {
    console.log('Task clicked:', task);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/manager/projects')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-3xl font-bold">
                  {project?.tenduan || 'Kanban Board'}
                </CardTitle>
              </div>
              {project?.mota && (
                <CardDescription className="ml-12">
                  {project.mota}
                </CardDescription>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/manager/projects/${projectId}`)}
            >
              Xem dạng danh sách
            </Button>
          </div>
        </CardHeader>
      </Card>

      <KanbanBoard projectId={projectId} onTaskClick={handleTaskClick} isSubtaskView={actualSubtasksView} />
    </div>
  );
}

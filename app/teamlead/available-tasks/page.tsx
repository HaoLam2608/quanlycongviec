'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Search,
    Hand,
    Mail,
    CheckCircle2,
    XCircle,
    Calendar,
    Folder,
    User,
    AlertCircle,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
    id: number;
    tentask: string;
    mota?: string;
    mucDoUuTien?: string;
    ngayKetThuc?: string;
    duan?: {
        id: number;
        tenduan: string;
    };
    nguoiGiao?: {
        id: number;
        hoten: string;
        manv: string;
    };
}

interface PendingAssignment {
    id: number;
    taskId: number;
    status: string;
    createdAt: string;
    task: Task;
    manager?: {
        id: number;
        hoten: string;
        manv: string;
    };
}

export default function AvailableTasksPage() {
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [requestingTaskId, setRequestingTaskId] = useState<number | null>(null);
    const [processingAssignmentId, setProcessingAssignmentId] = useState<number | null>(null);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [declineAssignmentId, setDeclineAssignmentId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([loadAvailableTasks(), loadPendingAssignments()]);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableTasks = async () => {
        try {
            const response = await fetch('/api/assignments/unassigned/available', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setAvailableTasks(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            console.error('Load available tasks error:', error);
            toast.error('Không thể tải danh sách công việc chưa ai nhận');
        }
    };

    const loadPendingAssignments = async () => {
        try {
            const response = await fetch('/api/assignments/my-pending-tasks', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setPendingAssignments(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            console.error('Load pending assignments error:', error);
            toast.error('Không thể tải danh sách công việc được giao');
        }
    };

    const handleRequestTask = async (taskId: number) => {
        setRequestingTaskId(taskId);
        try {
            const response = await fetch('/api/assignments/claim-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ taskId })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Đã gửi yêu cầu nhận công việc. Vui lòng đợi Manager/Admin duyệt.');
                await loadData();
            } else {
                toast.error(data.message || 'Không thể gửi yêu cầu');
            }
        } catch (error) {
            console.error('Request task error:', error);
            toast.error('Không thể gửi yêu cầu nhận công việc');
        } finally {
            setRequestingTaskId(null);
        }
    };

    const handleAcceptAssignment = async (assignmentId: number) => {
        setProcessingAssignmentId(assignmentId);
        try {
            const response = await fetch(`/api/assignments/${assignmentId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Đã chấp nhận công việc!');
                await loadData();
            } else {
                toast.error(data.message || 'Không thể chấp nhận công việc');
            }
        } catch (error) {
            console.error('Accept assignment error:', error);
            toast.error('Không thể chấp nhận công việc');
        } finally {
            setProcessingAssignmentId(null);
        }
    };

    const handleDeclineAssignment = (assignmentId: number) => {
        setDeclineAssignmentId(assignmentId);
        setShowDeclineModal(true);
        setDeclineReason('');
    };

    const handleDeclineConfirm = async () => {
        if (!declineAssignmentId) return;

        if (!declineReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }

        setProcessingAssignmentId(declineAssignmentId);
        try {
            const response = await fetch(`/api/assignments/${declineAssignmentId}/decline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ reason: declineReason })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Đã từ chối công việc!');
                setShowDeclineModal(false);
                setDeclineReason('');
                setDeclineAssignmentId(null);
                await loadData();
            } else {
                toast.error(data.message || 'Không thể từ chối công việc');
            }
        } catch (error) {
            console.error('Decline assignment error:', error);
            toast.error('Không thể từ chối công việc');
        } finally {
            setProcessingAssignmentId(null);
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'cao':
            case 'high':
                return 'destructive';
            case 'trung bình':
            case 'medium':
                return 'default';
            case 'thấp':
            case 'low':
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const getPriorityLabel = (priority?: string) => {
        switch (priority?.toLowerCase()) {
            case 'cao':
            case 'high':
                return 'Cao';
            case 'trung bình':
            case 'medium':
                return 'Trung bình';
            case 'thấp':
            case 'low':
                return 'Thấp';
            default:
                return priority || 'Không xác định';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Không xác định';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN');
        } catch {
            return dateString;
        }
    };

    const filteredAvailableTasks = availableTasks.filter(task => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            task.tentask.toLowerCase().includes(q) ||
            task.mota?.toLowerCase().includes(q) ||
            task.duan?.tenduan?.toLowerCase().includes(q)
        );
    });

    const filteredPendingAssignments = pendingAssignments.filter(assignment => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            assignment.task?.tentask?.toLowerCase().includes(q) ||
            assignment.task?.mota?.toLowerCase().includes(q) ||
            assignment.task?.duan?.tenduan?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Yêu cầu nhận công việc</h1>
                    <p className="text-muted-foreground mt-1">
                        {filteredAvailableTasks.length} công việc khả dụng • {filteredPendingAssignments.length} chờ xác nhận
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Tìm kiếm công việc..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            <Tabs defaultValue="available" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="available" className="flex items-center gap-2">
                        <Hand className="w-4 h-4" />
                        Có thể nhận ({filteredAvailableTasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Được giao ({filteredPendingAssignments.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="available" className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredAvailableTasks.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Hand className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    {search ? 'Không tìm thấy công việc phù hợp' : 'Không có công việc khả dụng'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredAvailableTasks.map((task) => (
                            <Card key={task.id} className="border-l-4 border-l-blue-500">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg">{task.tentask}</CardTitle>
                                            {task.mota && (
                                                <CardDescription className="mt-2">{task.mota}</CardDescription>
                                            )}
                                        </div>
                                        {task.mucDoUuTien && (
                                            <Badge variant={getPriorityColor(task.mucDoUuTien)}>
                                                {getPriorityLabel(task.mucDoUuTien)}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {task.duan && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Folder className="w-4 h-4" />
                                            <span>{task.duan.tenduan}</span>
                                        </div>
                                    )}
                                    {task.nguoiGiao && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <User className="w-4 h-4" />
                                            <span>Tạo bởi: {task.nguoiGiao.hoten}</span>
                                        </div>
                                    )}
                                    {task.ngayKetThuc && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span>Hạn: {formatDate(task.ngayKetThuc)}</span>
                                        </div>
                                    )}
                                    <Button
                                        onClick={() => handleRequestTask(task.id)}
                                        disabled={requestingTaskId === task.id}
                                        className="w-full mt-4"
                                    >
                                        {requestingTaskId === task.id ? (
                                            <>
                                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                                Đang gửi...
                                            </>
                                        ) : (
                                            <>
                                                <Hand className="w-4 h-4 mr-2" />
                                                Yêu cầu nhận việc
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredPendingAssignments.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Mail className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    {search ? 'Không tìm thấy công việc phù hợp' : 'Không có công việc được giao'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredPendingAssignments.map((assignment) => {
                            const isProcessing = processingAssignmentId === assignment.id;

                            return (
                                <Card key={assignment.id} className="border-l-4 border-l-amber-500 bg-amber-50/50">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{assignment.task.tentask}</CardTitle>
                                                {assignment.task.mota && (
                                                    <CardDescription className="mt-2">{assignment.task.mota}</CardDescription>
                                                )}
                                            </div>
                                            {assignment.task.mucDoUuTien && (
                                                <Badge variant={getPriorityColor(assignment.task.mucDoUuTien)}>
                                                    {getPriorityLabel(assignment.task.mucDoUuTien)}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {assignment.task.duan && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Folder className="w-4 h-4" />
                                                <span>{assignment.task.duan.tenduan}</span>
                                            </div>
                                        )}
                                        {assignment.manager && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <User className="w-4 h-4" />
                                                <span>Giao bởi: {assignment.manager.hoten}</span>
                                            </div>
                                        )}
                                        {assignment.task.ngayKetThuc && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="w-4 h-4" />
                                                <span>Hạn: {formatDate(assignment.task.ngayKetThuc)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            <span>Gửi lúc: {formatDate(assignment.createdAt)}</span>
                                        </div>

                                        <Alert className="bg-amber-100 border-amber-300">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            <AlertDescription className="text-amber-800">
                                                Bạn cần xác nhận chấp nhận hoặc từ chối công việc này
                                            </AlertDescription>
                                        </Alert>

                                        <div className="flex gap-2 mt-4">
                                            <Button
                                                onClick={() => handleAcceptAssignment(assignment.id)}
                                                disabled={isProcessing}
                                                className="flex-1 bg-green-600 hover:bg-green-700"
                                            >
                                                {isProcessing ? (
                                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                )}
                                                Chấp nhận
                                            </Button>
                                            <Button
                                                onClick={() => handleDeclineAssignment(assignment.id)}
                                                disabled={isProcessing}
                                                variant="destructive"
                                                className="flex-1"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Từ chối
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={showDeclineModal} onOpenChange={setShowDeclineModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Lý do từ chối</DialogTitle>
                        <DialogDescription>
                            Vui lòng nhập lý do từ chối công việc này
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Nhập lý do từ chối..."
                            value={declineReason}
                            onChange={(e) => setDeclineReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeclineModal(false)}
                            disabled={processingAssignmentId !== null}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeclineConfirm}
                            disabled={processingAssignmentId !== null}
                        >
                            {processingAssignmentId ? (
                                <>
                                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                'Xác nhận'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

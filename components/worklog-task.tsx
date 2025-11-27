import React, { useEffect, useState } from "react";
import { getWorklogs, createWorklog } from "@/axios/api";
import { ListChecks } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Worklog {
    id: number;
    hours: number;
    note: string;
    date: string;
    User?: { hoten?: string };
    Subtask?: { id: number; tenSubtask?: string };
}

interface WorklogTaskProps {
    taskId: number;
    taskStatus?: string;
}

export default function WorklogTask({ taskId, taskStatus }: WorklogTaskProps) {
    const [worklogs, setWorklogs] = useState<Worklog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ hours: "", note: "", date: "" });
    const { id: userId } = useAuth();
    const [error, setError] = useState("");
    const isCompleted = taskStatus === 'Hoàn thành';

    useEffect(() => {
        if (taskId) {
            fetchWorklogs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskId]);

    const fetchWorklogs = async () => {
        setLoading(true);
        try {
            const data = await getWorklogs({ taskId });
            setWorklogs(data);
        } catch (err) {
            console.error("Failed to fetch worklogs for task:", err);
            setWorklogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!form.hours || !form.date) {
            setError("Vui lòng nhập số giờ và ngày làm việc");
            return;
        }
        try {
            if (!userId) {
                setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
                return;
            }

            await createWorklog({
                userId: Number(userId),
                taskId, // Ghi nhận worklog cho Task này
                hours: parseFloat(form.hours),
                note: form.note,
                date: form.date,
            });
            setForm({ hours: "", note: "", date: "" });
            setShowForm(false);
            fetchWorklogs(); // Tải lại danh sách worklog
        } catch (err) {
            setError("Không thể thêm nhật ký");
        }
    };

    return (
        <div className="p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <ListChecks size={20} className="text-primary" />
                    Tổng hợp Nhật ký công việc
                </h4>
                <button 
                    className={`text-xs hover:underline font-semibold ${
                        isCompleted 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-blue-600'
                    }`} 
                    onClick={() => !isCompleted && setShowForm((v) => !v)}
                    disabled={isCompleted}
                    title={isCompleted ? 'Không thể thêm nhật ký cho công việc đã hoàn thành' : ''}
                >
                    {showForm ? "Đóng" : "Thêm nhật ký cho công việc này"}
                </button>
            </div>
            {showForm && (
                <form className="mb-3 p-3 border bg-white rounded-lg space-y-2" onSubmit={handleSubmit}>
                    <div className="flex gap-2">
                        <input type="number" name="hours" value={form.hours} onChange={handleChange} placeholder="Số giờ" min={0.1} step={0.1} className="border rounded px-2 py-1 text-sm w-24" required />
                        <input type="date" name="date" value={form.date} onChange={handleChange} className="border rounded px-2 py-1 text-sm" required />
                    </div>
                    <textarea name="note" value={form.note} onChange={handleChange} placeholder="Nội dung công việc chung (vd: họp nhóm, review...)" className="border rounded px-2 py-1 text-sm w-full" rows={2} />
                    {error && <div className="text-xs text-red-500">{error}</div>}
                    <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Lưu</button>
                </form>
            )}
            {loading ? (
                <div className="text-sm text-muted-foreground">Đang tải...</div>
            ) : worklogs.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">Chưa có nhật ký công việc nào.</div>
            ) : (
                <div className="max-h-60 overflow-y-auto pr-2 text-sm space-y-3">
                    {worklogs.map((w) => (
                        <div key={w.id} className="border-t border-border py-3 first:border-t-0">
                            <div className="flex justify-between items-center font-semibold">
                                <span>{w.User?.hoten} - <span className="text-primary">{w.hours} giờ</span></span>
                                <span className="text-xs text-muted-foreground">{new Date(w.date).toLocaleDateString('vi-VN')}</span>
                            </div>
                            {w.Subtask && <p className="text-muted-foreground mt-1 text-xs">Công việc nhỏ: <span className="font-medium text-gray-600">{w.Subtask?.tenSubtask || `ST-${w.Subtask?.id}`}</span></p>}
                            <p className="mt-1 text-gray-700">{w.note}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
import React, { useEffect, useState } from "react";
import { getWorklogs, createWorklog } from "@/axios/api";
import { useAuth } from "@/hooks/useAuth";

interface Worklog {
    id: number;
    userId: number;
    hours: number;
    note: string;
    date: string;
    User?: { id: number; hoten?: string; name?: string; manv?: string };
}

interface WorklogListProps {
    subtaskId: number;
    subtaskStatus?: string;
}

export default function WorklogList({ subtaskId, subtaskStatus }: WorklogListProps) {
    const [worklogs, setWorklogs] = useState<Worklog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ hours: "", note: "", date: "" });
    const { id: userId } = useAuth();
    const [error, setError] = useState("");
    const isCompleted = subtaskStatus === 'Hoàn thành';

    useEffect(() => {
        if (!loading) {
            console.log("[WorklogSubtask] subtaskId:", subtaskId, "worklogs:", worklogs);
        }
    }, [worklogs, loading, subtaskId]);

    useEffect(() => {
        fetchWorklogs();
        // eslint-disable-next-line
    }, [subtaskId]);

    const fetchWorklogs = async () => {
        setLoading(true);
        try {
            const data = await getWorklogs({ subtaskId });
            setWorklogs(data);
        } catch (err) {
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
                subtaskId,
                hours: parseFloat(form.hours),
                note: form.note,
                date: form.date,
            });
            setForm({ hours: "", note: "", date: "" });
            setShowForm(false);
            fetchWorklogs();
        } catch (err) {
            setError("Không thể thêm worklog");
        }
    };

    return (
        <div className="border rounded-lg p-3 mt-2 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-sm text-primary">Nhật ký công việc</div>
                <button 
                    className={`text-xs hover:underline ${
                        isCompleted 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-blue-600'
                    }`} 
                    onClick={() => !isCompleted && setShowForm((v) => !v)}
                    disabled={isCompleted}
                    title={isCompleted ? 'Không thể thêm worklog cho công việc đã hoàn thành' : ''}
                >
                    {showForm ? "Đóng" : "Thêm worklog"}
                </button>
            </div>
            {showForm && (
                <form className="mb-2 space-y-2" onSubmit={handleSubmit}>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            name="hours"
                            value={form.hours}
                            onChange={handleChange}
                            placeholder="Số giờ"
                            min={0.1}
                            step={0.1}
                            className="border rounded px-2 py-1 text-sm w-24"
                            required
                        />
                        <input
                            type="date"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                            className="border rounded px-2 py-1 text-sm"
                            required
                        />
                    </div>
                    <textarea
                        name="note"
                        value={form.note}
                        onChange={handleChange}
                        placeholder="Nội dung công việc, khó khăn, kết quả..."
                        className="border rounded px-2 py-1 text-sm w-full"
                        rows={2}
                    />
                    {error && <div className="text-xs text-red-500">{error}</div>}
                    <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Lưu</button>
                </form>
            )}
            {loading ? (
                <div className="text-xs text-muted-foreground">Đang tải worklog...</div>
            ) : worklogs.length === 0 ? (
                <div className="text-xs text-muted-foreground">Chưa có worklog nào</div>
            ) : (
                <table className="w-full text-xs mt-2">
                    <thead>
                        <tr className="text-muted-foreground">
                            <th className="text-left font-medium">Ngày</th>
                            <th className="text-left font-medium">Số giờ</th>
                            <th className="text-left font-medium">Nội dung</th>
                            <th className="text-left font-medium">Người báo cáo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {worklogs.map((w) => (
                            <tr key={w.id}>
                                <td>{w.date}</td>
                                <td>{w.hours}</td>
                                <td>{w.note}</td>
                                <td>{w.User?.hoten || w.User?.name || w.User?.manv || w.userId}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

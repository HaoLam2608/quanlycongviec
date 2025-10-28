import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (form: any) => void;
    users: Array<{ id: number; hoten: string }>;
    initialData?: any; // Nếu có, là chế độ chỉnh sửa; nếu không, là thêm mới
}

export default function TaskModal({
    isOpen,
    onClose,
    onSave,
    users,
    initialData,
}: TaskModalProps) {
    const [form, setForm] = useState({
        tentask: initialData?.tentask || '',
        mota: initialData?.mota || '',
        mucDoUuTien: initialData?.mucDoUuTien || 'medium',
        ngayBatDau: initialData?.ngayBatDau ? initialData.ngayBatDau.slice(0, 10) : '',
        ngayKetThuc: initialData?.ngayKetThuc ? initialData.ngayKetThuc.slice(0, 10) : '',
        nguoiDuocGiaoId: initialData?.nguoiDuocGiaoId || '',
        trangThai: initialData?.trangThai || 'Chưa bắt đầu',
    });

    useEffect(() => {
        setForm({
            tentask: initialData?.tentask || '',
            mota: initialData?.mota || '',
            mucDoUuTien: initialData?.mucDoUuTien || 'medium',
            ngayBatDau: initialData?.ngayBatDau ? initialData.ngayBatDau.slice(0, 10) : '',
            ngayKetThuc: initialData?.ngayKetThuc ? initialData.ngayKetThuc.slice(0, 10) : '',
            nguoiDuocGiaoId: initialData?.nguoiDuocGiaoId || '',
            trangThai: initialData?.trangThai || 'Chưa bắt đầu',
        });
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Tên công việc</label>
                    <input name="tentask" value={form.tentask} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/30 outline-none" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Mô tả</label>
                    <textarea name="mota" value={form.mota} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/30 outline-none" rows={3} />
                </div>
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                        <input type="date" name="ngayBatDau" value={form.ngayBatDau} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/30 outline-none" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Hạn chót</label>
                        <input type="date" name="ngayKetThuc" value={form.ngayKetThuc} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/30 outline-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Người phụ trách *</label>
                    <select
                        required
                        name="nguoiDuocGiaoId"
                        value={String(form.nguoiDuocGiaoId)}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    >
                        <option value="">Chọn người phụ trách</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.hoten}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Trạng thái</label>
                    <select name="trangThai" value={form.trangThai} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/30 outline-none">
                        <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                        <option value="Đang chạy">Đang chạy</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Độ ưu tiên</label>
                    <select name="mucDoUuTien" value={form.mucDoUuTien} onChange={handleChange} className="w-full px-4 py-2 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/30 outline-none">
                        <option value="high">Cao</option>
                        <option value="medium">Trung bình</option>
                        <option value="low">Thấp</option>
                    </select>
                </div>
                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-xl bg-background hover:bg-gray-50 font-semibold">Hủy</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow">{initialData ? 'Lưu' : 'Thêm'}</button>
                </div>
            </form>
        </Modal>
    );
}

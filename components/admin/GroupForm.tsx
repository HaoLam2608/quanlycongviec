"use client";
import { useEffect, useState, useRef } from 'react';
import { X, Save, Users, Plus, Search, ChevronDown } from 'lucide-react';
import { getUsers, createGroup, updateGroup, addGroupMembers, groupAPI } from '@/axios/adminApi';
import { useToastContext } from '@/components/providers/toast-provider';
import api from '@/axios/config';

interface GroupFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editGroup?: any;
}

interface UserOption { id: number; hoten: string; manv: string; }
interface ProjectOption { id: number; tenduan: string; }

// Component SearchableSelect
interface SearchableSelectProps {
    options: any[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    displayKey: string;
    valueKey: string;
    searchKey: string;
    disabled?: boolean;
    className?: string;
}

function SearchableSelect({ options, value, onChange, placeholder, displayKey, valueKey, searchKey, disabled, className }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(option =>
        option[searchKey].toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(option => String(option[valueKey]) === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className="w-full px-3 py-2 text-left border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
                <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedOption ? selectedOption[displayKey] : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {placeholder && (
                            <button
                                type="button"
                                onClick={() => {
                                    onChange('');
                                    setIsOpen(false);
                                    setSearchTerm('');
                                }}
                                className="w-full px-3 py-2 text-left text-gray-500 hover:bg-gray-50 text-sm"
                            >
                                {placeholder}
                            </button>
                        )}
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">Không tìm thấy kết quả</div>
                        ) : (
                            filteredOptions.map(option => (
                                <button
                                    key={option[valueKey]}
                                    type="button"
                                    onClick={() => {
                                        onChange(String(option[valueKey]));
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm"
                                >
                                    {option[displayKey]}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function GroupForm({ isOpen, onClose, onSuccess, editGroup }: GroupFormProps) {
    const { showSuccess, showError, showWarning } = useToastContext();
    const [formData, setFormData] = useState<{ name: string; description: string; duanId: string; leaderId: string }>({
        name: '', description: '', duanId: '', leaderId: ''
    });
    const [users, setUsers] = useState<UserOption[]>([]);
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [memberIds, setMemberIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [memberSearchTerm, setMemberSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
        user.hoten.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        user.manv.toLowerCase().includes(memberSearchTerm.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            loadPrerequisites();
            if (editGroup) {
                setFormData({
                    name: editGroup.name || '',
                    description: editGroup.description || '',
                    duanId: String(editGroup.duanId || editGroup.duan?.id || ''),
                    leaderId: String(editGroup.leaderId || editGroup.leader?.id || '')
                });
                const memberList = (editGroup.members || []).map((m: any) => m.id);
                setMemberIds(memberList);
            } else {
                setFormData({ name: '', description: '', duanId: '', leaderId: '' });
                setMemberIds([]);
            }
            setMessage('');
        }
    }, [isOpen, editGroup]);

    const loadPrerequisites = async () => {
        try {
            const [userData, projectRes] = await Promise.all([
                getUsers({ page: 1, limit: 1000 }), // Tăng limit để load nhiều user hơn
                api.get('/duan/getAll')
            ]);
            setUsers(userData.users.map((u: any) => ({ id: u.id, hoten: u.hoten, manv: u.manv })));
            setProjects(projectRes.data || []);
        } catch (e: any) {
            setMessage(e.response?.data?.message || e.message || 'Lỗi tải dữ liệu');
        }
    };

    const toggleMember = (id: number) => {
        setMemberIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            showWarning('Vui lòng nhập tên nhóm');

            return;
        }
        setLoading(true); setMessage('');
        try {
            if (editGroup) {
                await updateGroup(editGroup.id, {
                    name: formData.name,
                    description: formData.description,
                    leaderId: formData.leaderId ? Number(formData.leaderId) : undefined
                });
                // Cập nhật lại members: đơn giản gửi thêm các member mới (backend ignore trùng)
                const newMembers = memberIds.filter(id => !(editGroup.members || []).some((m: any) => m.id === id));
                if (newMembers.length) await addGroupMembers(editGroup.id, newMembers);
                showSuccess('Cập nhật nhóm thành công');
            } else {
                console.log("Creating group with data:", formData, "and members:", memberIds);
                await createGroup({
                    name: formData.name,
                    description: formData.description,
                    duanId: formData.duanId ? Number(formData.duanId) : undefined,
                    leaderId: formData.leaderId ? Number(formData.leaderId) : undefined,
                    memberIds: memberIds
                });
                showSuccess('Tạo nhóm thành công');
            }
            setTimeout(() => { onSuccess(); onClose(); }, 800);
        } catch (e: any) {
            const errorMessage = e.response?.data?.message || e.message || 'Có lỗi xảy ra';
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5" /> {editGroup ? 'Sửa nhóm' : 'Thêm nhóm mới'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Tên nhóm *</label>
                            <input name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập tên nhóm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Dự án</label>
                            <SearchableSelect
                                options={projects}
                                value={formData.duanId}
                                onChange={(value) => setFormData(prev => ({ ...prev, duanId: value }))}
                                placeholder="-- Chọn dự án (không bắt buộc) --"
                                displayKey="tenduan"
                                valueKey="id"
                                searchKey="tenduan"
                                disabled={!!editGroup}
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">Có thể tạo nhóm trước và gán dự án sau</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Leader</label>
                            <SearchableSelect
                                options={users}
                                value={formData.leaderId}
                                onChange={(value) => setFormData(prev => ({ ...prev, leaderId: value }))}
                                placeholder="-- Chưa chọn --"
                                displayKey="hoten"
                                valueKey="id"
                                searchKey="hoten"
                                className="w-full"
                            />
                            <p className="text-xs text-yellow-600 mt-1">
                                ⚠️ Nhóm trưởng không thể tham gia nhóm khác
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Mô tả</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Mô tả ngắn về nhóm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-3">Thành viên</label>
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                📋 <strong>Quy tắc nhóm:</strong>
                            </p>
                            <ul className="text-xs text-blue-700 mt-1 space-y-1">
                                <li>• Nhân viên tối đa tham gia 2 nhóm</li>
                                <li>• Nhóm trưởng không thể là thành viên nhóm khác</li>
                                <li>• Một người chỉ có thể làm nhóm trưởng 1 nhóm</li>
                            </ul>
                        </div>
                        <div className="border rounded-lg">
                            <div className="p-3 border-b bg-gray-50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm thành viên..."
                                        value={memberSearchTerm}
                                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="p-3 max-h-60 overflow-y-auto space-y-2">
                                {filteredUsers.length === 0 && memberSearchTerm && (
                                    <div className="text-sm text-gray-500 text-center py-4">Không tìm thấy thành viên nào</div>
                                )}
                                {filteredUsers.length === 0 && !memberSearchTerm && (
                                    <div className="text-sm text-gray-500 text-center py-4">Không có user</div>
                                )}
                                {filteredUsers.map(u => {
                                    const disabled = !!formData.leaderId && Number(formData.leaderId) === u.id;
                                    const checked = memberIds.includes(u.id) || disabled;
                                    return (
                                        <label key={u.id} className={`flex items-center gap-3 text-sm cursor-pointer p-2 rounded-md hover:bg-gray-50 ${disabled ? 'opacity-60' : ''}`}>
                                            <input
                                                type="checkbox"
                                                disabled={disabled}
                                                checked={checked}
                                                onChange={() => toggleMember(u.id)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-semibold text-indigo-700">
                                                        {u.hoten.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{u.hoten}</div>
                                                    <div className="text-xs text-gray-500">{u.manv}</div>
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                            {memberIds.length > 0 && (
                                <div className="p-3 border-t bg-gray-50">
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                        Đã chọn {memberIds.length} thành viên
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {memberIds.map(id => {
                                            const user = users.find(u => u.id === id);
                                            return user ? (
                                                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                    {user.hoten}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleMember(id)}
                                                        className="hover:bg-blue-200 rounded-full p-0.5"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50">
                            <Save className="w-4 h-4" /> {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

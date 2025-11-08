
// MultiSelect component cho dự án
function MultiSelectProject({ options, value, onChange, max }: { options: ProjectSelectOption[]; value: number[]; onChange: (v: number[]) => void; max: number }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const filtered = options.filter(p => p.tenduan.toLowerCase().includes(search.toLowerCase()));
    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex flex-wrap gap-2 mb-1">
                {value.map(id => {
                    const p = options.find(p => p.id === id);
                    if (!p) return null;
                    return (
                        <span key={id} className="inline-flex items-center px-2 py-1 rounded bg-indigo-100 text-indigo-800 text-xs font-medium border border-indigo-200">
                            {p.tenduan}
                            <button type="button" className="ml-1 text-gray-400 hover:text-red-500" onClick={() => onChange(value.filter(i => i !== id))}>&times;</button>
                        </span>
                    );
                })}
            </div>
            <button type="button" className="w-full px-3 py-2 border rounded-lg bg-white text-left focus:ring-2 focus:ring-blue-500 flex items-center justify-between" onClick={() => setOpen(o => !o)}>
                <span className={value.length ? 'text-gray-900' : 'text-gray-500'}>
                    {value.length ? `Đã chọn ${value.length} dự án` : 'Chọn dự án (tối đa 2)'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b">
                        <input type="text" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                    </div>
                    {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">Không có dự án</div>}
                    {filtered.map(p => (
                        <button key={p.id} type="button" disabled={value.length >= max && !value.includes(p.id)}
                            onClick={() => {
                                if (value.includes(p.id)) onChange(value.filter(i => i !== p.id));
                                else if (value.length < max) onChange([...value, p.id]);
                            }}
                            className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-blue-50 text-sm ${value.includes(p.id) ? 'bg-blue-100 text-blue-800' : ''} ${value.length >= max && !value.includes(p.id) ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {p.tenduan}
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${p.status === 'chua_bat_dau' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>{p.status === 'chua_bat_dau' ? 'Chuẩn bị' : 'Đang chạy'}</span>
                            {value.includes(p.id) && <span className="ml-auto text-blue-600">✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
import { useEffect, useState, useRef } from 'react';
// Custom hook để kiểm tra đã mounted client
function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    return mounted;
}
import { X, Save, Users, Plus, Search, ChevronDown } from 'lucide-react';
import { getUsers, createGroup, updateGroup, addGroupMembers, groupAPI, closeGroup } from '@/axios/adminApi';
import { useToastContext } from '@/components/providers/toast-provider';
import { showConfirm } from '@/lib/notifications';
import api from '@/axios/config';


interface GroupFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editGroup?: any;
}

interface ProjectSelectOption {
    id: number;
    tenduan: string;
    status: string;
}

interface UserOption { id: number; hoten: string; manv: string; chucvu?: string; }
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
    const isClosed = editGroup && editGroup.status === 'closed';
    const mounted = useMounted();
    const [showLeaderDropdown, setShowLeaderDropdown] = useState(false);
    const { showSuccess, showError, showWarning } = useToastContext();
    const [formData, setFormData] = useState<{ name: string; description: string; leaderId: string }>({
        name: '', description: '', leaderId: ''
    });
    const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [teamLeaders, setTeamLeaders] = useState<UserOption[]>([]);
    const [regularEmployees, setRegularEmployees] = useState<UserOption[]>([]);
    const [userGroupCounts, setUserGroupCounts] = useState<{ [userId: number]: number }>({});
    const [leaderGroupCounts, setLeaderGroupCounts] = useState<{ [userId: number]: number }>({});
    const [projects, setProjects] = useState<ProjectSelectOption[]>([]);
    const [memberIds, setMemberIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [memberSearchTerm, setMemberSearchTerm] = useState('');

    // Lọc thành viên thường theo search
    const filteredRegularEmployees = regularEmployees.filter(user =>
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
                    leaderId: String(editGroup.leaderId || editGroup.leader?.id || '')
                });
                const memberList = (editGroup.members || []).map((m: any) => m.id);
                setMemberIds(memberList);
                // Lấy danh sách projectIds từ editGroup nếu có
                const projectList = (editGroup.projects || []).map((p: any) => p.id);
                setSelectedProjectIds(projectList);
            } else {
                setFormData({ name: '', description: '', leaderId: '' });
                setMemberIds([]);
                setSelectedProjectIds([]);
            }
            setMessage('');
        }
    }, [isOpen, editGroup]);

    const loadPrerequisites = async () => {
        try {
            const [userData, projectRes, groupRes] = await Promise.all([
                getUsers({ page: 1, limit: 1000 }),
                api.get('/duan/getAll'),
                api.get('/groups')
            ]);
            setUsers(userData.users.map((u: any) => ({ id: u.id, hoten: u.hoten, manv: u.manv, chucvu: u.chucvu, role: u.role })));
            setTeamLeaders(userData.users.filter((u: any) => u.role?.name === 'teamleader').map((u: any) => ({ id: u.id, hoten: u.hoten, manv: u.manv, chucvu: u.chucvu, role: u.role })));
            setRegularEmployees(userData.users.filter((u: any) => u.role?.name === 'employee').map((u: any) => ({ id: u.id, hoten: u.hoten, manv: u.manv, chucvu: u.chucvu, role: u.role })));
            // Lọc chỉ dự án chua_bat_dau hoặc dang_chay
            setProjects((projectRes.data || []).filter((p: any) => p.status === 'chua_bat_dau' || p.status === 'dang_chay'));
            // Đếm số nhóm mỗi user đang tham gia (thành viên)
            const groupCounts: { [userId: number]: number } = {};
            // Đếm số nhóm mỗi user đang là leader
            const leaderCounts: { [userId: number]: number } = {};
            (groupRes.data.groups || []).forEach((g: any) => {
                (g.members || []).forEach((m: any) => {
                    groupCounts[m.id] = (groupCounts[m.id] || 0) + 1;
                });
                if (g.leaderId) {
                    leaderCounts[g.leaderId] = (leaderCounts[g.leaderId] || 0) + 1;
                }
            });
            setUserGroupCounts(groupCounts);
            setLeaderGroupCounts(leaderCounts);
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
        if (selectedProjectIds.length > 2) {
            showWarning('Chỉ được chọn tối đa 2 dự án đang chạy hoặc chuẩn bị!');
            return;
        }
        setLoading(true); setMessage('');
        try {
            if (editGroup) {
                await updateGroup(editGroup.id, {
                    name: formData.name,
                    description: formData.description,
                    leaderId: formData.leaderId ? Number(formData.leaderId) : undefined,
                    memberIds: memberIds,
                    projectIds: selectedProjectIds // Gửi projectIds khi update
                });
                showSuccess('Cập nhật nhóm thành công');
            } else {
                console.log("Creating group with data:", formData, "and members:", memberIds);
                await createGroup({
                    name: formData.name,
                    description: formData.description,
                    leaderId: formData.leaderId ? Number(formData.leaderId) : undefined,
                    memberIds: memberIds,
                    projectIds: selectedProjectIds
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
                            <label className="block text-sm font-medium mb-2">Dự án tham gia (tối đa 2, không bắt buộc)</label>
                            <MultiSelectProject options={projects} value={selectedProjectIds} onChange={setSelectedProjectIds} max={2} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Tên nhóm *</label>
                            <input name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập tên nhóm" required disabled={isClosed} />
                        </div>
                        {/* Đã bỏ chọn dự án khi tạo nhóm, chỉ tạo nhóm thuần */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Trưởng nhóm (Team Leader) *</label>
                            {/* Custom select để disable leader đã làm trưởng nhóm */}
                            <div className="relative w-full">
                                <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                                    onClick={() => setShowLeaderDropdown((v: any) => !v)}
                                    disabled={isClosed}
                                >
                                    <span className={formData.leaderId ? 'text-gray-900' : 'text-gray-500'}>
                                        {teamLeaders.find(l => String(l.id) === formData.leaderId)?.hoten || '-- Chọn trưởng nhóm --'}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </button>
                                {showLeaderDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {teamLeaders.map(l => {
                                            const isOver = (leaderGroupCounts[l.id] || 0) >= 1;
                                            return (
                                                <button
                                                    key={l.id}
                                                    type="button"
                                                    disabled={isOver}
                                                    onClick={() => {
                                                        if (!isOver) setFormData(prev => ({ ...prev, leaderId: String(l.id) }));
                                                        setShowLeaderDropdown(false);
                                                    }}
                                                    className={`w-full px-4 py-2 text-left text-sm ${isOver ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-50'}`}
                                                >
                                                    {l.hoten} {isOver && <span className="text-xs text-red-500">(Đã là trưởng nhóm)</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-yellow-600 mt-1">
                                ⚠️ Chỉ hiện nhân viên có vai trò trưởng nhóm (teamleader). Nhóm trưởng không thể tham gia nhóm khác.
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-2">Mô tả</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Mô tả ngắn về nhóm" disabled={isClosed} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-3">Thành viên (Nhân viên thường)</label>
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
                                {filteredRegularEmployees.length === 0 && memberSearchTerm && (
                                    <div className="text-sm text-gray-500 text-center py-4">Không tìm thấy thành viên nào</div>
                                )}
                                {filteredRegularEmployees.length === 0 && !memberSearchTerm && (
                                    <div className="text-sm text-gray-500 text-center py-4">Không có nhân viên thường</div>
                                )}
                                {filteredRegularEmployees.map(u => {
                                    const joinedGroups = userGroupCounts[u.id] || 0;
                                    const overLimit = joinedGroups >= 2;
                                    const disabled = overLimit || (!!formData.leaderId && Number(formData.leaderId) === u.id);
                                    const checked = memberIds.includes(u.id) || disabled;
                                    return (
                                        <label key={u.id} className={`flex items-center gap-3 text-sm cursor-pointer p-2 rounded-md hover:bg-gray-50 ${disabled ? 'opacity-60' : ''}`} title={overLimit ? 'Nhân viên đã tham gia 2 nhóm' : ''}>
                                            <input
                                                type="checkbox"
                                                disabled={disabled || isClosed}
                                                checked={checked}
                                                onChange={() => toggleMember(u.id)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-semibold text-indigo-700">
                                                        {mounted ? u.hoten.charAt(0).toUpperCase() : ''}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{u.hoten}</div>
                                                    <div className="text-xs text-gray-500">{u.manv}</div>
                                                    {overLimit && <div className="text-xs text-red-500">Đã tham gia 2 nhóm</div>}
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
                        <button type="submit" disabled={loading || isClosed} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50">
                            <Save className="w-4 h-4" /> {loading ? 'Đang lưu...' : isClosed ? 'Đã đóng nhóm' : 'Lưu'}
                        </button>
                        {!isClosed && editGroup && (
                            <button
                                type="button"
                                onClick={async () => {
                                    const confirmed = await showConfirm('Bạn có chắc chắn muốn đóng nhóm này?');
                                    if (confirmed) {
                                        try {
                                            await closeGroup(editGroup.id);
                                            showSuccess('Đã đóng nhóm thành công');
                                            onSuccess();
                                            onClose();
                                        } catch (e: any) {
                                            const errorMessage = e.response?.data?.message || e.message || 'Lỗi đóng nhóm';
                                            showError(errorMessage);
                                        }
                                    }
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                Đóng nhóm
                            </button>
                        )}
                    </div>
                    {isClosed && <div className="p-3 mt-2 rounded bg-yellow-100 text-yellow-800 text-sm">Nhóm đã đóng, không thể chỉnh sửa!</div>}
                </form>
            </div>
        </div>
    );
}

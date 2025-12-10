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
                        <span key={id} className="inline-flex items-center px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-800">
                            {p.tenduan}
                            <button type="button" className="ml-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400" onClick={() => onChange(value.filter(i => i !== id))}>&times;</button>
                        </span>
                    );
                })}
            </div>
            <button type="button" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left focus:ring-2 focus:ring-blue-500 flex items-center justify-between" onClick={() => setOpen(o => !o)}>
                <span className={value.length ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
                    {value.length ? `Đã chọn ${value.length} dự án` : 'Chọn dự án (tối đa 2)'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <input type="text" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    {filtered.length === 0 && <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Không có dự án</div>}
                    {filtered.map(p => (
                        <button key={p.id} type="button" disabled={value.length >= max && !value.includes(p.id)}
                            onClick={() => {
                                if (value.includes(p.id)) onChange(value.filter(i => i !== p.id));
                                else if (value.length < max) onChange([...value, p.id]);
                            }}
                            className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm ${value.includes(p.id) ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'} ${value.length >= max && !value.includes(p.id) ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {p.tenduan}
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${p.status === 'chua_bat_dau' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'}`}>{p.status === 'chua_bat_dau' ? 'Chuẩn bị' : 'Đang chạy'}</span>
                            {value.includes(p.id) && <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>}
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
                className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 flex items-center justify-between disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            >
                <span className={selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
                    {selectedOption ? selectedOption[displayKey] : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="w-full px-3 py-2 text-left text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                            >
                                {placeholder}
                            </button>
                        )}
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Không tìm thấy kết quả</div>
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
                                    className="w-full px-3 py-2 text-left text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm"
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
    const [availableMembers, setAvailableMembers] = useState<any[]>([]);
    const [unavailableMembers, setUnavailableMembers] = useState<any[]>([]);
    const [userGroupCounts, setUserGroupCounts] = useState<{ [userId: number]: number }>({});
    const [leaderGroupCounts, setLeaderGroupCounts] = useState<{ [userId: number]: number }>({});
    const [projects, setProjects] = useState<ProjectSelectOption[]>([]);
    const [memberIds, setMemberIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [memberSearchTerm, setMemberSearchTerm] = useState('');

    // Lọc thành viên theo search - bao gồm cả available và unavailable
    const filteredAvailableMembers = availableMembers.filter(user =>
        user.hoten.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        user.manv.toLowerCase().includes(memberSearchTerm.toLowerCase())
    );
    
    const filteredUnavailableMembers = unavailableMembers.filter(user =>
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
            const [userData, projectRes, groupRes, availableMembersRes] = await Promise.all([
                getUsers({ page: 1, limit: 1000 }),
                api.get('/duan/getAll'),
                api.get('/groups'),
                // Gọi API mới để lấy danh sách members available/unavailable
                groupAPI.getAvailableMembers(editGroup?.id)
            ]);
            
            setUsers(userData.users.map((u: any) => ({ id: u.id, hoten: u.hoten, manv: u.manv, chucvu: u.chucvu, role: u.role })));
            setTeamLeaders(userData.users.filter((u: any) => u.role?.name === 'teamleader').map((u: any) => ({ id: u.id, hoten: u.hoten, manv: u.manv, chucvu: u.chucvu, role: u.role })));
            setRegularEmployees(userData.users.filter((u: any) => u.role?.name === 'employee').map((u: any) => ({ id: u.id, hoten: u.hoten, manv: u.manv, chucvu: u.chucvu, role: u.role })));
            
            // Set available và unavailable members từ API
            const membersData = availableMembersRes.data;
            setAvailableMembers(membersData.availableUsers || []);
            setUnavailableMembers(membersData.unavailableUsers || []);
            
            // Lọc chỉ dự án chua_bat_dau hoặc dang_chay
            // Backend returns { success, data: [...], pagination: {...} }
            const projectsData = projectRes.data?.data && Array.isArray(projectRes.data.data) ? projectRes.data.data : (Array.isArray(projectRes.data) ? projectRes.data : []);
            setProjects(projectsData.filter((p: any) => p.status === 'chua_bat_dau' || p.status === 'dang_chay'));
            
            // Đếm số nhóm mỗi user đang tham gia (thành viên) - CHỈ ĐẾM NHÓM ACTIVE
            const groupCounts: { [userId: number]: number } = {};
            // Đếm số nhóm mỗi user đang là leader - CHỈ ĐẾM NHÓM ACTIVE
            const leaderCounts: { [userId: number]: number } = {};
            
            console.log('🔍 [GroupForm] Tất cả nhóm:', groupRes.data.groups);
            
            (groupRes.data.groups || []).forEach((g: any) => {
                console.log(`📋 Nhóm "${g.name}" (ID: ${g.id}) - Status: ${g.status || 'undefined'} - Leader ID: ${g.leaderId}`);
                
                // Chỉ đếm các nhóm KHÔNG phải closed (active hoặc không có status)
                if (g.status !== 'closed') {
                    console.log(`✅ Nhóm "${g.name}" ĐƯỢC ĐẾM (không phải closed)`);
                    (g.members || []).forEach((m: any) => {
                        groupCounts[m.id] = (groupCounts[m.id] || 0) + 1;
                    });
                    if (g.leaderId) {
                        leaderCounts[g.leaderId] = (leaderCounts[g.leaderId] || 0) + 1;
                    }
                } else {
                    console.log(`❌ Nhóm "${g.name}" BỊ BỎ QUA (status = closed)`);
                }
            });
            
            console.log('📊 [GroupForm] Số nhóm mỗi thành viên đang tham gia:', groupCounts);
            console.log('👔 [GroupForm] Số nhóm mỗi leader đang quản lý:', leaderCounts);
            console.log('✅ [GroupForm] Available members:', membersData.availableCount);
            console.log('❌ [GroupForm] Unavailable members:', membersData.unavailableCount);
            
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5" /> {editGroup ? 'Sửa nhóm' : 'Thêm nhóm mới'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dự án tham gia (tối đa 2, không bắt buộc)</label>
                            <MultiSelectProject options={projects} value={selectedProjectIds} onChange={setSelectedProjectIds} max={2} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tên nhóm *</label>
                            <input name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập tên nhóm" required disabled={isClosed} />
                        </div>
                        {/* Đã bỏ chọn dự án khi tạo nhóm, chỉ tạo nhóm thuần */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trưởng nhóm (Team Leader) *</label>
                            {/* Custom select để disable leader đã làm trưởng nhóm */}
                            <div className="relative w-full">
                                <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 flex items-center justify-between disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                    onClick={() => setShowLeaderDropdown((v: any) => !v)}
                                    disabled={isClosed}
                                >
                                    <span className={formData.leaderId ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
                                        {teamLeaders.find(l => String(l.id) === formData.leaderId)?.hoten || '-- Chọn trưởng nhóm --'}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                </button>
                                {showLeaderDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {teamLeaders.map(l => {
                                            const leaderCount = leaderGroupCounts[l.id] || 0;
                                            const isOver = leaderCount >= 1;
                                            console.log(`👤 Leader ${l.hoten} (ID: ${l.id}) - Số nhóm đang quản lý: ${leaderCount} - Bị disable: ${isOver}`);
                                            return (
                                                <button
                                                    key={l.id}
                                                    type="button"
                                                    disabled={isOver}
                                                    onClick={() => {
                                                        if (!isOver) {
                                                            console.log(`✅ Chọn leader: ${l.hoten} (ID: ${l.id})`);
                                                            setFormData(prev => ({ ...prev, leaderId: String(l.id) }));
                                                        }
                                                        setShowLeaderDropdown(false);
                                                    }}
                                                    className={`w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-gray-100 ${isOver ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-700' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                                                >
                                                    {l.hoten} ({leaderCount} nhóm) {isOver && <span className="text-xs text-red-500 dark:text-red-400 ml-2">❌ Đã là trưởng nhóm</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                ⚠️ Chỉ hiện nhân viên có vai trò trưởng nhóm (teamleader). Nhóm trưởng không thể tham gia nhóm khác.
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mô tả</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Mô tả ngắn về nhóm" disabled={isClosed} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Thành viên (Nhân viên thường)</label>
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                📋 <strong>Quy tắc nhóm:</strong>
                            </p>
                            <ul className="text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                                <li>• Nhân viên tối đa tham gia 2 nhóm</li>
                                <li>• Nhóm trưởng không thể là thành viên nhóm khác</li>
                                <li>• Một người chỉ có thể làm nhóm trưởng 1 nhóm</li>
                            </ul>
                        </div>
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
                            <div className="p-3 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm thành viên..."
                                        value={memberSearchTerm}
                                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="p-3 max-h-60 overflow-y-auto space-y-2 bg-white dark:bg-gray-800">
                                {/* Available Members */}
                                {filteredAvailableMembers.length === 0 && filteredUnavailableMembers.length === 0 && memberSearchTerm && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Không tìm thấy thành viên nào</div>
                                )}
                                {filteredAvailableMembers.length === 0 && filteredUnavailableMembers.length === 0 && !memberSearchTerm && (
                                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Không có nhân viên</div>
                                )}
                                
                                {/* Available Members - có thể chọn */}
                                {filteredAvailableMembers.map((u: any) => {
                                    const isCurrentMember = u.isCurrentMember;
                                    const checked = memberIds.includes(u.id) || isCurrentMember;
                                    return (
                                        <label key={u.id} className="flex items-center gap-3 text-sm cursor-pointer p-2 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10">
                                            <input
                                                type="checkbox"
                                                disabled={isClosed}
                                                checked={checked}
                                                onChange={() => toggleMember(u.id)}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                                                        {mounted ? u.hoten.charAt(0).toUpperCase() : ''}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{u.hoten}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{u.manv}</div>
                                                    {isCurrentMember && <div className="text-xs text-blue-600 dark:text-blue-400">✓ Thành viên hiện tại</div>}
                                                </div>
                                                <span className="text-xs px-2 py-1 bg-green-500 dark:bg-green-600 text-white rounded-full font-medium">Khả dụng</span>
                                            </div>
                                        </label>
                                    );
                                })}
                                
                                {/* Unavailable Members - không thể chọn */}
                                {filteredUnavailableMembers.map((u: any) => (
                                    <label key={u.id} className="flex items-center gap-3 text-sm p-2 rounded-md bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 opacity-60 cursor-not-allowed">
                                        <input
                                            type="checkbox"
                                            disabled={true}
                                            checked={false}
                                            className="w-4 h-4 text-gray-400 border-gray-300 rounded"
                                        />
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                    {mounted ? u.hoten.charAt(0).toUpperCase() : ''}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-700 dark:text-gray-300">{u.hoten}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{u.manv}</div>
                                                <div className="text-xs text-red-600 dark:text-red-400">{u.reason}</div>
                                            </div>
                                            <span className="text-xs px-2 py-1 bg-red-500 dark:bg-red-600 text-white rounded-full font-medium">Không khả dụng</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            {memberIds.length > 0 && (
                                <div className="p-3 border-t border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Đã chọn {memberIds.length} thành viên
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {memberIds.map(id => {
                                            const user = users.find(u => u.id === id);
                                            return user ? (
                                                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full border border-blue-200 dark:border-blue-800">
                                                    {user.hoten}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleMember(id)}
                                                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
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
                        <div className={`p-3 rounded-lg text-sm ${message.includes('thành công') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>{message}</div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">Hủy</button>
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
                    {isClosed && <div className="p-3 mt-2 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm">Nhóm đã đóng, không thể chỉnh sửa!</div>}
                </form>
            </div>
        </div>
    );
}
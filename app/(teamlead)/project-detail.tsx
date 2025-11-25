import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    FlatList,
    Linking,
    Modal,
    Alert,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchDocuments } from '@/src/axios/api';
import { API_CONFIG } from '@/src/config/api';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGroupDetail, getMyProjects, getMyTasks } from '@/src/axios/api';

interface ProjectDetailState {
    projectName: string;
    projectDescription?: string;
    projectStatus?: string;
    startDate?: string;
    endDate?: string;
    participationStatus?: 'active' | 'completed';
    pm?: { hoten: string; manv?: string; email?: string } | null;
    group?: {
        id: number;
        name: string;
        status?: string;
        members: Array<{ id: number; hoten: string; manv?: string; email?: string; chucvu?: string }>;
    } | null;
    tasks: Array<{ id: number; tentask: string; trangThai: string; doUuTien?: string }>;
}

const DEFAULT_STATE: ProjectDetailState = {
    projectName: 'Dự án',
    projectDescription: '',
    projectStatus: undefined,
    startDate: undefined,
    endDate: undefined,
    participationStatus: 'active',
    pm: null,
    group: null,
    tasks: []
};

const formatDate = (value?: string) => {
    if (!value) return 'Chưa rõ';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return 'Chưa rõ';
    return dt.toLocaleDateString('vi-VN');
};

const statusColor = (status?: string) => {
    switch (status) {
        case 'dang_chay':
        case 'Đang chạy':
            return '#2563eb';
        case 'hoan_thanh':
        case 'Hoàn thành':
            return '#16a34a';
        case 'tam_dung':
            return '#ea580c';
        default:
            return '#6b7280';
    }
};

    const translatePriority = (p?: string) => {
        if (!p) return 'Không rõ';
        const key = String(p).toLowerCase();
        if (key.includes('high') || key.includes('cao') || key.includes('khan')) return 'Cao';
        if (key.includes('medium') || key.includes('trung')) return 'Trung bình';
        if (key.includes('low') || key.includes('thap')) return 'Thấp';
        return p;
    };

    const priorityColor = (p?: string) => {
        const key = String(p || '').toLowerCase();
        if (key.includes('high') || key.includes('cao') || key.includes('khan')) return '#ef4444';
        if (key.includes('medium') || key.includes('trung')) return '#f59e0b';
        if (key.includes('low') || key.includes('thap')) return '#10b981';
        return '#9ca3af';
    };

type TabType = 'overview' | 'tasks' | 'documents';

export default function TeamLeadProjectDetailScreen() {
    const params = useLocalSearchParams<{ projectId?: string; groupId?: string }>();
    const projectId = Number(params.projectId);
    const groupId = Number(params.groupId);
    const router = useRouter();

    const [data, setData] = useState<ProjectDetailState>(DEFAULT_STATE);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [documents, setDocuments] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<any | null>(null);
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploading, setUploading] = useState(false);

    const loadDetail = async () => {
        if (!projectId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const [projectsResponse, tasksResponse, groupResponse] = await Promise.all([
                getMyProjects(),
                getMyTasks(),
                groupId ? getGroupDetail(groupId) : Promise.resolve(null)
            ]);

            const projectRecord = (projectsResponse || []).find((item: any) => {
                const id = item?.project?.id || item?.duanId || item?.id;
                return Number(id) === projectId;
            });

            const tasks = (tasksResponse?.tasks || tasksResponse || []).filter((task: any) => {
                const id = task.duan?.id || task.duanId;
                return Number(id) === projectId;
            });

            const normalized: ProjectDetailState = {
                projectName: projectRecord?.project?.tenduan || projectRecord?.tenduan || 'Dự án',
                projectDescription: projectRecord?.project?.mota,
                projectStatus: projectRecord?.project?.status,
                startDate: projectRecord?.project?.ngaybatdau,
                endDate: projectRecord?.project?.ngayketthuc,
                participationStatus: projectRecord?.status || 'active',
                pm: projectRecord?.project?.nguoiDamNhan || null,
                group: groupResponse
                    ? {
                        id: groupResponse.id,
                        name: groupResponse.name,
                        status: groupResponse.status,
                        members: groupResponse.members || []
                    }
                    : projectRecord?.Group
                        ? {
                            id: projectRecord.Group.id,
                            name: projectRecord.Group.name,
                            status: projectRecord.Group.status,
                            members: projectRecord.Group.members || []
                        }
                        : null,
                tasks: tasks.map((task: any) => ({
                    id: task.id,
                    tentask: task.tentask,
                    trangThai: task.trangThai,
                    doUuTien: task.mucDoUuTien || task.doUuTien
                }))
            };

            setData(normalized);
        } catch (error) {
            console.error('Load project detail error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, groupId]);

    const loadDocuments = async () => {
        if (!projectId) return;
        try {
            setLoadingDocs(true);
            const res: any = await fetchDocuments(Number(projectId));
            let docs = res;
            if (res && res.documents) docs = res.documents;
            if (!Array.isArray(docs)) docs = [];
            const transformed = docs.map((doc: any) => ({
                id: doc.id,
                tenTaiLieu: doc.tenTaiLieu || doc.originalname || doc.filename || doc.name,
                moTa: doc.moTa || doc.description || '',
                duongDan: doc.duongDan || doc.filename || doc.path || '',
                kichThuoc: doc.kichThuoc || doc.size || 0,
                loai: doc.loaiTaiLieu || doc.mimetype || 'application/octet-stream',
                createdAt: doc.createdAt,
                uploadedBy: doc.uploadedBy || doc.uploader || null,
            }));
            setDocuments(transformed);
        } catch (err) {
            console.error('Error loading documents for project', err);
            setDocuments([]);
        } finally {
            setLoadingDocs(false);
        }
    };

    const handlePickDocument = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
            // new API may return { type: 'success', uri, name, size } or { canceled, assets }
            if ((res as any).type === 'cancel') return;
            let picked: any = null;
            if ((res as any).type === 'success' && (res as any).uri) {
                picked = res;
            } else if ((res as any).assets && (res as any).assets.length > 0) {
                picked = (res as any).assets[0];
            }
            if (picked) setSelectedFile(picked);
        } catch (err) {
            console.error('Error picking document', err);
            Alert.alert('Lỗi', 'Không thể chọn tài liệu');
        }
    };

    const handleUploadDocument = async () => {
        if (!selectedFile) {
            Alert.alert('Thông báo', 'Vui lòng chọn tài liệu');
            return;
        }
        try {
            setUploading(true);
            const form = new FormData();
            form.append('file', {
                uri: selectedFile.uri,
                name: selectedFile.name || (selectedFile.uri || '').split('/').pop(),
                type: selectedFile.mimeType || selectedFile.type || 'application/octet-stream'
            } as any);
            if (uploadDescription) form.append('description', uploadDescription);
            if (projectId) form.append('duanId', String(projectId));

            const token = await AsyncStorage.getItem('accessToken');
            const res = await fetch(`${API_CONFIG.BASE_URL}/documents/upload`, {
                method: 'POST',
                headers: {
                    Authorization: token ? `Bearer ${token}` : undefined,
                } as any,
                body: form,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: 'Upload thất bại' }));
                throw new Error(err.message || `HTTP ${res.status}`);
            }

            Alert.alert('Thành công', 'Đã tải lên tài liệu');
            setShowUploadModal(false);
            setSelectedFile(null);
            setUploadDescription('');
            await loadDocuments();
        } catch (err: any) {
            console.error('Upload error', err);
            Alert.alert('Lỗi', err?.message || 'Không thể tải lên tài liệu');
        } finally {
            setUploading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDetail();
        setRefreshing(false);
    };

    const completedTasks = useMemo(() => data.tasks.filter(task => task.trangThai === 'Hoàn thành').length, [data.tasks]);

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Đang tải chi tiết dự án...</Text>
            </SafeAreaView>
        );
    }

    const renderHeader = () => (
        <>
            <View style={styles.card}>
                <Text style={styles.title}>{data.projectName}</Text>
                <View style={styles.badgeRow}>
                    {data.projectStatus && (
                        <View style={[styles.badge, { backgroundColor: '#ede9fe' }] }>
                            <Text style={[styles.badgeText, { color: statusColor(data.projectStatus) }]}>
                                {data.projectStatus}
                            </Text>
                        </View>
                    )}
                    {data.participationStatus && (
                        <View style={[styles.badge, { backgroundColor: '#dcfce7' }] }>
                            <Text style={[styles.badgeText, { color: '#15803d' }] }>
                                {data.participationStatus === 'completed' ? 'Đã hoàn thành' : 'Đang tham gia'}
                            </Text>
                        </View>
                    )}
                </View>
                {data.projectDescription && (
                    <Text style={styles.description}>{data.projectDescription}</Text>
                )}
                <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={18} color="#7c3aed" />
                    <Text style={styles.infoText}>
                        {formatDate(data.startDate)} - {formatDate(data.endDate)}
                    </Text>
                </View>
                {data.pm && (
                    <View style={styles.infoRow}>
                        <Ionicons name="person" size={18} color="#7c3aed" />
                        <Text style={styles.infoText}>
                            PM: {data.pm.hoten}
                            {data.pm.manv ? ` (${data.pm.manv})` : ''}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity style={[styles.tab, activeTab === 'overview' && styles.tabActive]} onPress={() => setActiveTab('overview')}>
                    <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Tổng quan</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'tasks' && styles.tabActive]} onPress={() => setActiveTab('tasks')}>
                    <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>Công việc ({data.tasks.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === 'documents' && styles.tabActive]} onPress={() => { setActiveTab('documents'); loadDocuments(); }}>
                    <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>Tài liệu</Text>
                </TouchableOpacity>
            </View>
            {activeTab === 'documents' && data.participationStatus !== 'completed' && (
                <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                    <TouchableOpacity style={styles.createButton} onPress={() => setShowUploadModal(true)}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>+ Tải lên tài liệu</Text>
                    </TouchableOpacity>
                </View>
            )}
        </>
    );

    const renderOverviewContent = () => (
        <>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Thống kê</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="list" size={20} color="#7c3aed" />
                        <Text style={styles.statValue}>{data.tasks.length}</Text>
                        <Text style={styles.statLabel}>Công việc</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="checkbox" size={20} color="#22c55e" />
                        <Text style={styles.statValue}>{completedTasks}</Text>
                        <Text style={styles.statLabel}>Hoàn thành</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="people" size={20} color="#22d3ee" />
                        <Text style={styles.statValue}>{data.group?.members?.length || 0}</Text>
                        <Text style={styles.statLabel}>Thành viên</Text>
                    </View>
                </View>
            </View>

            {data.group && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Nhóm tham gia</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="people" size={18} color="#7c3aed" />
                        <Text style={styles.infoText}>{data.group.name}</Text>
                    </View>
                    {data.group.members.map(member => (
                        <View key={member.id} style={styles.memberRow}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{member.hoten?.charAt(0) || 'M'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.memberName}>{member.hoten}</Text>
                                <View style={styles.metaRow}>
                                    {member.manv && <Text style={styles.metaText}>#{member.manv}</Text>}
                                    {member.chucvu && <Text style={styles.metaText}>• {member.chucvu}</Text>}
                                </View>
                                {member.email && <Text style={styles.metaText}>{member.email}</Text>}
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </>
    );

    // Upload modal UI (moved above return so it can be rendered)
    const UploadModal = () => (
        <Modal visible={showUploadModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Tải lên tài liệu</Text>
                    <TouchableOpacity style={[styles.createButton, { marginBottom: 12 }]} onPress={handlePickDocument}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Chọn tệp</Text>
                    </TouchableOpacity>
                    {selectedFile ? (
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontWeight: '700' }}>{selectedFile.name || (selectedFile.uri || '').split('/').pop()}</Text>
                            <Text style={{ color: '#6b7280', marginTop: 6 }}>{selectedFile.size ? `${(selectedFile.size/1024).toFixed(2)} KB` : ''}</Text>
                        </View>
                    ) : null}
                    <TextInput placeholder="Mô tả (tùy chọn)" value={uploadDescription} onChangeText={setUploadDescription} style={styles.input} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                        <TouchableOpacity style={[styles.createButton, { backgroundColor: '#9ca3af' }]} onPress={() => { setShowUploadModal(false); setSelectedFile(null); setUploadDescription(''); }}>
                            <Text style={{ color: '#fff', fontWeight: '700' }}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.createButton, { backgroundColor: '#10b981' }]} onPress={handleUploadDocument} disabled={uploading}>
                            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Tải lên</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            {activeTab === 'overview' ? (
                <ScrollView style={styles.scroll} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                    {renderHeader()}
                    {renderOverviewContent()}
                </ScrollView>
            ) : activeTab === 'tasks' ? (
                <FlatList
                    data={data.tasks}
                    keyExtractor={(item) => String(item.id)}
                    ListHeaderComponent={renderHeader}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.card, styles.taskCard, { margin: 16, marginTop: 8 }]}
                            activeOpacity={0.92}
                            onPress={() => router.push(`/(teamlead)/task-detail?id=${item.id}`)}
                        >
                            <View style={styles.taskCardHeader}>
                                <Text style={styles.taskTitle} numberOfLines={2}>{item.tentask}</Text>
                                <View style={[styles.statusPill, { backgroundColor: `${statusColor(item.trangThai)}22` }]}>
                                    <Text style={[styles.statusPillText, { color: statusColor(item.trangThai) }]} numberOfLines={1}>{item.trangThai}</Text>
                                </View>
                            </View>

                            <View style={styles.taskMetaRow}>
                                <View style={[styles.priorityPill, { backgroundColor: priorityColor(item.doUuTien) }]}> 
                                    <Text style={styles.priorityText}>{translatePriority(item.doUuTien)}</Text>
                                </View>
                                <Text style={styles.taskMeta}>{item.trangThai}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    contentContainerStyle={{ paddingBottom: 32 }}
                />
            ) : (
                <FlatList
                    data={documents}
                    keyExtractor={(item) => String(item.id)}
                    ListHeaderComponent={renderHeader}
                    renderItem={({ item }) => (
                        <View style={styles.documentCard}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.documentTitle} numberOfLines={2}>{item.tenTaiLieu}</Text>
                                {item.uploadedBy && <Text style={styles.documentMeta}>{item.uploadedBy.hoten || item.uploadedBy}</Text>}
                                {item.kichThuoc ? <Text style={styles.documentMeta}>{(item.kichThuoc/1024).toFixed(2)} KB</Text> : null}
                            </View>
                            <View style={styles.documentActions}>
                                <TouchableOpacity style={[styles.smallButton, { backgroundColor: '#2563eb' }]} onPress={() => Linking.openURL(`${API_CONFIG.BASE_URL}/documents/${item.id}/download?download=1`)}>
                                    <Text style={styles.smallButtonText}>Tải xuống</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            )}
            <UploadModal />
        </SafeAreaView>
    );

    
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    center: {
        flex: 1,
        backgroundColor: '#f5f5ff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280'
    },
    scroll: {
        flex: 1
    },
    content: {
        padding: 16,
        paddingBottom: 32
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ede9fe',
        padding: 18,
        marginBottom: 18
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1f2937'
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#312e81',
        marginBottom: 14
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12
    },
    badge: {
        borderRadius: 999,
        paddingVertical: 4,
        paddingHorizontal: 10
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600'
    },
    description: {
        color: '#4b5563',
        lineHeight: 20,
        marginTop: 12
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 10
    },
    infoText: {
        color: '#4b5563',
        fontSize: 14,
        flex: 1
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12
    },
    statCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ede9fe',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center'
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 8,
        color: '#1f2937'
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 16,
        backgroundColor: '#f3e8ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
    },
    avatarText: {
        color: '#7c3aed',
        fontWeight: '700',
        fontSize: 18
    },
    memberName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937'
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2
    },
    metaText: {
        fontSize: 12,
        color: '#6b7280'
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 24
    },
    emptyText: {
        color: '#6b7280',
        marginTop: 8
    },
    taskRow: {
        borderWidth: 1,
        borderColor: '#ede9fe',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5
    },
    taskTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1f2937'
    },
    taskMeta: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2
    }
    ,
    taskCard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        paddingVertical: 14
    },
    taskCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999
    },
    statusPillText: {
        fontSize: 12,
        fontWeight: '700'
    },
    taskMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 10
    },
    priorityPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12
    },
    priorityText: {
        color: '#fff',
        fontWeight: '700'
    },
    taskDesc: {
        color: '#6b7280',
        marginTop: 6
    },
    documentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginVertical: 8,
        marginHorizontal: 12,
        borderWidth: 1,
        borderColor: '#eef2ff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    documentTitle: {
        fontWeight: '700',
        fontSize: 15,
        color: '#111827'
    },
    documentMeta: {
        color: '#6b7280',
        marginTop: 6,
        fontSize: 13
    },
    documentActions: {
        flexDirection: 'column',
        gap: 8,
        marginLeft: 12,
        alignItems: 'flex-end'
    },
    smallButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    smallButtonText: {
        color: '#fff',
        fontWeight: '700'
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 8
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    tabActive: {
        backgroundColor: '#7c3aed',
    },
    tabText: {
        color: '#374151',
        fontWeight: '700'
    },
    tabTextActive: {
        color: '#fff'
    },
    createButton: {
        backgroundColor: '#7c3aed',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignItems: 'center'
    },
    docRow: {
        borderWidth: 1,
        borderColor: '#ede9fe',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12
    }
    ,
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 8,
        marginBottom: 8
    }
});

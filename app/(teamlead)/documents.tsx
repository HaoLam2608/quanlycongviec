import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getGroupDocuments } from '@/src/axios/api';
import { API_CONFIG, STORAGE_KEYS } from '@/src/config/api';

interface DocumentItem {
    id: number;
    tenTaiLieu: string;
    moTa?: string;
    loaiTaiLieu?: string;
    kichThuoc?: number;
    createdAt?: string;
    project?: { id: number; tenduan?: string } | null;
    uploadedBy?: { hoten: string };
}

const typeLabel = (type?: string) => {
    if (!type) return 'Khác';
    if (type.includes('image')) return 'Ảnh';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('sheet') || type.includes('excel') || type.includes('spreadsheet')) return 'Bảng tính';
    if (type.includes('word') || type.includes('doc')) return 'Tài liệu';
    if (type.includes('zip') || type.includes('rar')) return 'Nén';
    return type.split('/')[1] || type;
};

const formatSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value?: string) => {
    if (!value) return 'Chưa rõ';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return 'Chưa rõ';
    return dt.toLocaleDateString('vi-VN');
};

export default function TeamLeadDocumentsScreen() {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedProject, setSelectedProject] = useState<number | 'all'>('all');
    const [selectedType, setSelectedType] = useState<string | 'all'>('all');

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const data = await getGroupDocuments();
            const list = data?.documents || data || [];
            const normalized: DocumentItem[] = list.map((doc: any) => ({
                id: doc.id,
                tenTaiLieu: doc.tenTaiLieu || doc.originalname || doc.filename || 'Tài liệu',
                moTa: doc.moTa || doc.description,
                loaiTaiLieu: doc.loaiTaiLieu || doc.mimetype,
                kichThuoc: doc.kichThuoc || doc.size,
                createdAt: doc.createdAt,
                project: doc.project || doc.duan || null,
                uploadedBy: doc.uploadedBy || doc.uploader
            }));
            setDocuments(normalized);
        } catch (error) {
            console.error('Load documents error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    const projects = useMemo(() => {
        const map = new Map<number, { id: number; tenduan?: string }>();
        documents.forEach(doc => {
            if (doc.project?.id && !map.has(doc.project.id)) {
                map.set(doc.project.id, { id: doc.project.id, tenduan: doc.project.tenduan });
            }
        });
        return Array.from(map.values());
    }, [documents]);

    const types = useMemo(() => {
        const unique = new Set<string>();
        documents.forEach(doc => {
            if (doc.loaiTaiLieu) unique.add(typeLabel(doc.loaiTaiLieu));
        });
        return Array.from(unique.values());
    }, [documents]);

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = !search
                || doc.tenTaiLieu.toLowerCase().includes(search.toLowerCase())
                || doc.moTa?.toLowerCase().includes(search.toLowerCase());
            const matchesProject = selectedProject === 'all'
                || doc.project?.id === selectedProject;
            const docTypeLabel = typeLabel(doc.loaiTaiLieu);
            const matchesType = selectedType === 'all' || docTypeLabel === selectedType;
            return matchesSearch && matchesProject && matchesType;
        });
    }, [documents, search, selectedProject, selectedType]);

    const handleDownload = async (doc: DocumentItem) => {
        try {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
            const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
            if (!baseDir) {
                Alert.alert('Lỗi', 'Không thể xác định thư mục lưu trữ trên thiết bị');
                return;
            }
            const fileUri = `${baseDir}${doc.tenTaiLieu || 'document'}`;
            const downloadRes = await FileSystem.downloadAsync(
                `${API_CONFIG.BASE_URL}/documents/${doc.id}/download?download=1`,
                fileUri,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined
                }
            );

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadRes.uri);
            } else {
                Alert.alert('Đã tải xuống', `Tệp được lưu tại ${downloadRes.uri}`);
            }
        } catch (error: any) {
            console.error('Download document error:', error);
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tải tài liệu');
        }
    };

    const renderItem = ({ item }: { item: DocumentItem }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.tenTaiLieu}</Text>
                <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{typeLabel(item.loaiTaiLieu)}</Text>
                </View>
            </View>
            {item.moTa && <Text style={styles.cardDescription} numberOfLines={2}>{item.moTa}</Text>}
            <View style={styles.metaRow}>
                <Ionicons name="save" size={14} color="#7c3aed" />
                <Text style={styles.metaText}>{formatSize(item.kichThuoc)}</Text>
            </View>
            <View style={styles.metaRow}>
                <Ionicons name="calendar" size={14} color="#7c3aed" />
                <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
            </View>
            {item.project?.tenduan && (
                <View style={styles.metaRow}>
                    <Ionicons name="folder-open" size={14} color="#7c3aed" />
                    <Text style={styles.metaText}>{item.project.tenduan}</Text>
                </View>
            )}
            {item.uploadedBy?.hoten && (
                <View style={styles.metaRow}>
                    <Ionicons name="person" size={14} color="#7c3aed" />
                    <Text style={styles.metaText}>{item.uploadedBy.hoten}</Text>
                </View>
            )}
            <TouchableOpacity style={styles.downloadButton} onPress={() => handleDownload(item)}>
                <Ionicons name="download" size={18} color="#fff" />
                <Text style={styles.downloadText}>Tải xuống</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tài liệu của nhóm</Text>
                <Text style={styles.headerSubtitle}>Quản lý tài liệu theo dự án, loại file</Text>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm tài liệu..."
                    placeholderTextColor="#9ca3af"
                    value={search}
                    onChangeText={setSearch}
                />
                {search ? (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                ) : null}
            </View>

            <View style={styles.filterRow}>
                <TouchableOpacity
                    style={[styles.filterChip, selectedProject === 'all' && styles.filterChipActive]}
                    onPress={() => setSelectedProject('all')}
                >
                    <Text style={[styles.filterText, selectedProject === 'all' && styles.filterTextActive]}>Tất cả dự án</Text>
                </TouchableOpacity>
                {projects.map(project => (
                    <TouchableOpacity
                        key={project.id}
                        style={[styles.filterChip, selectedProject === project.id && styles.filterChipActive]}
                        onPress={() => setSelectedProject(project.id)}
                    >
                        <Text style={[styles.filterText, selectedProject === project.id && styles.filterTextActive]}>
                            {project.tenduan || `Dự án #${project.id}`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {types.length > 0 && (
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterChip, selectedType === 'all' && styles.filterChipActive]}
                        onPress={() => setSelectedType('all')}
                    >
                        <Text style={[styles.filterText, selectedType === 'all' && styles.filterTextActive]}>Tất cả loại</Text>
                    </TouchableOpacity>
                    {types.map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.filterChip, selectedType === type && styles.filterChipActive]}
                            onPress={() => setSelectedType(type)}
                        >
                            <Text style={[styles.filterText, selectedType === type && styles.filterTextActive]}>{type}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                    <Text style={styles.loadingText}>Đang tải tài liệu...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredDocuments}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={48} color="#c4b5fd" />
                            <Text style={styles.emptyText}>Chưa có tài liệu phù hợp</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5ff'
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 18
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#312e81'
    },
    headerSubtitle: {
        marginTop: 4,
        color: '#6b7280'
    },
    searchContainer: {
        margin: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#ede9fe'
    },
    searchInput: {
        flex: 1,
        height: 44,
        color: '#111827'
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingHorizontal: 16
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#ede9fe'
    },
    filterChipActive: {
        backgroundColor: '#7c3aed'
    },
    filterText: {
        color: '#5b21b6',
        fontWeight: '600'
    },
    filterTextActive: {
        color: '#fff'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: '#6b7280'
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 32
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#ede9fe',
        padding: 18,
        marginBottom: 16
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        flex: 1
    },
    typeBadge: {
        backgroundColor: '#f3e8ff',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4
    },
    typeBadgeText: {
        color: '#7c3aed',
        fontWeight: '600',
        fontSize: 12
    },
    cardDescription: {
        color: '#4b5563',
        marginTop: 8,
        lineHeight: 20
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8
    },
    metaText: {
        color: '#4b5563',
        fontSize: 13
    },
    downloadButton: {
        marginTop: 16,
        backgroundColor: '#7c3aed',
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    downloadText: {
        color: '#fff',
        fontWeight: '600'
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 32
    },
    emptyText: {
        marginTop: 12,
        color: '#6b7280'
    }
});

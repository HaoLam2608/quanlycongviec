import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import api from '../../src/axios/config';

interface Document {
    id: number;
    tenTaiLieu: string;
    moTa?: string;
    loai: string;
    duongDan: string;
    duanId?: number;
    taskId?: number;
    nguoiTaoId: number;
    createdAt: string;
    updatedAt: string;
    nguoiTao?: {
        id: number;
        hoten: string;
    };
    duan?: {
        id: number;
        tenduan: string;
    };
}

export default function DocumentsManagement() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('all');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

    useEffect(() => {
        loadDocuments();
    }, []);

    useEffect(() => {
        filterDocuments();
    }, [documents, searchQuery, selectedType]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/documents/list');
            const docs = response.data?.documents || response.data || [];
            setDocuments(docs);
        } catch (error) {
            console.error('Error loading documents:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách tài liệu');
        } finally {
            setLoading(false);
        }
    };

    const filterDocuments = () => {
        let filtered = [...documents];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(doc => 
                doc.tenTaiLieu.toLowerCase().includes(query) ||
                doc.moTa?.toLowerCase().includes(query) ||
                doc.loai?.toLowerCase().includes(query)
            );
        }

        // Filter by type
        if (selectedType !== 'all') {
            filtered = filtered.filter(doc => doc.loai === selectedType);
        }

        setFilteredDocuments(filtered);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDocuments();
        setRefreshing(false);
    };

    const handleDeleteDocument = async () => {
        if (!selectedDocument) return;

        try {
            await api.delete(`/documents/${selectedDocument.id}`);
            Alert.alert('Thành công', 'Xóa tài liệu thành công');
            setShowDeleteModal(false);
            setSelectedDocument(null);
            loadDocuments();
        } catch (error: any) {
            console.error('Error deleting document:', error);
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa tài liệu');
        }
    };

    const getFileIcon = (type: string) => {
        const lowerType = type?.toLowerCase() || '';
        if (lowerType.includes('pdf')) return 'document-text';
        if (lowerType.includes('image') || lowerType.includes('jpg') || lowerType.includes('png')) return 'image';
        if (lowerType.includes('word') || lowerType.includes('doc')) return 'document';
        if (lowerType.includes('excel') || lowerType.includes('xls')) return 'stats-chart';
        if (lowerType.includes('video')) return 'videocam';
        return 'document-attach';
    };

    const getFileColor = (type: string) => {
        const lowerType = type?.toLowerCase() || '';
        if (lowerType.includes('pdf')) return '#ef4444';
        if (lowerType.includes('image')) return '#8b5cf6';
        if (lowerType.includes('word')) return '#3b82f6';
        if (lowerType.includes('excel')) return '#10b981';
        if (lowerType.includes('video')) return '#f59e0b';
        return '#6b7280';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getUniqueTypes = () => {
        const types = new Set(documents.map(doc => doc.loai).filter(Boolean));
        return Array.from(types);
    };

    const renderDocument = ({ item }: { item: Document }) => {
        const color = getFileColor(item.loai);
        
        return (
            <View style={styles.documentCard}>
                <View style={[styles.documentIcon, { backgroundColor: color + '20' }]}>
                    <Ionicons name={getFileIcon(item.loai) as any} size={28} color={color} />
                </View>
                
                <View style={styles.documentContent}>
                    <Text style={styles.documentTitle} numberOfLines={2}>{item.tenTaiLieu}</Text>
                    
                    {item.moTa && (
                        <Text style={styles.documentDesc} numberOfLines={2}>{item.moTa}</Text>
                    )}
                    
                    <View style={styles.documentMeta}>
                        <View style={styles.metaItem}>
                            <Ionicons name="folder" size={14} color="#6b7280" />
                            <Text style={styles.metaText}>
                                {item.loai || 'Không rõ'}
                            </Text>
                        </View>
                        
                        {item.nguoiTao && (
                            <View style={styles.metaItem}>
                                <Ionicons name="person" size={14} color="#6b7280" />
                                <Text style={styles.metaText}>{item.nguoiTao.hoten}</Text>
                            </View>
                        )}
                        
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar" size={14} color="#6b7280" />
                            <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
                        </View>
                    </View>

                    {item.duan && (
                        <View style={styles.projectTag}>
                            <Text style={styles.projectTagText}>📁 {item.duan.tenduan}</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                        setSelectedDocument(item);
                        setShowDeleteModal(true);
                    }}
                >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Quản lý tài liệu</Text>
                <Text style={styles.subtitle}>
                    {filteredDocuments.length} tài liệu
                </Text>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchSection}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#9ca3af" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm tài liệu..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Type Filter Pills */}
                <View style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.pill, selectedType === 'all' && styles.pillActive]}
                        onPress={() => setSelectedType('all')}
                    >
                        <Text style={[styles.pillText, selectedType === 'all' && styles.pillTextActive]}>
                            Tất cả
                        </Text>
                    </TouchableOpacity>
                    
                    {getUniqueTypes().map(type => (
                        <TouchableOpacity
                            key={type}
                            style={[styles.pill, selectedType === type && styles.pillActive]}
                            onPress={() => setSelectedType(type)}
                        >
                            <Text style={[styles.pillText, selectedType === type && styles.pillTextActive]}>
                                {type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Documents List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#06b6d4" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : filteredDocuments.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-outline" size={64} color="#d1d5db" />
                    <Text style={styles.emptyText}>
                        {searchQuery || selectedType !== 'all' 
                            ? 'Không tìm thấy tài liệu'
                            : 'Chưa có tài liệu nào'
                        }
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredDocuments}
                    renderItem={renderDocument}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="warning" size={48} color="#ef4444" />
                        </View>
                        
                        <Text style={styles.modalTitle}>Xác nhận xóa</Text>
                        <Text style={styles.modalMessage}>
                            Bạn có chắc chắn muốn xóa tài liệu "{selectedDocument?.tenTaiLieu}"?
                            {'\n\n'}Hành động này không thể hoàn tác.
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowDeleteModal(false);
                                    setSelectedDocument(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteConfirmButton]}
                                onPress={handleDeleteDocument}
                            >
                                <Text style={styles.deleteButtonText}>Xóa</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    searchSection: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: '#111827',
    },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
    },
    pillActive: {
        backgroundColor: '#06b6d4',
    },
    pillText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },
    pillTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
    },
    documentCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    documentIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    documentContent: {
        flex: 1,
    },
    documentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    documentDesc: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    documentMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#6b7280',
    },
    projectTag: {
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#dbeafe',
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    projectTagText: {
        fontSize: 12,
        color: '#1e40af',
        fontWeight: '500',
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fee2e2',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6b7280',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
        marginTop: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 400,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    deleteConfirmButton: {
        backgroundColor: '#ef4444',
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

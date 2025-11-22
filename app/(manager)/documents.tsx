import { deleteDocument, fetchDocuments, fetchProjectsByManager, getGroupDocuments, getMyProjects } from '@/src/axios/api';
import { API_CONFIG } from '@/src/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { PageHeader } from '../../components/ui/PageHeader';

interface Document {
    id: number;
    tenTaiLieu: string;
    moTa: string;
    duongDan: string;
    kichThuoc: number;
    loaiTaiLieu: string;
    createdAt: string;
    uploadedBy?: {
        id: number;
        hoten: string;
        manv: string;
    };
    project?: {
        id: number;
        tenduan: string;
    };
}

interface Project {
    id: number;
    tenduan: string;
}

export default function Documents() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [uploadModal, setUploadModal] = useState(false);
    const [projectModal, setProjectModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploadProjectId, setUploadProjectId] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterDocuments();
    }, [searchQuery, selectedProjectId, documents]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Lấy userId từ storage
            const userDataStr = await AsyncStorage.getItem('user');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            const userId = userData?.id;
            
            console.log('👤 Current user ID:', userId);
            
            // Load documents và projects song song
            const projectsPromise = userId 
                ? fetchProjectsByManager(userId).catch((err) => {
                    console.error('❌ Error loading user projects:', err);
                    // Fallback to group projects
                    return getMyProjects().catch(() => ({ projects: [], activeProjects: [], completedProjects: [] }));
                  })
                : getMyProjects().catch(() => ({ projects: [], activeProjects: [], completedProjects: [] }));
            
            // Thử load tất cả documents trước, nếu không được thì fallback về group documents
            const docsPromise = fetchDocuments()
                .catch((err) => {
                    console.error('❌ Error loading all documents, trying group documents:', err);
                    return getGroupDocuments().then(res => res.documents || res);
                })
                .catch((err) => {
                    console.error('❌ Error loading group documents:', err);
                    return [];
                });
            
            const [docsResponse, projectsData] = await Promise.all([
                docsPromise,
                projectsPromise
            ]);
            
            console.log('📄 Documents response:', docsResponse);
            console.log('📁 Projects response:', projectsData);
            
            // Xử lý documents - có thể là array trực tiếp hoặc { documents: [...] }
            let docsData = [];
            if (Array.isArray(docsResponse)) {
                docsData = docsResponse;
            } else if (docsResponse && docsResponse.documents) {
                docsData = docsResponse.documents;
            } else if (docsResponse) {
                docsData = [docsResponse];
            }
            
            console.log('📄 Documents data:', docsData.length, 'documents');
            console.log('📄 First document sample:', docsData[0]);
            
            // Normalize document data
            const normalizedDocs = docsData.map((doc: any) => ({
                id: doc.id,
                tenTaiLieu: doc.tenTaiLieu || doc.originalname || doc.filename || 'Không có tên',
                moTa: doc.moTa || doc.description || '',
                duongDan: doc.duongDan || doc.filename || '',
                kichThuoc: doc.kichThuoc || doc.size || 0,
                loaiTaiLieu: doc.loaiTaiLieu || doc.mimetype || 'application/octet-stream',
                createdAt: doc.createdAt,
                uploadedBy: doc.uploadedBy || doc.uploader,
                project: doc.project || doc.duan || null
            }));
            
            console.log('📄 Normalized first document:', normalizedDocs[0]);
            
            setDocuments(normalizedDocs);
            
            // Lấy danh sách projects
            const projectMap = new Map<number, Project>();
            
            // Xử lý nếu projectsData là array (từ fetchProjectsByManager)
            if (Array.isArray(projectsData)) {
                console.log('📁 Processing array of projects:', projectsData.length);
                projectsData.forEach((project: any) => {
                    if (project?.id) {
                        projectMap.set(project.id, {
                            id: project.id,
                            tenduan: project.tenduan || project.name || `Dự án #${project.id}`
                        });
                    }
                });
            } 
            // Xử lý nếu projectsData là object (từ getMyProjects)
            else if (projectsData && typeof projectsData === 'object') {
                const allProjects = [
                    ...(projectsData.projects || []),
                    ...(projectsData.activeProjects || []),
                    ...(projectsData.completedProjects || [])
                ];
                
                console.log('📁 Processing object projects:', allProjects.length);
                
                allProjects.forEach((item: any) => {
                    const project = item.project || item.duan || item;
                    if (project?.id && !projectMap.has(project.id)) {
                        projectMap.set(project.id, {
                            id: project.id,
                            tenduan: project.tenduan || project.name || `Dự án #${project.id}`
                        });
                    }
                });
            }
            
            // Thêm projects từ documents (nếu có documents chứa project info)
            docsData.forEach((doc: any) => {
                if (doc.project?.id && !projectMap.has(doc.project.id)) {
                    projectMap.set(doc.project.id, {
                        id: doc.project.id,
                        tenduan: doc.project.tenduan || `Dự án #${doc.project.id}`
                    });
                }
            });
            
            const projectsList = Array.from(projectMap.values());
            console.log('📁 Total projects:', projectsList.length);
            console.log('📁 Projects list:', projectsList);
            setProjects(projectsList);
            
            // Debug alert - chỉ hiển thị khi không có projects
            if (projectsList.length === 0) {
                Alert.alert(
                    'Thông báo',
                    'Bạn chưa có dự án nào để upload tài liệu.\n\nVui lòng tạo dự án mới hoặc được gán vào dự án.',
                    [{ text: 'OK' }]
                );
            }
            
        } catch (error: any) {
            console.error('❌ Load documents error:', error);
            Alert.alert('Lỗi', error.message || 'Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const filterDocuments = () => {
        let filtered = documents;
        
        console.log('🔍 Filtering documents:', {
            totalDocs: documents.length,
            searchQuery,
            selectedProjectId
        });

        if (searchQuery) {
            filtered = filtered.filter(doc =>
                doc.tenTaiLieu?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.moTa?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            console.log('🔍 After search filter:', filtered.length);
        }

        if (selectedProjectId) {
            filtered = filtered.filter(doc => {
                console.log('🔍 Doc project:', doc.project?.id, 'Selected:', selectedProjectId);
                return doc.project?.id === selectedProjectId;
            });
            console.log('🔍 After project filter:', filtered.length);
        }

        console.log('🔍 Final filtered documents:', filtered.length);
        setFilteredDocuments(filtered);
    };

    const handleSelectFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setSelectedFile(file);
            }
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể chọn file');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            Alert.alert('Lỗi', 'Vui lòng chọn file');
            return;
        }
        // Kiểm tra kích thước file (giống admin): giới hạn 5MB
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (selectedFile.size && selectedFile.size > MAX_SIZE) {
            const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
            Alert.alert(
                'File quá lớn',
                `File của bạn: ${sizeMB}MB\nKích thước tối đa: 5MB\n\nVui lòng chọn file nhỏ hơn.`
            );
            return;
        }

        try {
            setUploading(true);
            console.log('📤 Starting upload:', selectedFile);

            const formData = new FormData();
            // React Native FormData
            formData.append('file', {
                uri: selectedFile.uri,
                type: selectedFile.mimeType || 'application/octet-stream',
                name: selectedFile.name,
            } as any);

            if (uploadProjectId) {
                formData.append('duanId', String(uploadProjectId));
                console.log('📁 Uploading to project:', uploadProjectId);
            }
            if (uploadDescription) {
                formData.append('description', uploadDescription);
            }

            const token = await AsyncStorage.getItem('accessToken');
            console.log('🔑 Token exists:', !!token);

            const response = await fetch(`${API_CONFIG.BASE_URL}/documents/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // KHÔNG set Content-Type - let boundary be set automatically
                },
                body: formData,
            });

            console.log('📥 Upload response status:', response.status);

            if (!response.ok) {
                // Try parse JSON error body when possible
                let errorText = `HTTP ${response.status}`;
                try {
                    const errJson = await response.json();
                    errorText = errJson.message || JSON.stringify(errJson);
                } catch (e) {
                    try { errorText = await response.text(); } catch (e) { /* ignore */ }
                }
                console.error('❌ Upload error:', errorText);
                throw new Error(errorText);
            }

            const data = await response.json().catch(() => null);
            console.log('✅ Upload success:', data);
            Alert.alert('Thành công', 'Tải lên tài liệu thành công');
            setUploadModal(false);
            setSelectedFile(null);
            setUploadDescription('');
            setUploadProjectId(null);
            await loadData();
        } catch (error: any) {
            console.error('❌ Upload error:', error);
            Alert.alert('Lỗi', error.message || 'Không thể tải lên tài liệu');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (doc: Document) => {
        try {
            console.log('⬇️ Downloading document:', doc.id, doc.tenTaiLieu);
            const token = await AsyncStorage.getItem('accessToken');
            const url = `${API_CONFIG.BASE_URL}/documents/${doc.id}/download?download=1`;
            
            console.log('🔗 Download URL:', url);
            
            // @ts-ignore - FileSystem.documentDirectory exists at runtime
            const fileUri = `${FileSystem.documentDirectory}${doc.tenTaiLieu}`;
            
            const downloadResumable = FileSystem.createDownloadResumable(
                url,
                fileUri,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const result = await downloadResumable.downloadAsync();
            if (result) {
                console.log('✅ Download complete:', result.uri);
                Alert.alert(
                    'Tải xuống thành công',
                    `File đã được lưu vào: ${result.uri}`,
                    [
                        { text: 'OK' },
                        {
                            text: 'Mở file',
                            onPress: () => {
                                if (Platform.OS === 'ios') {
                                    Linking.openURL(result.uri);
                                } else {
                                    // Android cần content:// URI
                                    FileSystem.getContentUriAsync(result.uri).then(contentUri => {
                                        Linking.openURL(contentUri);
                                    });
                                }
                            }
                        }
                    ]
                );
            }
        } catch (error: any) {
            console.error('❌ Download error:', error);
            Alert.alert('Lỗi', error.message || 'Không thể tải xuống tài liệu');
        }
    };

    const handleDelete = (doc: Document) => {
        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc muốn xóa tài liệu "${doc.tenTaiLieu}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDocument(doc.id);
                            Alert.alert('Thành công', 'Đã xóa tài liệu');
                            await loadData();
                        } catch (error: any) {
                            Alert.alert('Lỗi', error.message || 'Không thể xóa tài liệu');
                        }
                    }
                }
            ]
        );
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileIcon = (mimeType: string) => {
        if (!mimeType) return '📎';
        const type = mimeType.toLowerCase();
        if (type.includes('pdf')) return '📄';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
        if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
        if (type.includes('image')) return '🖼️';
        if (type.includes('video')) return '🎥';
        if (type.includes('audio')) return '🎵';
        if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) return '📦';
        return '📎';
    };

    const renderDocument = ({ item }: { item: Document }) => (
        <View style={styles.documentCard}>
            <View style={styles.documentHeader}>
                <View style={styles.iconContainer}>
                    <Text style={styles.fileIcon}>{getFileIcon(item.loaiTaiLieu)}</Text>
                </View>
                <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={2}>{item.tenTaiLieu}</Text>
                    <Text style={styles.documentSize}>{formatFileSize(item.kichThuoc)}</Text>
                    {item.moTa && <Text style={styles.documentDesc} numberOfLines={2}>{item.moTa}</Text>}
                </View>
            </View>

            {item.project && (
                <View style={styles.projectBadge}>
                    <Text style={styles.projectBadgeText}>📁 {item.project.tenduan}</Text>
                </View>
            )}

            <View style={styles.documentFooter}>
                <View style={styles.uploaderInfo}>
                    <Text style={styles.uploaderText}>
                        👤 {item.uploadedBy?.hoten || 'Không rõ'}
                    </Text>
                    <Text style={styles.dateText}>
                        🕒 {formatDate(item.createdAt)}
                    </Text>
                </View>
            </View>

            <View style={styles.documentActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.downloadButton]}
                    onPress={() => handleDownload(item)}
                >
                    <Text style={styles.actionButtonText}>⬇️ Tải xuống</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDelete(item)}
                >
                    <Text style={styles.actionButtonText}>🗑️ Xóa</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title="Quản lý tài liệu" />

            <View style={styles.filterContainer}>
                {/* Search */}
                <View style={styles.searchContainer}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm tài liệu..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Text style={styles.clearIcon}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Project Filter */}
                <TouchableOpacity
                    style={styles.projectFilterButton}
                    onPress={() => setProjectModal(true)}
                >
                    <Text style={styles.projectFilterText}>
                        📁 {selectedProjectId
                            ? projects.find(p => p.id === selectedProjectId)?.tenduan || 'Tất cả dự án'
                            : 'Tất cả dự án'}
                    </Text>
                    <Text style={styles.dropdownIcon}>▼</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                    📊 Tổng: {filteredDocuments.length} tài liệu
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredDocuments}
                    renderItem={renderDocument}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#f59e0b']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>Chưa có tài liệu nào</Text>
                        </View>
                    }
                />
            )}

            {/* Upload Button */}
            <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => setUploadModal(true)}
            >
                <Text style={styles.floatingButtonText}>➕</Text>
            </TouchableOpacity>

            {/* Upload Modal */}
            <Modal visible={uploadModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>📤 Tải lên tài liệu</Text>
                            <TouchableOpacity onPress={() => setUploadModal(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {/* File selector */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>File *</Text>
                                <TouchableOpacity
                                    style={styles.fileSelectorButton}
                                    onPress={handleSelectFile}
                                >
                                    <Text style={styles.fileSelectorText}>
                                        {selectedFile ? selectedFile.name : '📎 Chọn file'}
                                    </Text>
                                </TouchableOpacity>
                                {selectedFile && (
                                    <Text style={styles.fileSizeText}>
                                        {formatFileSize(selectedFile.size || 0)}
                                    </Text>
                                )}
                            </View>

                            {/* Project selector */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Dự án (tùy chọn)</Text>
                                <TouchableOpacity
                                    style={styles.projectSelector}
                                    onPress={() => {
                                        Alert.alert(
                                            'Chọn dự án',
                                            '',
                                            [
                                                { text: 'Không chọn', onPress: () => setUploadProjectId(null) },
                                                ...projects.map(p => ({
                                                    text: p.tenduan,
                                                    onPress: () => setUploadProjectId(p.id)
                                                }))
                                            ]
                                        );
                                    }}
                                >
                                    <Text style={styles.projectSelectorText}>
                                        {uploadProjectId
                                            ? projects.find(p => p.id === uploadProjectId)?.tenduan
                                            : 'Chọn dự án...'}
                                    </Text>
                                    <Text style={styles.dropdownIcon}>▼</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Description */}
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Mô tả (tùy chọn)</Text>
                                <TextInput
                                    style={styles.textArea}
                                    placeholder="Nhập mô tả tài liệu..."
                                    value={uploadDescription}
                                    onChangeText={setUploadDescription}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setUploadModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.uploadButton]}
                                onPress={handleUpload}
                                disabled={!selectedFile || uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.uploadButtonText}>📤 Tải lên</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Project Filter Modal */}
            <Modal visible={projectModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.projectModalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Lọc theo dự án</Text>
                            <TouchableOpacity onPress={() => setProjectModal(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.projectList}>
                            <TouchableOpacity
                                style={[
                                    styles.projectItem,
                                    !selectedProjectId && styles.projectItemSelected
                                ]}
                                onPress={() => {
                                    setSelectedProjectId(null);
                                    setProjectModal(false);
                                }}
                            >
                                <Text style={styles.projectItemText}>📁 Tất cả dự án</Text>
                                {!selectedProjectId && <Text style={styles.checkIcon}>✓</Text>}
                            </TouchableOpacity>
                            {projects.map(project => (
                                <TouchableOpacity
                                    key={project.id}
                                    style={[
                                        styles.projectItem,
                                        selectedProjectId === project.id && styles.projectItemSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedProjectId(project.id);
                                        setProjectModal(false);
                                    }}
                                >
                                    <Text style={styles.projectItemText}>📁 {project.tenduan}</Text>
                                    {selectedProjectId === project.id && <Text style={styles.checkIcon}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    filterContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 15,
    },
    clearIcon: {
        fontSize: 18,
        color: '#9ca3af',
        padding: 4,
    },
    projectFilterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    projectFilterText: {
        fontSize: 15,
        color: '#374151',
        flex: 1,
    },
    dropdownIcon: {
        fontSize: 12,
        color: '#6b7280',
    },
    statsContainer: {
        padding: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    statsText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#6b7280',
    },
    listContainer: {
        padding: 16,
    },
    documentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    documentHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    fileIcon: {
        fontSize: 24,
    },
    documentInfo: {
        flex: 1,
    },
    documentName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 4,
    },
    documentSize: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 4,
    },
    documentDesc: {
        fontSize: 13,
        color: '#9ca3af',
    },
    projectBadge: {
        backgroundColor: '#dbeafe',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    projectBadgeText: {
        fontSize: 12,
        color: '#1e40af',
        fontWeight: '600',
    },
    documentFooter: {
        marginBottom: 12,
    },
    uploaderInfo: {
        flexDirection: 'column',
        gap: 4,
    },
    uploaderText: {
        fontSize: 13,
        color: '#6b7280',
    },
    dateText: {
        fontSize: 12,
        color: '#9ca3af',
    },
    documentActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    downloadButton: {
        backgroundColor: '#2563eb',
    },
    deleteButton: {
        backgroundColor: '#ef4444',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#9ca3af',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f59e0b',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    floatingButtonText: {
        fontSize: 28,
        color: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    closeButton: {
        fontSize: 24,
        color: '#6b7280',
    },
    modalContent: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    fileSelectorButton: {
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderStyle: 'dashed',
    },
    fileSelectorText: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
    },
    fileSizeText: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    projectSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    projectSelectorText: {
        fontSize: 15,
        color: '#374151',
    },
    textArea: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 14,
        borderWidth: 1,
        borderColor: '#d1d5db',
        fontSize: 15,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f3f4f6',
    },
    cancelButtonText: {
        color: '#6b7280',
        fontSize: 15,
        fontWeight: '600',
    },
    uploadButton: {
        backgroundColor: '#f59e0b',
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    projectModalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxHeight: '60%',
    },
    projectList: {
        maxHeight: 400,
    },
    projectItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    projectItemSelected: {
        backgroundColor: '#eff6ff',
    },
    projectItemText: {
        fontSize: 15,
        color: '#374151',
    },
    checkIcon: {
        fontSize: 18,
        color: '#2563eb',
        fontWeight: '700',
    },
});

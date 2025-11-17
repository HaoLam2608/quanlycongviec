import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/src/axios/config';

interface User {
    id: number;
    hoten: string;
    manv: string;
}

interface Comment {
    id: number;
    content: string;
    createdAt: string;
    author?: {
        id: number;
        hoten: string;
        manv: string;
    };
    attachments?: Array<{
        filename: string;
        mimetype: string;
        size: number;
        data: string; // base64 encoded
    }>;
    mentions?: Array<{
        userId: number;
        userName: string;
    }>;
}

interface CommentSectionProps {
    taskId?: number;
    subtaskId?: number;
    onCommentAdded?: () => void;
}

export default function CommentSection({ taskId, subtaskId, onCommentAdded }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showUserPicker, setShowUserPicker] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const [selectedImages, setSelectedImages] = useState<any[]>([]);
    const [mentionedUsers, setMentionedUsers] = useState<number[]>([]);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);
    const textInputRef = useRef<TextInput>(null);

    useEffect(() => {
        loadComments();
        loadAllUsers();
    }, []);

    useEffect(() => {
        // Check if user is typing @ to trigger mention
        const lastAtIndex = commentText.lastIndexOf('@', cursorPosition);
        if (lastAtIndex !== -1 && (lastAtIndex === 0 || commentText[lastAtIndex - 1] === ' ')) {
            const textAfterAt = commentText.substring(lastAtIndex + 1, cursorPosition);
            if (!textAfterAt.includes(' ')) {
                setMentionTriggerIndex(lastAtIndex);
                const filtered = allUsers.filter(u => 
                    u.hoten.toLowerCase().includes(textAfterAt.toLowerCase()) ||
                    u.manv.toLowerCase().includes(textAfterAt.toLowerCase())
                );
                setFilteredUsers(filtered);
                setShowUserPicker(filtered.length > 0);
            } else {
                setShowUserPicker(false);
            }
        } else {
            setShowUserPicker(false);
        }
    }, [commentText, cursorPosition]);

    const loadComments = async () => {
        try {
            setLoading(true);
            const endpoint = taskId ? `/comments/task/${taskId}` : `/comments/subtask/${subtaskId}`;
            const res = await api.get(endpoint);
            const data = res.data || res;
            const arr = Array.isArray(data) ? data : (data.comments || data.data || []);
            setComments(arr);
        } catch (err) {
            console.error('Error loading comments', err);
        } finally {
            setLoading(false);
        }
    };

    const loadAllUsers = async () => {
        try {
            const res = await api.get('/users');
            const data = res.data || res;
            const users = Array.isArray(data) ? data : (data.users || []);
            setAllUsers(users);
        } catch (err) {
            console.error('Error loading users', err);
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets) {
                setSelectedImages([...selectedImages, ...result.assets]);
            }
        } catch (err) {
            console.error('Error picking image', err);
            Alert.alert('Lỗi', 'Không thể chọn ảnh');
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
            });

            if (result.assets && result.assets.length > 0) {
                setSelectedFiles([...selectedFiles, ...result.assets]);
            }
        } catch (err) {
            console.error('Error picking document', err);
            Alert.alert('Lỗi', 'Không thể chọn file');
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(selectedImages.filter((_, i) => i !== index));
    };

    const removeFile = (index: number) => {
        setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    };

    const selectUser = (user: User) => {
        // Replace @mention with @username
        const beforeMention = commentText.substring(0, mentionTriggerIndex);
        const afterCursor = commentText.substring(cursorPosition);
        const newText = `${beforeMention}@${user.hoten} ${afterCursor}`;
        
        setCommentText(newText);
        setMentionedUsers([...mentionedUsers, user.id]);
        setShowUserPicker(false);
        
        // Set cursor position after the mention
        const newCursorPos = beforeMention.length + user.hoten.length + 2;
        setCursorPosition(newCursorPos);
        
        setTimeout(() => {
            textInputRef.current?.focus();
        }, 100);
    };

    const handlePostComment = async () => {
        if (!commentText.trim() && selectedImages.length === 0 && selectedFiles.length === 0) {
            return Alert.alert('Lỗi', 'Vui lòng nhập nội dung hoặc đính kèm file');
        }

        try {
            setPosting(true);
            const formData = new FormData();

            // Add basic data
            if (taskId) formData.append('taskId', String(taskId));
            if (subtaskId) formData.append('subtaskId', String(subtaskId));
            formData.append('content', commentText.trim());

            // Add mentioned users
            if (mentionedUsers.length > 0) {
                formData.append('mentions', JSON.stringify(mentionedUsers));
            }

            // Add images - React Native requires specific format
            for (let i = 0; i < selectedImages.length; i++) {
                const image = selectedImages[i];
                
                // Get proper file extension and type
                let fileType = 'jpeg';
                let mimeType = 'image/jpeg';
                
                if (image.uri) {
                    const uriParts = image.uri.split('.');
                    const ext = uriParts[uriParts.length - 1].toLowerCase();
                    fileType = ext;
                    
                    if (ext === 'png') mimeType = 'image/png';
                    else if (ext === 'gif') mimeType = 'image/gif';
                    else if (ext === 'webp') mimeType = 'image/webp';
                    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
                }
                
                const imageFile = {
                    uri: image.uri,
                    name: `image_${Date.now()}_${i}.${fileType}`,
                    type: mimeType,
                };
                
                formData.append('images', imageFile as any);
            }

            // Add files
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                
                const fileObj = {
                    uri: file.uri,
                    name: file.name || `file_${Date.now()}_${i}`,
                    type: file.mimeType || 'application/octet-stream',
                };
                
                formData.append('files', fileObj as any);
            }

            // Use fetch API instead of axios for better FormData support
            const token = await AsyncStorage.getItem('accessToken');
            const response = await fetch('http://10.0.2.2:5000/comments', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Don't set Content-Type - let browser set it with boundary
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log('Comment posted successfully:', result);

            // Reset form
            setCommentText('');
            setSelectedImages([]);
            setSelectedFiles([]);
            setMentionedUsers([]);
            
            // Reload comments
            await loadComments();
            onCommentAdded?.();
            
            Alert.alert('Thành công', 'Đã đăng bình luận');
        } catch (err: any) {
            console.error('Error posting comment', err);
            Alert.alert('Lỗi', err?.message || 'Không thể đăng bình luận');
        } finally {
            setPosting(false);
        }
    };

    const renderComment = ({ item }: { item: Comment }) => (
        <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.author?.hoten?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                </View>
                <View style={styles.commentMeta}>
                    <Text style={styles.authorName}>
                        {item.author?.hoten || 'Người dùng'}
                    </Text>
                    <Text style={styles.commentTime}>
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </Text>
                </View>
            </View>
            
            <Text style={styles.commentContent}>{item.content}</Text>
            
            {/* Show attachments */}
            {item.attachments && item.attachments.length > 0 && (
                <View style={styles.attachmentsContainer}>
                    {item.attachments.map((att, index) => {
                        const isImage = att.mimetype.startsWith('image/');
                        const imageUri = isImage ? `data:${att.mimetype};base64,${att.data}` : null;
                        
                        return (
                            <TouchableOpacity
                                key={index}
                                style={styles.attachmentItem}
                                onPress={() => {
                                    if (isImage) {
                                        Alert.alert('Ảnh', att.filename, [
                                            { text: 'OK', style: 'cancel' }
                                        ]);
                                    } else {
                                        Alert.alert('File', `${att.filename}\nKích thước: ${(att.size / 1024).toFixed(2)} KB`);
                                    }
                                }}
                            >
                                {isImage && imageUri ? (
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={styles.attachmentImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.fileAttachment}>
                                        <Text style={styles.fileIcon}>📄</Text>
                                        <Text style={styles.fileName} numberOfLines={1}>
                                            {att.filename}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>💬 Bình luận ({comments.length})</Text>
            
            {/* Comment Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    ref={textInputRef}
                    style={styles.input}
                    placeholder="Viết bình luận... (Dùng @ để tag người)"
                    value={commentText}
                    onChangeText={setCommentText}
                    onSelectionChange={(e) => setCursorPosition(e.nativeEvent.selection.start)}
                    multiline
                    maxLength={1000}
                />
                
                {/* Selected Images Preview */}
                {selectedImages.length > 0 && (
                    <ScrollView horizontal style={styles.previewContainer}>
                        {selectedImages.map((img, index) => (
                            <View key={index} style={styles.previewImageContainer}>
                                <Image source={{ uri: img.uri }} style={styles.previewImage} />
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeImage(index)}
                                >
                                    <Text style={styles.removeButtonText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}
                
                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                    <View style={styles.filesPreview}>
                        {selectedFiles.map((file, index) => (
                            <View key={index} style={styles.filePreviewItem}>
                                <Text style={styles.filePreviewName} numberOfLines={1}>
                                    📎 {file.name}
                                </Text>
                                <TouchableOpacity onPress={() => removeFile(index)}>
                                    <Text style={styles.removeFileText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
                
                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
                        <Text style={styles.actionButtonText}>🖼️ Ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={pickDocument}>
                        <Text style={styles.actionButtonText}>📎 File</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.postButton, posting && styles.postButtonDisabled]}
                        onPress={handlePostComment}
                        disabled={posting}
                    >
                        {posting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.postButtonText}>Gửi</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* User Picker Modal for @mentions */}
            <Modal visible={showUserPicker} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowUserPicker(false)}
                >
                    <View style={styles.userPickerContainer}>
                        <ScrollView style={styles.userList}>
                            {filteredUsers.map((user) => (
                                <TouchableOpacity
                                    key={user.id}
                                    style={styles.userItem}
                                    onPress={() => selectUser(user)}
                                >
                                    <View style={styles.userAvatar}>
                                        <Text style={styles.userAvatarText}>
                                            {user.hoten.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.userName}>{user.hoten}</Text>
                                        <Text style={styles.userCode}>{user.manv}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Comments List */}
            {loading ? (
                <ActivityIndicator size="small" color="#3b82f6" style={{ marginTop: 16 }} />
            ) : comments.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
            ) : (
                <FlatList
                    data={comments}
                    renderItem={renderComment}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.commentsList}
                    scrollEnabled={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 12,
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        fontSize: 14,
        color: '#111827',
        backgroundColor: '#f9fafb',
    },
    previewContainer: {
        marginTop: 8,
        maxHeight: 100,
    },
    previewImageContainer: {
        marginRight: 8,
        position: 'relative',
    },
    previewImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#ef4444',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    filesPreview: {
        marginTop: 8,
    },
    filePreviewItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f3f4f6',
        padding: 8,
        borderRadius: 6,
        marginBottom: 4,
    },
    filePreviewName: {
        flex: 1,
        fontSize: 13,
        color: '#374151',
    },
    removeFileText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    postButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        alignItems: 'center',
        minWidth: 80,
    },
    postButtonDisabled: {
        opacity: 0.6,
    },
    postButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        padding: 20,
    },
    userPickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        maxHeight: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    userList: {
        maxHeight: 300,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    userAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    userAvatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    userCode: {
        fontSize: 12,
        color: '#6b7280',
    },
    emptyText: {
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 14,
        marginTop: 16,
    },
    commentsList: {
        marginTop: 8,
    },
    commentCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    avatarText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    commentMeta: {
        flex: 1,
    },
    authorName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
    },
    commentTime: {
        fontSize: 11,
        color: '#6b7280',
    },
    commentContent: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },
    attachmentsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    attachmentItem: {
        marginRight: 8,
        marginBottom: 8,
    },
    attachmentImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    fileAttachment: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        maxWidth: 150,
    },
    fileIcon: {
        fontSize: 20,
        marginRight: 6,
    },
    fileName: {
        fontSize: 12,
        color: '#374151',
        flex: 1,
    },
});

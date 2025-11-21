import { getGroup, updateGroup, closeGroup } from '@/src/axios/adminApi';
import { Modal, TextInput, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PageHeader } from '../../components/ui/PageHeader';
import api from '@/src/axios/config';

interface Member {
    id: number;
    hoten?: string;
    manv?: string;
    name?: string;
    fullName?: string;
}

interface GroupDetailType {
    id: number;
    name: string;
    description?: string;
    closed?: boolean;
    // leader objects from backend sometimes use `hoten`, `name` or `fullName`
    leader?: { id: number; hoten?: string; manv?: string; name?: string; fullName?: string };
    members?: Member[];
    duans?: any[]; // projects - be defensive
}

export default function GroupDetail() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const groupId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [group, setGroup] = useState<GroupDetailType | null>(null);
    
    // Edit modal states
    const [editModal, setEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editLeaderId, setEditLeaderId] = useState<number | null>(null);
    const [editMemberIds, setEditMemberIds] = useState<number[]>([]);
    const [editProjectIds, setEditProjectIds] = useState<number[]>([]);
    
    // Sub-modals for selecting
    const [showLeaderModal, setShowLeaderModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [searchLeader, setSearchLeader] = useState('');
    const [searchMember, setSearchMember] = useState('');
    const [searchProject, setSearchProject] = useState('');
    
    // Data for selects
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [allProjects, setAllProjects] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(false);

    useEffect(() => {
        if (groupId) loadGroup();
    }, [groupId]);

    const loadGroup = async () => {
        try {
            setLoading(true);
            const data = await getGroup(Number(groupId));
            // backend may return group object in data or data.group
            const g = data && data.id ? data : (data.group || data.data || null);
            if (g) {
                setGroup({
                    id: g.id,
                    name: g.name || g.ten || '',
                    description: g.description || g.mota || '',
                    closed: Boolean(g.isClosed || g.is_closed || g.closed || g.dong || g.trangthai === 'Đã đóng'),
                    leader: g.leader || g.truong || g.leaderInfo || null,
                    members: Array.isArray(g.members) ? g.members : (g.Users || g.userList || []),
                    duans: g.duans || g.projects || (g.groupProjects || []),
                });
            } else {
                setGroup(null);
            }
        } catch (error) {
            console.error('Error loading group:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadGroup();
    };

    useEffect(() => {
        if (group && editModal) {
            setEditName(group.name || '');
            setEditDesc(group.description || '');
            setEditLeaderId(group.leader?.id || null);
            setEditMemberIds(group.members?.map(m => m.id) || []);
            setEditProjectIds(group.duans?.map(d => d.id || d.duanId || d.projectId) || []);
            loadUsersAndProjects();
        }
    }, [group, editModal]);

    const loadUsersAndProjects = async () => {
        setLoadingUsers(true);
        setLoadingProjects(true);
        try {
            // Load projects first
            const projectsRes = await api.get('/duan/getAll');
            setAllProjects(projectsRes.data.duans || projectsRes.data || []);
            
            // Try multiple endpoints for users
            let users: any[] = [];
            try {
                // Try getting users from groups/teams endpoint first
                const groupsRes = await api.get('/groups/all');
                const groups = groupsRes.data.groups || groupsRes.data || [];
                const usersSet = new Map();
                
                // Extract unique users from all groups
                groups.forEach((g: any) => {
                    if (g.leader) usersSet.set(g.leader.id, g.leader);
                    if (g.members) {
                        g.members.forEach((m: any) => usersSet.set(m.id, m));
                    }
                });
                users = Array.from(usersSet.values());
            } catch (error) {
                console.log('Could not load from groups, trying users endpoint');
            }
            
            // If no users from groups, try direct users endpoint
            if (users.length === 0) {
                try {
                    const usersRes = await api.get('/users');
                    users = usersRes.data.users || usersRes.data || [];
                } catch (error) {
                    console.log('Could not load from users endpoint');
                }
            }
            
            setAllUsers(users);
            
        } catch (error) {
            console.error('Error loading users/projects:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách người dùng hoặc dự án');
        } finally {
            setLoadingUsers(false);
            setLoadingProjects(false);
        }
    };

    const handleEditGroup = async () => {
        if (!editName.trim()) {
            Alert.alert('Lỗi', 'Tên nhóm không được để trống');
            return;
        }
        if (!editLeaderId) {
            Alert.alert('Lỗi', 'Vui lòng chọn trưởng nhóm');
            return;
        }
        if (editMemberIds.length === 0) {
            Alert.alert('Lỗi', 'Nhóm phải có ít nhất 1 thành viên');
            return;
        }
        
        try {
            await updateGroup(group!.id, {
                name: editName,
                description: editDesc,
                leaderId: editLeaderId,
                memberIds: editMemberIds,
                projectIds: editProjectIds
            });
            Alert.alert('Thành công', 'Cập nhật nhóm thành công');
            setEditModal(false);
            loadGroup();
        } catch (e: any) {
            Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể cập nhật nhóm');
        }
    };

    const handleCloseGroup = async () => {
        Alert.alert(
            'Xác nhận đóng nhóm',
            'Bạn có chắc muốn đóng nhóm này? Hành động này không thể hoàn tác.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đóng nhóm',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await closeGroup(group!.id);
                            Alert.alert('Thành công', 'Đã đóng nhóm');
                            setEditModal(false);
                            loadGroup();
                        } catch (e: any) {
                            Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể đóng nhóm');
                        }
                    }
                }
            ]
        );
    };

    const toggleMember = (userId: number) => {
        if (editMemberIds.includes(userId)) {
            setEditMemberIds(editMemberIds.filter(id => id !== userId));
        } else {
            setEditMemberIds([...editMemberIds, userId]);
        }
    };

    const toggleProject = (projectId: number) => {
        if (editProjectIds.includes(projectId)) {
            setEditProjectIds(editProjectIds.filter(id => id !== projectId));
        } else {
            setEditProjectIds([...editProjectIds, projectId]);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Chi tiết nhóm" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!group) {
        return (
            <SafeAreaView style={styles.container}>
                <PageHeader title="Chi tiết nhóm" />
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>❌</Text>
                    <Text style={styles.emptyTitle}>Không tìm thấy nhóm</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <PageHeader title="Chi tiết nhóm" />
            {/* Nút chỉnh sửa nhóm */}
            {group && !group.closed && (
                <TouchableOpacity style={{alignSelf:'flex-end',margin:16,padding:8,backgroundColor:'#2563eb',borderRadius:8}} onPress={()=>setEditModal(true)}>
                    <Text style={{color:'#fff',fontWeight:'700'}}>Chỉnh sửa nhóm</Text>
                </TouchableOpacity>
            )}
            {/* Modal chỉnh sửa nhóm */}
            <Modal visible={editModal} animationType="slide" transparent>
                <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center',padding:10}}>
                    <View style={{backgroundColor:'#fff',borderRadius:16,width:'100%',height:'90%',shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.25,shadowRadius:4,elevation:5,flexDirection:'column'}}>
                        {/* Header */}
                        <View style={{padding:20,borderBottomWidth:1,borderBottomColor:'#e5e7eb'}}>
                            <Text style={{fontWeight:'700',fontSize:20,color:'#1f2937'}}>Chỉnh sửa nhóm</Text>
                        </View>
                        
                        {/* Content - ScrollView */}
                        <ScrollView style={{flex:1}} contentContainerStyle={{padding:20}}>
                            {/* Tên nhóm */}
                            <View style={{marginBottom:16}}>
                                <Text style={{fontWeight:'600',marginBottom:6,color:'#374151'}}>Tên nhóm *</Text>
                                <TextInput 
                                    value={editName} 
                                    onChangeText={setEditName} 
                                    style={{borderWidth:1,borderColor:'#d1d5db',borderRadius:8,padding:12,fontSize:14,backgroundColor:'#f9fafb'}}
                                    placeholder="Nhập tên nhóm"
                                />
                            </View>

                            {/* Mô tả */}
                            <View style={{marginBottom:16}}>
                                <Text style={{fontWeight:'600',marginBottom:6,color:'#374151'}}>Mô tả</Text>
                                <TextInput 
                                    value={editDesc} 
                                    onChangeText={setEditDesc} 
                                    style={{borderWidth:1,borderColor:'#d1d5db',borderRadius:8,padding:12,fontSize:14,backgroundColor:'#f9fafb',minHeight:80}}
                                    multiline
                                    numberOfLines={3}
                                    placeholder="Nhập mô tả nhóm"
                                />
                            </View>

                            {/* Trưởng nhóm - Button to open modal */}
                            <View style={{marginBottom:16}}>
                                <Text style={{fontWeight:'600',marginBottom:6,color:'#374151'}}>Trưởng nhóm *</Text>
                                <TouchableOpacity 
                                    onPress={() => setShowLeaderModal(true)}
                                    style={{borderWidth:1,borderColor:'#d1d5db',borderRadius:8,padding:12,backgroundColor:'#f9fafb',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}
                                >
                                    <Text style={{fontSize:14,color:editLeaderId?'#1f2937':'#9ca3af'}}>
                                        {editLeaderId ? allUsers.find(u=>u.id===editLeaderId)?.hoten || 'Đã chọn' : 'Chọn trưởng nhóm'}
                                    </Text>
                                    <Text style={{fontSize:18,color:'#6b7280'}}>›</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Thành viên - Button to open modal */}
                            <View style={{marginBottom:16}}>
                                <Text style={{fontWeight:'600',marginBottom:6,color:'#374151'}}>Thành viên * ({editMemberIds.length})</Text>
                                <TouchableOpacity 
                                    onPress={() => setShowMemberModal(true)}
                                    style={{borderWidth:1,borderColor:'#d1d5db',borderRadius:8,padding:12,backgroundColor:'#f9fafb',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}
                                >
                                    <Text style={{fontSize:14,color:editMemberIds.length>0?'#1f2937':'#9ca3af'}}>
                                        {editMemberIds.length > 0 ? `Đã chọn ${editMemberIds.length} thành viên` : 'Chọn thành viên'}
                                    </Text>
                                    <Text style={{fontSize:18,color:'#6b7280'}}>›</Text>
                                </TouchableOpacity>
                                {/* Show selected members */}
                                {editMemberIds.length > 0 && (
                                    <View style={{marginTop:8,flexDirection:'row',flexWrap:'wrap',gap:6}}>
                                        {editMemberIds.map(memberId => {
                                            const member = allUsers.find(u => u.id === memberId);
                                            return member ? (
                                                <View key={memberId} style={{backgroundColor:'#dbeafe',paddingHorizontal:10,paddingVertical:6,borderRadius:16,flexDirection:'row',alignItems:'center',gap:4}}>
                                                    <Text style={{fontSize:12,color:'#1e40af'}}>{member.hoten || member.name}</Text>
                                                    <TouchableOpacity onPress={() => toggleMember(memberId)}>
                                                        <Text style={{fontSize:14,color:'#1e40af',fontWeight:'700'}}>×</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : null;
                                        })}
                                    </View>
                                )}
                            </View>

                            {/* Dự án - Button to open modal */}
                            <View style={{marginBottom:16}}>
                                <Text style={{fontWeight:'600',marginBottom:6,color:'#374151'}}>Dự án ({editProjectIds.length})</Text>
                                <TouchableOpacity 
                                    onPress={() => setShowProjectModal(true)}
                                    style={{borderWidth:1,borderColor:'#d1d5db',borderRadius:8,padding:12,backgroundColor:'#f9fafb',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}
                                >
                                    <Text style={{fontSize:14,color:editProjectIds.length>0?'#1f2937':'#9ca3af'}}>
                                        {editProjectIds.length > 0 ? `Đã chọn ${editProjectIds.length} dự án` : 'Chọn dự án'}
                                    </Text>
                                    <Text style={{fontSize:18,color:'#6b7280'}}>›</Text>
                                </TouchableOpacity>
                                {/* Show selected projects */}
                                {editProjectIds.length > 0 && (
                                    <View style={{marginTop:8,flexDirection:'row',flexWrap:'wrap',gap:6}}>
                                        {editProjectIds.map(projectId => {
                                            const project = allProjects.find(p => p.id === projectId);
                                            return project ? (
                                                <View key={projectId} style={{backgroundColor:'#ede9fe',paddingHorizontal:10,paddingVertical:6,borderRadius:16,flexDirection:'row',alignItems:'center',gap:4}}>
                                                    <Text style={{fontSize:12,color:'#6b21a8'}}>{project.tenduan}</Text>
                                                    <TouchableOpacity onPress={() => toggleProject(projectId)}>
                                                        <Text style={{fontSize:14,color:'#6b21a8',fontWeight:'700'}}>×</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : null;
                                        })}
                                    </View>
                                )}
                            </View>

                            {/* Nút đóng nhóm */}
                            <TouchableOpacity 
                                onPress={handleCloseGroup}
                                style={{backgroundColor:'#ef4444',padding:14,borderRadius:8,alignItems:'center',marginBottom:20}}
                            >
                                <Text style={{color:'#fff',fontWeight:'700',fontSize:15}}>🔒 Đóng nhóm</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        {/* Footer Actions */}
                        <View style={{flexDirection:'row',padding:16,borderTopWidth:1,borderTopColor:'#e5e7eb',gap:12}}>
                            <TouchableOpacity 
                                onPress={()=>setEditModal(false)} 
                                style={{flex:1,padding:14,borderRadius:8,backgroundColor:'#f3f4f6',alignItems:'center'}}
                            >
                                <Text style={{fontWeight:'600',fontSize:15,color:'#6b7280'}}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={handleEditGroup} 
                                style={{flex:1,backgroundColor:'#2563eb',padding:14,borderRadius:8,alignItems:'center'}}
                            >
                                <Text style={{color:'#fff',fontWeight:'700',fontSize:15}}>💾 Lưu thay đổi</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Leader Selection Modal */}
            <Modal visible={showLeaderModal} animationType="slide" transparent>
                <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'}}>
                    <View style={{backgroundColor:'#fff',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'}}>
                        <View style={{padding:16,borderBottomWidth:1,borderBottomColor:'#e5e7eb',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                            <Text style={{fontSize:18,fontWeight:'700'}}>Chọn trưởng nhóm</Text>
                            <TouchableOpacity onPress={()=>setShowLeaderModal(false)}>
                                <Text style={{fontSize:24,color:'#6b7280'}}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{padding:12}}>
                            <TextInput 
                                value={searchLeader}
                                onChangeText={setSearchLeader}
                                placeholder="Tìm kiếm..."
                                style={{borderWidth:1,borderColor:'#d1d5db',borderRadius:8,padding:10,marginBottom:12}}
                            />
                        </View>
                        <ScrollView style={{maxHeight:'60%'}}>
                            {allUsers.filter(u => !searchLeader || (u.hoten||u.name||'').toLowerCase().includes(searchLeader.toLowerCase())).map(user => (
                                <TouchableOpacity
                                    key={user.id}
                                    onPress={() => {setEditLeaderId(user.id); setShowLeaderModal(false); setSearchLeader('');}}
                                    style={{padding:16,borderBottomWidth:1,borderBottomColor:'#f3f4f6',flexDirection:'row',alignItems:'center'}}
                                >
                                    <View style={{width:20,height:20,borderRadius:10,borderWidth:2,borderColor:editLeaderId===user.id?'#2563eb':'#d1d5db',backgroundColor:editLeaderId===user.id?'#2563eb':'#fff',marginRight:12}}/>
                                    <Text style={{fontSize:15}}>{user.hoten || user.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Member Selection Modal */}
            <Modal visible={showMemberModal} animationType="slide" transparent>
                <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'}}>
                    <View style={{backgroundColor:'#fff',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'}}>
                        <View style={{padding:16,borderBottomWidth:1,borderBottomColor:'#e5e7eb',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                            <Text style={{fontSize:18,fontWeight:'700'}}>Chọn thành viên ({editMemberIds.length})</Text>
                            <TouchableOpacity onPress={()=>{setShowMemberModal(false); setSearchMember('');}}>
                                <Text style={{fontSize:24,color:'#6b7280'}}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{padding:12}}>
                            <TextInput 
                                value={searchMember}
                                onChangeText={setSearchMember}
                                placeholder="Tìm kiếm..."
                                style={{borderWidth:1,borderColor:'#d1d5db',borderRadius:8,padding:10,marginBottom:12}}
                            />
                        </View>
                        <ScrollView style={{maxHeight:'60%'}}>
                            {allUsers.filter(u => !searchMember || (u.hoten||u.name||'').toLowerCase().includes(searchMember.toLowerCase())).map(user => (
                                <TouchableOpacity
                                    key={user.id}
                                    onPress={() => toggleMember(user.id)}
                                    style={{padding:16,borderBottomWidth:1,borderBottomColor:'#f3f4f6',flexDirection:'row',alignItems:'center'}}
                                >
                                    <View style={{width:20,height:20,borderRadius:4,borderWidth:2,borderColor:editMemberIds.includes(user.id)?'#10b981':'#d1d5db',backgroundColor:editMemberIds.includes(user.id)?'#10b981':'#fff',marginRight:12,alignItems:'center',justifyContent:'center'}}>
                                        {editMemberIds.includes(user.id) && <Text style={{color:'#fff',fontSize:12}}>✓</Text>}
                                    </View>
                                    <Text style={{fontSize:15}}>{user.hoten || user.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Project Selection Modal */}
            <Modal visible={showProjectModal} animationType="slide" transparent>
                <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'}}>
                    <View style={{backgroundColor:'#fff',borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'80%'}}>
                        <View style={{padding:16,borderBottomWidth:1,borderBottomColor:'#e5e7eb',flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                            <Text style={{fontSize:18,fontWeight:'700'}}>Chọn dự án ({editProjectIds.length})</Text>
                            <TouchableOpacity onPress={()=>{setShowProjectModal(false); setSearchProject('');}}>
                                <Text style={{fontSize:24,color:'#6b7280'}}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{padding:12}}>
                            <TextInput 
                                value={searchProject}
                                onChangeText={setSearchProject}
                                placeholder="Tìm kiếm..."
                                style={{borderWidth:1,borderColor:'#d1d5db',borderRadius:8,padding:10,marginBottom:12}}
                            />
                        </View>
                        <ScrollView style={{maxHeight:'60%'}}>
                            {allProjects.filter(p => !searchProject || (p.tenduan||'').toLowerCase().includes(searchProject.toLowerCase())).map(project => (
                                <TouchableOpacity
                                    key={project.id}
                                    onPress={() => toggleProject(project.id)}
                                    style={{padding:16,borderBottomWidth:1,borderBottomColor:'#f3f4f6',flexDirection:'row',alignItems:'center'}}
                                >
                                    <View style={{width:20,height:20,borderRadius:4,borderWidth:2,borderColor:editProjectIds.includes(project.id)?'#8b5cf6':'#d1d5db',backgroundColor:editProjectIds.includes(project.id)?'#8b5cf6':'#fff',marginRight:12,alignItems:'center',justifyContent:'center'}}>
                                        {editProjectIds.includes(project.id) && <Text style={{color:'#fff',fontSize:12}}>✓</Text>}
                                    </View>
                                    <Text style={{fontSize:15}}>{project.tenduan}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            <FlatList
                style={styles.content}
                data={group.members || []}
                keyExtractor={(m: any) => (m.id || m.userId || Math.random()).toString()}
                renderItem={({ item }) => (
                    <View style={styles.memberRow}>
                        <View style={styles.memberAvatar}><Text style={styles.memberInitial}>{(item.hoten||'').charAt(0).toUpperCase()}</Text></View>
                        <View style={styles.memberInfo}>
                            <Text style={styles.memberName}>{item.hoten || item.name || 'Không rõ'}</Text>
                            {item.manv ? <Text style={styles.memberCode}>{item.manv}</Text> : null}
                        </View>
                    </View>
                )}
                ListHeaderComponent={() => (
                    <>
                        <View style={styles.header}>
                            <Text style={styles.title}>{group.name}</Text>
                            <View style={styles.headerBadges}>
                                {group.closed ? (
                                    <View style={[styles.badge, { backgroundColor: '#6b7280' }]}>
                                        <Text style={styles.badgeText}>Đã đóng</Text>
                                    </View>
                                ) : null}
                                <View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
                                    <Text style={styles.badgeText}>{(group.members||[]).length} thành viên</Text>
                                </View>
                            </View>
                        </View>

                        {group.description ? (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>📝 Mô tả</Text>
                                <Text style={styles.sectionText}>{group.description}</Text>
                            </View>
                        ) : null}

                        {group.duans && group.duans.length > 0 ? (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>📁 Dự án liên quan</Text>
                                {group.duans.map((d: any) => (
                                    <TouchableOpacity key={d.id || d.duanId} style={styles.projectLink} onPress={() => router.push(`/(manager)/project-detail?id=${d.id || d.duanId}`)}>
                                        <Text style={styles.projectLinkText}>📁 {d.tenduan || d.name || d.title}</Text>
                                        <Text style={styles.projectLinkArrow}>›</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : null}

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>👥 Trưởng nhóm</Text>
                            {group.leader ? (
                                <View style={styles.personCard}>
                                    <View style={styles.personAvatar}><Text style={styles.personInitial}>{(group.leader.hoten||'').charAt(0).toUpperCase()}</Text></View>
                                    <View style={styles.personInfo}>
                                        <Text style={styles.personName}>{group.leader.hoten || group.leader.name || 'Không rõ'}</Text>
                                        {group.leader.manv ? <Text style={styles.personCode}>{group.leader.manv}</Text> : null}
                                    </View>
                                </View>
                            ) : (
                                <Text style={styles.sectionText}>Chưa có trưởng nhóm</Text>
                            )}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>👥 Thành viên ({(group.members||[]).length})</Text>
                        </View>
                    </>
                )}
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    content: { padding: 16 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#6b7280' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIcon: { fontSize: 48 },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
    header: { marginBottom: 16 },
    title: { fontSize: 20, fontWeight: '800', color: '#1f2937' },
    headerBadges: { flexDirection: 'row', gap: 8, marginTop: 8 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
    section: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 12 },
    sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    sectionText: { color: '#6b7280' },
    projectLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    projectLinkText: { color: '#1f2937' },
    projectLinkArrow: { color: '#9ca3af' },
    personCard: { flexDirection: 'row', alignItems: 'center' },
    personAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    personInitial: { color: '#fff', fontWeight: '800', fontSize: 18 },
    personInfo: {},
    personName: { fontWeight: '700' },
    personCode: { color: '#6b7280', fontSize: 12 },
    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' },
    memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    memberInitial: { color: '#fff', fontWeight: '700' },
    memberInfo: {},
    memberName: { fontWeight: '700' },
    memberCode: { color: '#6b7280', fontSize: 12 },
});

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Modal, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUnassignedSubtasks, claimSubtask } from '../../../src/axios/api';

export default function MemberAvailableSubtasks() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [requestingId, setRequestingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getUnassignedSubtasks();
      const raw = Array.isArray(res) ? res : (res.subtasks || res || []);

      const normalized = raw.map((item: any) => ({
        id: item.id,
        tenSubtask: item.tenSubtask || item.ten || item.tenCongViecCon || `Công việc #${item.id}`,
        mota: item.mota || item.moTa,
        ngayKetThuc: item.ngayKetThuc,
        taskId: item.taskId ?? item.task?.id,
        taskName: item.task?.tentask || item.tentask || item.tenTask,
        nguoiThucHien: item.nguoiThucHien || item.assignee || null,
        isPendingAssignment: Array.isArray(item.assignments) && item.assignments.length > 0,
        original: item,
      }));

      // Filter for unassigned and not already pending
      const available = normalized.filter((s: any) => !s.nguoiThucHien && !s.isPendingAssignment);
      setSubtasks(available);
    } catch (err) {
      console.error('Load available subtasks error', err);
      Alert.alert('Lỗi', 'Không thể tải danh sách công việc trống');
      setSubtasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRequest = async (subtaskId: number) => {
    Alert.alert('Xác nhận', 'Bạn muốn gửi yêu cầu nhận công việc này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Gửi yêu cầu', onPress: async () => {
        try {
          setRequestingId(subtaskId);
          await claimSubtask(subtaskId);
          Alert.alert('Thành công', 'Yêu cầu nhận công việc đã được gửi tới người phê duyệt');
          await loadData();
        } catch (err: any) {
          console.error('Request assignment failed', err);
          Alert.alert('Lỗi', err?.message || 'Không thể gửi yêu cầu nhận việc');
        } finally {
          setRequestingId(null);
        }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)/member-tasks')}>
            <Ionicons name="arrow-back" size={20} color="#374151" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Công việc trống của nhóm</Text>
            <Text style={styles.subtitle}>Các công việc con chưa được gán</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#667eea" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#667eea"]} />
        }>
          {subtasks.length === 0 ? (
            <View style={styles.empty}> 
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="clipboard-outline" size={44} color="#9CA3AF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyTitleLarge}>Không có công việc trống</Text>
                  <Text style={styles.emptySubtitle}>Hiện tại không có công việc con chưa được gán cho nhóm.</Text>
                  <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                    <TouchableOpacity style={styles.ghostBtn} onPress={onRefresh}>
                      <Text style={styles.ghostBtnText}>Làm mới</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryBtn} onPress={onRefresh}>
                      <Text style={styles.primaryBtnText}>Tìm công việc</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            subtasks.map(item => (
              <TouchableOpacity key={item.id} style={styles.card} onPress={() => setSelected(item)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.tenSubtask}</Text>
                  <Text style={styles.cardTaskName}>{item.taskName || 'Không rõ'}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.due}>Deadline: {item.ngayKetThuc ? new Date(item.ngayKetThuc).toLocaleDateString('vi-VN') : 'Chưa rõ'}</Text>
                  <TouchableOpacity
                    style={styles.requestBtn}
                    onPress={() => handleRequest(item.id)}
                    disabled={requestingId === item.id}
                  >
                    {requestingId === item.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.requestText}>Yêu cầu nhận việc</Text>}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selected && (
              <>
                <Text style={styles.modalTitle}>{selected.tenSubtask}</Text>
                <Text style={styles.modalSub}>{selected.taskName}</Text>
                <Text style={styles.modalDesc}>{selected.mota || '—'}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity style={styles.modalClose} onPress={() => setSelected(null)}>
                    <Text style={styles.modalCloseText}>Đóng</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.requestBtnModal} onPress={() => { setSelected(null); handleRequest(selected.id); }}>
                    <Text style={styles.requestText}>Yêu cầu nhận việc</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fb' },
  header: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 8, marginRight: 6, borderRadius: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#6b7280', marginTop: 4 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  empty: { padding: 24, alignItems: 'center', width: '100%', justifyContent: 'center' },
  emptyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, width: '100%', borderWidth: 1, borderColor: '#eef2ff', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 4 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  emptyTitleLarge: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  emptySubtitle: { color: '#6b7280', marginTop: 6 },
  primaryBtn: { backgroundColor: '#5b6df6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  ghostBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6e9ff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  ghostBtnText: { color: '#374151', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#eef2ff', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  cardHeader: { marginBottom: 8 },
  cardTitle: { fontWeight: '700', color: '#111827' },
  cardTaskName: { color: '#6b7280', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  due: { color: '#6b7280' },
  requestBtn: { backgroundColor: '#667eea', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  requestText: { color: '#fff', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalSub: { color: '#6b7280', marginTop: 6 },
  modalDesc: { marginTop: 8, color: '#374151' },
  modalClose: { padding: 10, borderRadius: 8, backgroundColor: '#e5e7eb' },
  modalCloseText: { color: '#111827', fontWeight: '700' },
  requestBtnModal: { marginLeft: 8, backgroundColor: '#667eea', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }
});

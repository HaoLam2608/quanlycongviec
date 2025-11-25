import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUnassignedSubtasks, claimSubtask } from '../../../src/axios/api';

export default function MemberAvailableSubtasks() {
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
      const available = normalized.filter(s => !s.nguoiThucHien && !s.isPendingAssignment);
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
        <Text style={styles.title}>Công việc trống của nhóm</Text>
        <Text style={styles.subtitle}>Các công việc con chưa được gán</Text>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#667eea" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} refreshControl={undefined}>
          {subtasks.length === 0 ? (
            <View style={styles.empty}><Text style={styles.emptyText}>Không có công việc trống</Text></View>
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
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#6b7280', marginTop: 4 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#6b7280' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eef2ff' },
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

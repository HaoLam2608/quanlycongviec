import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 8,
    color: '#6b7280'
  },
  boardContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: 'flex-start'
  },
  column: {
    width: 300,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eef2ff'
  },
  columnHeader: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  columnTitle: {
    fontWeight: '700',
    color: '#111827'
  },
  columnCount: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  columnCountText: {
    fontWeight: '700',
    color: '#111827'
  },
  columnContent: {
    minHeight: 100,
    padding: 10
  },
  emptyColumn: {
    alignItems: 'center',
    padding: 24
  },
  emptyColumnText: {
    color: '#9ca3af'
  },
  taskCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee6ff'
  },
  taskCardDragging: {
    opacity: 0.9,
    transform: [{ scale: 1.02 }]
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    marginRight: 8
  },
  taskTitle: {
    flex: 1,
    fontWeight: '700',
    color: '#111827'
  },
  taskActionBtn: {
    paddingHorizontal: 8
  },
  taskActionText: {
    color: '#6b7280',
    fontSize: 18
  },
  taskDesc: {
    marginTop: 6,
    color: '#4b5563'
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  assigneeAvatar: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: '#e9d5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  assigneeInitial: {
    color: '#6b21a8',
    fontWeight: '700'
  },
  assigneeName: {
    color: '#374151',
    fontWeight: '600'
  },
  dueDate: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 12
  },
  taskPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8
  },
  taskPreviewTitle: {
    fontWeight: '700',
    color: '#111827'
  }
});

export const modalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    marginBottom: 8
  },
  modalSubtitle: {
    color: '#6b7280',
    marginBottom: 12
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderLeftWidth: 6,
    borderLeftColor: '#ccc',
    marginBottom: 8,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusText: {
    fontWeight: '700'
  },
  statusCount: {
    color: '#6b7280'
  },
  modalActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#e5e7eb'
  },
  cancelButtonText: {
    color: '#111827',
    fontWeight: '700'
  }
});

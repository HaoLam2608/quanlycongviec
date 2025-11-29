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
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a'
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4
  },
  headerStats: {
    alignItems: 'flex-end'
  },
  headerStatsText: {
    color: '#6b7280',
    fontSize: 12
  },
  headerStatsNumber: {
    fontWeight: '700'
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#eef2ff'
  },

  // small elevation for search input
  searchBoxElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#111827'
  },
  filterButton: {
    marginLeft: 8,
    backgroundColor: '#667eea',
    padding: 10,
    borderRadius: 12
  },
  filterPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  filterRow: {
    marginBottom: 8
  },
  filterLabel: {
    fontWeight: '700',
    marginBottom: 6
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  filterChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8
  },
  filterChipActive: {
    backgroundColor: '#ede9fe',
    borderColor: '#7c3aed'
  },
  filterChipText: {
    color: '#374151'
  },
  filterChipTextActive: {
    color: '#7c3aed',
    fontWeight: '700'
  },
  tasksList: {
    flex: 1
  },
  tasksContent: {
    padding: 18,
    paddingBottom: 28
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    flex: 1,
    justifyContent: 'center'
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700'
  },
  emptyText: {
    marginTop: 6,
    color: '#6b7280'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '96%',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 6,
    // Allow modal to use more vertical space so content is visible
    maxHeight: '96%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  modalBody: {
    marginTop: 12,
    // Constrain modal body height so inner ScrollView can scroll properly
    maxHeight: '88%',
    paddingBottom: 4,
  },
  modalTaskTitle: {
    fontSize: 16,
    fontWeight: '700'
  },
  modalDescription: {
    color: '#4b5563',
    marginTop: 8
  },
  modalSection: {
    marginTop: 12
  },
  modalSectionLabel: {
    fontWeight: '700',
    color: '#374151'
  },
  modalSectionValue: {
    marginTop: 6,
    color: '#111827'
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  statusButtonActive: {
    backgroundColor: '#7c3aed'
  },
  statusButtonText: {
    color: '#374151',
    fontWeight: '700'
  },
  statusButtonTextActive: {
    color: '#fff'
  },
  worklogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  worklogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  worklogButtonText: {
    color: '#667eea',
    fontWeight: '700'
  },
  worklogList: {
    marginTop: 8
  },
  worklogEmpty: {
    alignItems: 'center',
    padding: 12
  },
  worklogEmptyText: {
    marginTop: 6,
    color: '#6b7280'
  },
  worklogItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eef2ff'
  },
  worklogItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  worklogItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  worklogDate: {
    color: '#6b7280'
  },
  worklogHours: {
    color: '#374151',
    fontWeight: '700'
  },
  worklogNote: {
    marginTop: 8,
    color: '#4b5563'
  },
  worklogUser: {
    marginTop: 6,
    color: '#6b7280'
  }
});
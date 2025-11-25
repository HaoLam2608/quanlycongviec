import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb'
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d2b8f'
  },
  headerSubtitle: {
    marginTop: 4,
    color: '#6b7280'
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#eae6ff'
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#111827'
  },
  projectsList: {
    flex: 1
  },
  projectsContent: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eef2ff'
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  projectInfo: {
    flex: 1
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827'
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12
  },
  projectDescription: {
    marginTop: 8,
    color: '#4b5563'
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    alignItems: 'center'
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaText: {
    color: '#6b7280'
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  statItem: {
    flex: 1
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280'
  },
  statValue: {
    fontWeight: '700',
    color: '#111827'
  },
  statPercent: {
    color: '#6b7280',
    fontSize: 12
  },
  projectDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dateText: {
    color: '#6b7280'
  },
  kanbanButton: {
    marginTop: 12,
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  kanbanButtonText: {
    color: '#fff',
    fontWeight: '700'
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
  emptyContainer: {
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#374151'
  },
  emptyText: {
    marginTop: 6,
    color: '#6b7280'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700'
  },
  modalBody: {
    padding: 16
  },
  modalProjectName: {
    fontSize: 18,
    fontWeight: '700'
  },
  modalStatusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8
  },
  modalStatusText: {
    color: '#fff',
    fontWeight: '700'
  },
  modalSection: {
    marginTop: 12
  },
  modalSectionLabel: {
    fontWeight: '700',
    color: '#374151'
  },
  modalDescription: {
    marginTop: 8,
    color: '#4b5563'
  },
  modalInfoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 12
  },
  modalInfoContent: {
    flex: 1
  },
  modalInfoLabel: {
    fontSize: 12,
    color: '#6b7280'
  },
  modalInfoValue: {
    fontWeight: '700',
    color: '#111827'
  },
  progressContainer: {
    marginTop: 8
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressLabel: {
    color: '#6b7280'
  },
  progressValue: {
    fontWeight: '700'
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8
  },
  progressBar: {
    height: 8,
    backgroundColor: '#6366f1'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  statBoxValue: {
    fontWeight: '700',
    fontSize: 18
  },
  statBoxLabel: {
    color: '#6b7280'
  },
  documentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  uploadButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  documentsLoading: {
    alignItems: 'center',
    padding: 20
  },
  documentsLoadingText: {
    marginTop: 8,
    color: '#6b7280'
  },
  documentsEmpty: {
    alignItems: 'center',
    padding: 20
  },
  documentsEmptyText: {
    marginTop: 8,
    color: '#6b7280'
  },
  documentsList: {
    marginTop: 8
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  documentDetails: {
    maxWidth: 220
  },
  documentName: {
    fontWeight: '700'
  },
  documentMeta: {
    color: '#6b7280',
    fontSize: 12
  },
  documentActions: {
    flexDirection: 'row',
    gap: 8
  },
  documentActionButton: {
    padding: 6
  },
  calendarViewButton: {
    marginTop: 12,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  calendarViewButtonText: {
    color: '#fff',
    fontWeight: '700'
  }
});

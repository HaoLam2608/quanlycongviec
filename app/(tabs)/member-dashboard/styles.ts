import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerLeft: {
    flex: 1
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700'
  },
  subtitle: {
    color: '#6b7280'
  },
  headerRight: {
    width: 48,
    alignItems: 'flex-end'
  },
  statsContainer: {
    marginBottom: 12
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff'
  },
  statLabel: {
    color: 'rgba(255,255,255,0.9)'
  },
  section: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eef2ff'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sectionTitle: {
    fontWeight: '700'
  },
  sectionCount: {
    color: '#6b7280'
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    marginTop: 8,
    color: '#6b7280'
  },
  overdueTaskCard: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginBottom: 8
  },
  overdueTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  overdueTaskTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  overdueTaskTitle: {
    fontWeight: '700'
  },
  overdueDaysBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  overdueDaysText: {
    fontWeight: '700'
  },
  overdueTaskMeta: {
    marginTop: 8
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6
  },
  metaText: {
    color: '#6b7280'
  }
});
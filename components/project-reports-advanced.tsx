"use client"
import { useState, useEffect } from "react"
import {
  Plus, FileText, Calendar, User, CheckCircle, Clock, AlertCircle,
  Edit, Trash2, Send, Eye, Download, Upload, Filter, Search, X,
  TrendingUp, BarChart3, PieChart, FileDown
} from "lucide-react"
import {
  getReportsByDuAn,
  getReportStatistics,
  createReport,
  updateReport,
  deleteReport,
  submitReport,
  reviewReport,
  uploadAttachment,
  deleteAttachment,
  exportReportToPdf,
  type Report,
  type CreateReportData,
  type ReportFilters
} from "@/axios/reportApi"
import Modal from "./admin/Modal"
import ConfirmModal from "./admin/ConfirmModal"
import { useToastContext } from "./providers/toast-provider"

interface ProjectReportsAdvancedProps {
  duanId: number
  duanName: string
  userRole?: 'admin' | 'manager' | 'member'
}

const REPORT_TYPE_LABELS = {
  'tien_do': 'Tiến độ',
  'van_de': 'Vấn đề',
  'hoan_thanh': 'Hoàn thành',
  'tong_ket': 'Tổng kết',
  'khac': 'Khác'
}

const REPORT_TYPE_COLORS = {
  'tien_do': 'bg-blue-100 text-blue-800 border-blue-200',
  'van_de': 'bg-red-100 text-red-800 border-red-200',
  'hoan_thanh': 'bg-green-100 text-green-800 border-green-200',
  'tong_ket': 'bg-purple-100 text-purple-800 border-purple-200',
  'khac': 'bg-gray-100 text-gray-800 border-gray-200'
}

const STATUS_LABELS = {
  'draft': 'Nháp',
  'submitted': 'Đã gửi',
  'reviewed': 'Đã xem',
  'approved': 'Đã duyệt'
}

const STATUS_COLORS = {
  'draft': 'bg-gray-100 text-gray-800',
  'submitted': 'bg-blue-100 text-blue-800',
  'reviewed': 'bg-yellow-100 text-yellow-800',
  'approved': 'bg-green-100 text-green-800'
}

const STATUS_ICONS = {
  'draft': Clock,
  'submitted': Send,
  'reviewed': Eye,
  'approved': CheckCircle
}

export default function ProjectReportsAdvanced({ duanId, duanName, userRole = 'member' }: ProjectReportsAdvancedProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const { showSuccess, showError } = useToastContext()

  const [formData, setFormData] = useState<CreateReportData>({
    duanId,
    title: '',
    content: '',
    reportType: 'tien_do',
    reportDate: new Date().toISOString().split('T')[0],
    statistics: {},
    attachments: []
  })

  const [reviewData, setReviewData] = useState({
    reviewNote: '',
    approved: true
  })

  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  // Confirm modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'warning' as 'danger' | 'warning' | 'info' | 'success',
    icon: 'alert' as 'alert' | 'check' | 'trash' | 'send'
  })

  useEffect(() => {
    loadReports()
    loadStatistics()
  }, [duanId])

  useEffect(() => {
    applyFilters()
  }, [reports, filterStatus, filterType, searchTerm, dateRange])

  const loadReports = async () => {
    try {
      setLoading(true)
      const data = await getReportsByDuAn(duanId, {})
      setReports(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error('Error loading reports:', error)
      showError(error.response?.data?.message || 'Không thể tải báo cáo')
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const stats = await getReportStatistics(duanId)
      setStatistics(stats)
    } catch (error: any) {
      console.error('Failed to load statistics:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...reports]

    if (filterStatus) {
      filtered = filtered.filter(r => r.status === filterStatus)
    }

    if (filterType) {
      filtered = filtered.filter(r => r.reportType === filterType)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(term) ||
        r.content.toLowerCase().includes(term) ||
        r.creator?.hoten?.toLowerCase().includes(term)
      )
    }

    if (dateRange.start) {
      filtered = filtered.filter(r => new Date(r.reportDate) >= new Date(dateRange.start))
    }

    if (dateRange.end) {
      filtered = filtered.filter(r => new Date(r.reportDate) <= new Date(dateRange.end))
    }

    setFilteredReports(filtered)
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.content) {
      showError('Vui lòng nhập đầy đủ thông tin')
      return
    }

    try {
      const response = await createReport(formData)
      showSuccess('Tạo báo cáo thành công!')
      setShowCreateModal(false)
      resetForm()
      await loadReports()
      await loadStatistics()
    } catch (error: any) {
      showError(error.response?.data?.message || 'Không thể tạo báo cáo')
    }
  }

  const handleUpdate = async () => {
    if (!selectedReport) return
    try {
      await updateReport(selectedReport.id, {
        title: formData.title,
        content: formData.content,
        reportType: formData.reportType,
        reportDate: formData.reportDate,
        statistics: formData.statistics,
        attachments: formData.attachments
      })
      showSuccess('Cập nhật báo cáo thành công!')
      setShowCreateModal(false)
      setSelectedReport(null)
      resetForm()
      await loadReports()
      await loadStatistics()
    } catch (error: any) {
      showError(error.response?.data?.message || 'Không thể cập nhật báo cáo')
    }
  }

  const handleSubmit = async (reportId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Gửi báo cáo',
      message: 'Bạn có chắc muốn gửi báo cáo này? Sau khi gửi sẽ không thể chỉnh sửa.',
      type: 'info',
      icon: 'send',
      onConfirm: async () => {
        try {
          await submitReport(reportId)
          showSuccess('Gửi báo cáo thành công!')
          await loadReports()
          await loadStatistics()
        } catch (error: any) {
          showError(error.response?.data?.message || 'Không thể gửi báo cáo')
        }
      }
    })
  }

  const handleReview = async () => {
    if (!selectedReport) return
    try {
      await reviewReport(selectedReport.id, reviewData.reviewNote, reviewData.approved)
      showSuccess(reviewData.approved ? 'Duyệt báo cáo thành công!' : 'Đã xem xét báo cáo!')
      setShowReviewModal(false)
      setSelectedReport(null)
      setReviewData({ reviewNote: '', approved: true })
      await loadReports()
      await loadStatistics()
    } catch (error: any) {
      showError(error.response?.data?.message || 'Không thể xem xét báo cáo')
    }
  }

  const handleDelete = async (reportId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa báo cáo',
      message: 'Bạn có chắc muốn xóa báo cáo này? Hành động này không thể hoàn tác.',
      type: 'danger',
      icon: 'trash',
      onConfirm: async () => {
        try {
          await deleteReport(reportId)
          showSuccess('Xóa báo cáo thành công!')
          await loadReports()
          await loadStatistics()
        } catch (error: any) {
          showError(error.response?.data?.message || 'Không thể xóa báo cáo')
        }
      }
    })
  }

  const handleExport = async (reportId?: number) => {
    if (!reportId && !selectedReport) {
      showError('Không có báo cáo nào được chọn')
      return
    }

    try {
      const id = reportId || selectedReport!.id
      await exportReportToPdf(id)
      showSuccess('Xuất PDF thành công!')
    } catch (error: any) {
      showError(error.response?.data?.message || 'Không thể xuất PDF')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(file => uploadAttachment(file))
      const uploadedFiles = await Promise.all(uploadPromises)

      setUploadedFiles(prev => [...prev, ...uploadedFiles])
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...uploadedFiles]
      }))

      showSuccess(`Upload ${files.length} file thành công!`)
    } catch (error: any) {
      showError(error.response?.data?.message || 'Không thể upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = async (filename: string) => {
    try {
      await deleteAttachment(filename)
      setUploadedFiles(prev => prev.filter(f => f.filename !== filename))
      setFormData(prev => ({
        ...prev,
        attachments: (prev.attachments || []).filter((f: any) => f.filename !== filename)
      }))
      showSuccess('Xóa file thành công!')
    } catch (error: any) {
      showError(error.response?.data?.message || 'Không thể xóa file')
    }
  }

  const resetForm = () => {
    setFormData({
      duanId,
      title: '',
      content: '',
      reportType: 'tien_do',
      reportDate: new Date().toISOString().split('T')[0],
      statistics: {},
      attachments: []
    })
    setUploadedFiles([])
  }

  const openEditModal = (report: Report) => {
    setSelectedReport(report)
    const attachments = Array.isArray(report.attachments) ? report.attachments : []
    setFormData({
      duanId,
      title: report.title,
      content: report.content,
      reportType: report.reportType,
      reportDate: report.reportDate.split('T')[0],
      statistics: report.statistics || {},
      attachments: attachments
    })
    setUploadedFiles(attachments)
    setShowCreateModal(true)
  }

  const openViewModal = (report: Report) => {
    setSelectedReport(report)
    setShowViewModal(true)
  }

  const openReviewModal = (report: Report) => {
    setSelectedReport(report)
    setShowReviewModal(true)
  }

  const clearFilters = () => {
    setFilterStatus('')
    setFilterType('')
    setSearchTerm('')
    setDateRange({ start: '', end: '' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const activeFiltersCount = [filterStatus, filterType, searchTerm, dateRange.start, dateRange.end]
    .filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Báo cáo dự án
          </h2>
          <p className="text-gray-600 mt-1">{duanName}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowStatsModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Thống kê
          </button>
          <button
            onClick={() => {
              resetForm()
              setSelectedReport(null)
              setShowCreateModal(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo báo cáo
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalReports || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nháp</p>
                <p className="text-2xl font-bold text-gray-600">{statistics.draft || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã gửi</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.submitted || 0}</p>
              </div>
              <Send className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã xem</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.reviewed || 0}</p>
              </div>
              <Eye className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600">{statistics.approved || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
              {activeFiltersCount} đang áp dụng
            </span>
          )}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo tiêu đề, nội dung, người tạo..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả loại</option>
            {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Export */}
          <button
            onClick={() => handleExport()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Xuất PDF
          </button>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredReports.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || filterStatus || filterType || dateRange.start || dateRange.end
                ? 'Không tìm thấy báo cáo phù hợp'
                : 'Chưa có báo cáo nào'}
            </p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const StatusIcon = STATUS_ICONS[report.status]
            return (
              <div
                key={report.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1">
                      {report.title}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded border ${REPORT_TYPE_COLORS[report.reportType]}`}>
                      {REPORT_TYPE_LABELS[report.reportType]}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {report.content}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.reportDate).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {report.creator?.hoten || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="w-4 h-4 text-gray-600" />
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${STATUS_COLORS[report.status]}`}>
                      {STATUS_LABELS[report.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openViewModal(report)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Xem"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {report.status === 'draft' && (
                      <>
                        <button
                          onClick={() => openEditModal(report)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSubmit(report.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Gửi"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {(userRole === 'admin' || userRole === 'manager') && report.status === 'submitted' && (
                      <button
                        onClick={() => openReviewModal(report)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Xem xét"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setSelectedReport(null); resetForm(); }}
        title={selectedReport ? 'Cập nhật báo cáo' : 'Tạo báo cáo mới'}
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tiêu đề báo cáo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại báo cáo</label>
                <select
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày báo cáo</label>
                <input
                  type="date"
                  value={formData.reportDate}
                  onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập nội dung báo cáo chi tiết..."
              />
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tài liệu đính kèm
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    {uploading ? 'Đang upload...' : 'Click để chọn file'}
                  </p>
                  <p className="text-xs text-gray-500">PDF, Word, Excel, PowerPoint, Images (max 10MB)</p>
                </label>
              </div>

              {/* Display uploaded files */}
              {Array.isArray(uploadedFiles) && uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700 truncate">{file.originalname || file.name}</span>
                        <span className="text-xs text-gray-500">({((file.size || 0) / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(file.filename)}
                        className="text-red-600 hover:text-red-700"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              onClick={() => { setShowCreateModal(false); setSelectedReport(null); resetForm(); }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              onClick={selectedReport ? handleUpdate : handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {selectedReport ? 'Cập nhật' : 'Tạo báo cáo'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedReport(null); }}
        title={selectedReport?.title || 'Chi tiết báo cáo'}
      >
        {selectedReport && (
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded ${STATUS_COLORS[selectedReport.status]}`}>
                  {STATUS_LABELS[selectedReport.status]}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded border ${REPORT_TYPE_COLORS[selectedReport.reportType]}`}>
                  {REPORT_TYPE_LABELS[selectedReport.reportType]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Ngày báo cáo:</span>
                  <p className="font-medium">{new Date(selectedReport.reportDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Người tạo:</span>
                  <p className="font-medium">{selectedReport.creator?.hoten || 'N/A'}</p>
                </div>
                {selectedReport.reviewedBy && (
                  <>
                    <div>
                      <span className="text-gray-600">Người duyệt:</span>
                      <p className="font-medium">{selectedReport.reviewer?.hoten || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Ngày duyệt:</span>
                      <p className="font-medium">
                        {selectedReport.reviewedAt ? new Date(selectedReport.reviewedAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Nội dung:</h4>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700 max-h-96 overflow-y-auto">
                  {selectedReport.content}
                </div>
              </div>

              {selectedReport.reviewNote && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ghi chú từ người duyệt:</h4>
                  <div className="bg-yellow-50 rounded-lg p-4 text-gray-700">
                    {selectedReport.reviewNote}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              {Array.isArray(selectedReport.attachments) && selectedReport.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">File đính kèm:</h4>
                  <div className="space-y-2">
                    {selectedReport.attachments.map((file: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-700">{file.originalname || 'File'}</span>
                          <span className="text-xs text-gray-500">({((file.size || 0) / 1024).toFixed(1)} KB)</span>
                        </div>
                        <a
                          href={`https://taskhadflow-api.nibies.space${file.url || `/uploads/reports/${file.filename}`}`}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm">Tải xuống</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => handleExport(selectedReport.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                Xuất PDF
              </button>
              <button
                onClick={() => { setShowViewModal(false); setSelectedReport(null); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => { setShowReviewModal(false); setSelectedReport(null); setReviewData({ reviewNote: '', approved: true }); }}
        title="Xem xét báo cáo"
      >
        {selectedReport && (
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">{selectedReport.title}</h4>
                <p className="text-sm text-blue-700">Người tạo: {selectedReport.creator?.hoten}</p>
                <p className="text-sm text-blue-700">Ngày báo cáo: {new Date(selectedReport.reportDate).toLocaleDateString('vi-VN')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú xem xét</label>
                <textarea
                  value={reviewData.reviewNote}
                  onChange={(e) => setReviewData({ ...reviewData, reviewNote: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập ghi chú của bạn..."
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={reviewData.approved}
                    onChange={() => setReviewData({ ...reviewData, approved: true })}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm font-medium text-green-700">Phê duyệt</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!reviewData.approved}
                    onChange={() => setReviewData({ ...reviewData, approved: false })}
                    className="w-4 h-4 text-yellow-600"
                  />
                  <span className="text-sm font-medium text-yellow-700">Chỉ xem xét</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => { setShowReviewModal(false); setSelectedReport(null); setReviewData({ reviewNote: '', approved: true }); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleReview}
                className={`px-4 py-2 text-white rounded-lg ${reviewData.approved ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
              >
                {reviewData.approved ? 'Phê duyệt' : 'Xác nhận xem xét'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Statistics Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Thống kê báo cáo"
      >
        <div className="p-6">
          {statistics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <PieChart className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="text-sm text-blue-700 mb-1">Tổng số báo cáo</p>
                  <p className="text-3xl font-bold text-blue-900">{statistics.totalReports || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-sm text-green-700 mb-1">Tỷ lệ duyệt</p>
                  <p className="text-3xl font-bold text-green-900">
                    {statistics.totalReports > 0
                      ? Math.round((statistics.approved / statistics.totalReports) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Phân bổ theo loại</h4>
                <div className="space-y-2">
                  {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => {
                    const count = reports.filter(r => r.reportType === key).length
                    const percentage = reports.length > 0 ? (count / reports.length) * 100 : 0
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <div className="flex items-center gap-3 flex-1 max-w-xs">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Phân bổ theo trạng thái</h4>
                <div className="space-y-2">
                  {Object.entries(STATUS_LABELS).map(([key, label]) => {
                    const count = statistics[key] || 0
                    const percentage = statistics.total > 0 ? (count / statistics.total) * 100 : 0
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <div className="flex items-center gap-3 flex-1 max-w-xs">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {count}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6 pt-6 border-t">
            <button
              onClick={() => setShowStatsModal(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        icon={confirmModal.icon}
      />
    </div>
  )
}

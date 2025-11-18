"use client"
import { useState, useEffect } from "react"
import { Search, Upload, File, Folder, Download, Trash2, FileText, Image as ImageIcon, FileArchive, Layers } from "lucide-react"
import api from "@/axios/config"
import { useToastContext } from '@/components/providers/toast-provider'
import { useGlobalConfirm } from '@/components/GlobalConfirmProvider'

interface Document {
    id: number
    tenTaiLieu: string
    moTa?: string
    duongDan: string
    kichThuoc: number
    loaiTaiLieu: string
    uploadedBy?: { id: number; hoten: string }
    createdAt: string
    project?: { id: number; tenduan: string } | null
    group?: { id: number; name: string } | null
}

interface ProjectOption {
    id: number
    tenduan: string
}

export default function TeamLeadDocumentsPage() {
    const { showError, showSuccess } = useToastContext()
    const { confirm } = useGlobalConfirm()
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [projectFilter, setProjectFilter] = useState<string>("all")
    const [uploading, setUploading] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadForm, setUploadForm] = useState({
        file: null as File | null,
        tenTaiLieu: "",
        moTa: "",
        projectId: ""
    })
    const [availableProjects, setAvailableProjects] = useState<ProjectOption[]>([])

    useEffect(() => {
        loadDocuments()
        loadProjects()
    }, [])

    useEffect(() => {
        if (!documents.length) return
        setAvailableProjects(prev => {
            const projectMap = new Map(prev.map(project => [project.id, project]))
            documents.forEach(doc => {
                if (doc.project?.id) {
                    projectMap.set(doc.project.id, {
                        id: doc.project.id,
                        tenduan: doc.project.tenduan || `Dự án #${doc.project.id}`
                    })
                }
            })
            return Array.from(projectMap.values())
        })
    }, [documents])

    const loadDocuments = async () => {
        setLoading(true)
        try {
            // API endpoint để lấy tài liệu của nhóm
            const res = await api.get('/documents/group-documents')
            setDocuments(res.data.documents || res.data || [])
        } catch (error: any) {
            console.error('Load documents error:', error)
            showError(error.response?.data?.message || 'Lỗi tải danh sách tài liệu')
        } finally {
            setLoading(false)
        }
    }

    const loadProjects = async () => {
        try {
            const res = await api.get('/groups/my-projects')
            const projectsData = res.data.projects || []
            const uniqueProjects: ProjectOption[] = []

            projectsData.forEach((item: any) => {
                const project = item.project || item.duan || item
                if (project?.id && !uniqueProjects.some(p => p.id === project.id)) {
                    uniqueProjects.push({ id: project.id, tenduan: project.tenduan || project.name || `Dự án #${project.id}` })
                }
            })

            // Merge with projects deduced from documents (in case API not ready)
            documents.forEach(doc => {
                if (doc.project?.id && !uniqueProjects.some(p => p.id === doc.project!.id)) {
                    uniqueProjects.push({ id: doc.project.id, tenduan: doc.project.tenduan })
                }
            })

            setAvailableProjects(uniqueProjects)
        } catch (error) {
            console.error('Load projects for documents error:', error)
        }
    }

    const handleUpload = async () => {
        if (!uploadForm.file) {
            showError('Vui lòng chọn file')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', uploadForm.file)
            formData.append('originalname', uploadForm.tenTaiLieu || uploadForm.file.name)
            if (uploadForm.moTa) formData.append('description', uploadForm.moTa)
            if (uploadForm.projectId) formData.append('duanId', uploadForm.projectId)

            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            showSuccess('Tải lên thành công')
            setShowUploadModal(false)
            setUploadForm({ file: null, tenTaiLieu: "", moTa: "", projectId: "" })
            loadDocuments()
        } catch (error: any) {
            showError(error.response?.data?.message || 'Lỗi tải lên tài liệu')
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (docId: number) => {
        const confirmed = await confirm({
            title: 'Xác nhận xóa',
            message: 'Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.',
            confirmText: 'Xóa',
            cancelText: 'Hủy'
        })
        if (!confirmed) return

        try {
            await api.delete(`/documents/${docId}`)
            showSuccess('Đã xóa tài liệu')
            loadDocuments()
        } catch (error: any) {
            showError(error.response?.data?.message || 'Lỗi xóa tài liệu')
        }
    }

    const handleDownload = async (doc: Document) => {
        try {
            const res = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([res.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', doc.tenTaiLieu)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            showSuccess('Đang tải xuống...')
        } catch (error: any) {
            showError(error.response?.data?.message || 'Lỗi tải xuống tài liệu')
        }
    }

    const getFileIcon = (type: string) => {
        if (type.includes('image')) return <ImageIcon className="w-8 h-8 text-blue-600" />
        if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-600" />
        if (type.includes('zip') || type.includes('rar')) return <FileArchive className="w-8 h-8 text-yellow-600" />
        return <File className="w-8 h-8 text-gray-600" />
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / 1048576).toFixed(1) + ' MB'
    }

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.tenTaiLieu.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.moTa?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = typeFilter === "all" || doc.loaiTaiLieu.includes(typeFilter)
        const matchesProject = projectFilter === "all" || String(doc.project?.id || '') === projectFilter
        return matchesSearch && matchesType && matchesProject
    })

    const totalSize = documents.reduce((sum, doc) => sum + doc.kichThuoc, 0)
    const docTypes = Array.from(new Set(documents.map(d => d.loaiTaiLieu.split('/')[0])))
    const projectOptions = Array.from(new Map([
        ...availableProjects.map(project => [project.id, project] as const),
        ...documents
            .filter(doc => doc.project?.id)
            .map(doc => [doc.project!.id, {
                id: doc.project!.id,
                tenduan: doc.project!.tenduan || `Dự án #${doc.project!.id}`
            }] as const)
    ]).values())

    const groupedByProject = filteredDocuments.reduce<Record<string, Document[]>>((acc, doc) => {
        const key = doc.project?.id ? `${doc.project.id}` : 'no-project'
        if (!acc[key]) acc[key] = []
        acc[key].push(doc)
        return acc
    }, {})

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-12 bg-gray-200 rounded"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Tài liệu dự án của nhóm</h1>
                    <p className="text-gray-600 mt-1">Xem và quản lý tài liệu thuộc các dự án mà bạn đang phụ trách</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg"
                >
                    <Upload size={20} />
                    Tải lên
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <File className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tổng tài liệu</p>
                            <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Folder className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Loại file</p>
                            <p className="text-2xl font-bold text-gray-900">{docTypes.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <FileArchive className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tổng dung lượng</p>
                            <p className="text-2xl font-bold text-gray-900">{formatFileSize(totalSize)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Tải lên hôm nay</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {documents.filter(d => new Date(d.createdAt).toDateString() === new Date().toDateString()).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Layers className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Số dự án có tài liệu</p>
                            <p className="text-2xl font-bold text-gray-900">{projectOptions.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tài liệu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    >
                        <option value="all">Tất cả loại file</option>
                        <option value="image">Hình ảnh</option>
                        <option value="pdf">PDF</option>
                        <option value="zip">Nén (ZIP/RAR)</option>
                        <option value="text">Văn bản</option>
                    </select>
                    <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    >
                        <option value="all">Tất cả dự án</option>
                        {projectOptions.map(project => (
                            <option key={project.id} value={String(project.id)}>{project.tenduan}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Documents by project */}
            {filteredDocuments.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                    <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Không có tài liệu nào phù hợp bộ lọc hiện tại</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedByProject).map(([projectId, docs]) => {
                        const projectInfo = projectId !== 'no-project'
                            ? projectOptions.find(p => String(p.id) === projectId) || null
                            : null
                        return (
                            <div key={projectId} className="bg-white rounded-2xl shadow-lg border border-gray-100">
                                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            {projectInfo ? projectInfo.tenduan : 'Tài liệu khác'}
                                        </h2>
                                        <p className="text-sm text-gray-500">{docs.length} tài liệu</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
                                    {docs.map(doc => (
                                        <div key={doc.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-gray-200">
                                                    {getFileIcon(doc.loaiTaiLieu)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-900 truncate">{doc.tenTaiLieu}</h3>
                                                    <p className="text-xs text-gray-500">{formatFileSize(doc.kichThuoc)}</p>
                                                    {doc.group && (
                                                        <span className="mt-1 inline-block px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-100 rounded-full">
                                                            Nhóm: {doc.group.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {doc.moTa && (
                                                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{doc.moTa}</p>
                                            )}
                                            <div className="flex items-center justify-between mb-3 text-xs text-gray-600">
                                                <span>{doc.uploadedBy?.hoten || 'N/A'}</span>
                                                <span>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleDownload(doc)}
                                                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1 transition-all"
                                                >
                                                    <Download size={16} />
                                                    Tải xuống
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tải lên tài liệu</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn file</label>
                                <input
                                    type="file"
                                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null, tenTaiLieu: e.target.files?.[0]?.name || "" })}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên tài liệu</label>
                                <input
                                    type="text"
                                    value={uploadForm.tenTaiLieu}
                                    onChange={(e) => setUploadForm({ ...uploadForm, tenTaiLieu: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                    placeholder="Tên hiển thị..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Thuộc dự án</label>
                                <select
                                    value={uploadForm.projectId}
                                    onChange={(e) => setUploadForm({ ...uploadForm, projectId: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                >
                                    <option value="">-- Chọn dự án --</option>
                                    {availableProjects.map(project => (
                                        <option key={project.id} value={String(project.id)}>{project.tenduan}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Tài liệu sẽ hiển thị trong dự án đã chọn.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả (tùy chọn)</label>
                                <textarea
                                    value={uploadForm.moTa}
                                    onChange={(e) => setUploadForm({ ...uploadForm, moTa: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none resize-none"
                                    rows={3}
                                    placeholder="Mô tả ngắn gọn về tài liệu..."
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={handleUpload}
                                disabled={uploading || !uploadForm.file}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-all"
                            >
                                {uploading ? 'Đang tải lên...' : 'Tải lên'}
                            </button>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-all"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

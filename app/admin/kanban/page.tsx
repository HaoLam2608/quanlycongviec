"use client"

import { useEffect, useState } from "react"
import { fetchProjects, getKanbanTasks } from "@/axios/api"

export default function AdminKanbanPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [kanban, setKanban] = useState<any>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const res = await fetchProjects()
      const list = res.duans || res || []
      setProjects(list)
      if (list.length > 0) {
        setSelectedProject(list[0])
        loadKanban(list[0].id)
      }
    } catch (err) {
      console.error('Load projects error', err)
    }
  }

  const loadKanban = async (projectId: number) => {
    try {
      setLoading(true)
      const data = await getKanbanTasks(projectId)
      // prefer data.kanban or data
      setKanban(data.kanban || data || {})
    } catch (err) {
      console.error('Load kanban error', err)
    } finally {
      setLoading(false)
    }
  }

  const renderColumn = (title: string, items: any[]) => (
    <div className="w-80 bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{title}</h3>
        <div className="text-sm text-gray-500">{items?.length || 0}</div>
      </div>
      <div className="space-y-3">
        {items && items.length > 0 ? items.map((t: any) => (
          <div key={t.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50">
            <div className="font-medium text-sm">{t.tentask || t.title || 'Không có tiêu đề'}</div>
            {t.nguoiDuocGiao?.hoten && <div className="text-xs text-gray-500 mt-1">{t.nguoiDuocGiao.hoten}</div>}
          </div>
        )) : (
          <div className="text-sm text-gray-400 italic">Không có công việc</div>
        )}
      </div>
    </div>
  )

  const columns = [
    { key: 'Chưa bắt đầu', label: 'Chưa bắt đầu' },
    { key: 'Đang chạy', label: 'Đang chạy' },
    { key: 'Chờ xác nhận hoàn thành', label: 'Chờ xác nhận' },
    { key: 'Hoàn thành', label: 'Hoàn thành' }
  ]

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <p className="text-sm text-gray-500">Quản lý công việc theo cột trạng thái</p>
      </div>

      <div className="mb-4">
        <select value={selectedProject?.id || ''} onChange={(e) => { const id = Number(e.target.value); const p = projects.find(x => x.id === id); setSelectedProject(p); loadKanban(id); }} className="px-3 py-2 border rounded">
          {projects.map(p => <option key={p.id} value={p.id}>{p.tenduan || p.ten || `Project ${p.id}`}</option>)}
        </select>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6">
        {columns.map(col => renderColumn(col.label, kanban[col.key] || []))}
      </div>
    </div>
  )
}

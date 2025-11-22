"use client"

import React, { useEffect, useState } from 'react'
import { notificationUserAPI } from '@/axios/notificationAPI'
import { useRouter } from 'next/navigation'

export default function ApprovalsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<any[]>([])
  const [processingId, setProcessingId] = useState<number | null>(null)

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await notificationUserAPI.getMyNotifications({ limit: 200 })
      const items = Array.isArray(res.data) ? res.data : (res.data?.data || res.data || [])
      const reqs = (items || []).filter((n: any) => {
        const meta = n.userMeta || n.meta || (n.userNotification && n.userNotification.meta)
        return meta && (meta.requestToJoin === true || meta.requestToJoin)
      }).map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        createdAt: n.createdAt,
        meta: n.userMeta || n.meta || (n.userNotification && n.userNotification.meta)
      }))
      setRequests(reqs)
    } catch (err) {
      console.error('Error loading approvals:', err)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const accept = async (r: any) => {
    try {
      setProcessingId(r.id)
      await notificationUserAPI.acceptRequest({ taskId: r.meta.taskId, subtaskId: r.meta.subtaskId, requesterId: r.meta.requesterId })
      await notificationUserAPI.markAsRead(r.id)
      loadRequests()
      alert('Đã chấp nhận yêu cầu')
    } catch (err: any) {
      console.error('Accept error', err)
      alert(err?.response?.data?.message || 'Lỗi khi chấp nhận')
    } finally {
      setProcessingId(null)
    }
  }

  const decline = async (r: any) => {
    const reason = prompt('Lý do từ chối (không bắt buộc)') || ''
    try {
      setProcessingId(r.id)
      await notificationUserAPI.declineRequest({ taskId: r.meta.taskId, subtaskId: r.meta.subtaskId, requesterId: r.meta.requesterId, reason })
      await notificationUserAPI.markAsRead(r.id)
      loadRequests()
      alert('Đã từ chối yêu cầu')
    } catch (err: any) {
      console.error('Decline error', err)
      alert(err?.response?.data?.message || 'Lỗi khi từ chối')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Phê duyệt yêu cầu</h1>
        <div>
          <button onClick={() => router.back()} className="px-3 py-1 border rounded">Quay lại</button>
        </div>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : requests.length === 0 ? (
        <div>Hiện không có yêu cầu cần phê duyệt</div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div key={r.id} className="p-4 bg-white rounded shadow-sm flex items-start justify-between">
              <div>
                <div className="font-medium text-gray-900">{r.title}</div>
                <div className="text-sm text-gray-600 mt-1">{r.content}</div>
                <div className="text-xs text-gray-400 mt-2">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button disabled={processingId === r.id} onClick={() => accept(r)} className="px-3 py-1 bg-green-600 text-white rounded">Chấp nhận</button>
                <button disabled={processingId === r.id} onClick={() => decline(r)} className="px-3 py-1 bg-red-600 text-white rounded">Từ chối</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

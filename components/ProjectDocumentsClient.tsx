"use client"
import { useEffect, useState } from 'react'
import { fetchDocuments, downloadDocument } from '@/axios/api'

export default function ProjectDocumentsClient({ projectId }: { projectId: number | string }) {
    const [docs, setDocs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                setLoading(true)
                const res = await fetchDocuments(Number(projectId))
                const arr = Array.isArray(res) ? res : res.documents || res.data || []
                if (!mounted) return
                setDocs(arr)
            } catch (err) {
                console.error('Load documents error', err)
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        return () => { mounted = false }
    }, [projectId])

    const handleView = async (doc: any) => {
        try {
            const res = await downloadDocument(doc.id, false)
            const blob = res.blob
            const url = URL.createObjectURL(blob)
            
            const fileType = doc.loaiTaiLieu || doc.mimetype || ''
            
            if (fileType.includes('image') || fileType.includes('pdf')) {
                window.open(url, '_blank')
                setTimeout(() => URL.revokeObjectURL(url), 100)
            } else {
                handleDownload(doc.id)
            }
        } catch (err) {
            console.error('View error', err)
            window.alert('Không thể xem tài liệu')
        }
    }

    const handleDownload = async (id: number) => {
        try {
            const res = await downloadDocument(id, true)
            // create a blob link to download
            const url = URL.createObjectURL(res.blob)
            const a = document.createElement('a')
            a.href = url
            a.download = res.filename || `document-${id}`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Download error', err)
            window.alert('Không thể tải tài liệu')
        }
    }

    if (loading) return <div className="p-4">Đang tải tài liệu...</div>
    if (!docs || docs.length === 0) return <div className="p-4 text-muted-foreground">Chưa có tài liệu nào cho dự án này.</div>

    return (
        <div className="p-4 space-y-3">
            {docs.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between bg-white border border-border rounded-md p-3">
                    <div>
                        <div className="font-medium">{d.tenTaiLieu || d.originalname || d.filename}</div>
                        <div className="text-xs text-muted-foreground">{d.moTa || d.description || ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handleView(d)} 
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            Xem
                        </button>
                        <button 
                            onClick={() => handleDownload(d.id)} 
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Tải xuống
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

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
                        <div className="font-medium">{d.title || d.name || d.filename}</div>
                        <div className="text-xs text-muted-foreground">{d.description || ''}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleDownload(d.id)} className="px-3 py-1 bg-blue-600 text-white rounded-md">Tải xuống</button>
                        <a href={d.url || '#'} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Mở</a>
                    </div>
                </div>
            ))}
        </div>
    )
}

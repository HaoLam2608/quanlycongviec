"use client"
import { useEffect, useState } from 'react'
import { fetchDocuments, downloadDocument } from '@/axios/api'
const API_URL = "https://taskhadflow-api.nibies.space"

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

    const handlePreview = async (doc: any) => {
        try {
            // Try to get the document URL from API
            const apiUrl = API_URL
            const docPath = doc.duongDan || doc.filePath || doc.url

            if (docPath) {
                // If path starts with /, it's a server path
                const fullUrl = docPath.startsWith('http')
                    ? docPath
                    : `${apiUrl}${docPath.startsWith('/') ? '' : '/'}${docPath}`

                window.open(fullUrl, '_blank')
            } else {
                // Fallback: download and open
                const res = await downloadDocument(doc.id, true)
                const url = URL.createObjectURL(res.blob)
                window.open(url, '_blank')
                // Clean up after a delay
                setTimeout(() => URL.revokeObjectURL(url), 10000)
            }
        } catch (err) {
            console.error('Preview error', err)
            window.alert('Không thể xem trước tài liệu')
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
                        <button onClick={() => handlePreview(d)} className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700">Xem</button>
                        <button onClick={() => handleDownload(d.id)} className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">Tải xuống</button>
                    </div>
                </div>
            ))}
        </div>
    )
}

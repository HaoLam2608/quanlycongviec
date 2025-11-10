"use client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getProjectById } from "@/axios/api"
import ProjectReports from "@/components/project-reports"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProjectReportsPage() {
  const params = useParams()
  const projectId = String(params.id)
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const data = await getProjectById(projectId)
      setProject(data)
    } catch (error) {
      console.error('Failed to load project:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Không tìm thấy dự án</p>
        <Link href="/manager/projects" className="text-blue-600 hover:underline">
          Quay lại danh sách dự án
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/manager/projects/${projectId}`}
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại dự án
      </Link>

      <ProjectReports duanId={Number(projectId)} duanName={project.tenduan} />
    </div>
  )
}

import ProjectTimelineClient from "@/components/ProjectTimelineClient"

export default function ProjectTimelinePage({ params }: { params: { id: string } }) {
    return <ProjectTimelineClient projectId={params.id} />
}

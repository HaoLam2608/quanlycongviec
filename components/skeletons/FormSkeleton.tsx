export function FormSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="space-y-6">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>

        {/* Form Fields */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-100 rounded w-full"></div>
          </div>
        ))}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-100 rounded w-24"></div>
        </div>
      </div>
    </div>
  )
}

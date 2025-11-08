export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {['Chưa bắt đầu', 'Đang chạy', 'Hoàn thành'].map((status) => (
        <div key={status} className="flex-shrink-0 w-80">
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="animate-pulse">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 bg-gray-300 rounded w-32"></div>
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
              </div>

              {/* Cards */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6 mb-4"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

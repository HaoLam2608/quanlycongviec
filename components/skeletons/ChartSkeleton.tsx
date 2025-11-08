export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="space-y-3">
        {/* Chart bars */}
        {[80, 60, 90, 45, 70, 55].map((height, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div 
              className="bg-gray-300 rounded" 
              style={{ height: `${height}px`, flex: 1 }}
            ></div>
          </div>
        ))}
      </div>
    </div>
  )
}

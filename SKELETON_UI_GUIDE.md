# Hướng dẫn sử dụng Skeleton UI

## Tổng quan

Skeleton UI đã được triển khai cho các trang chính. Để thêm skeleton UI cho các trang còn lại, hãy làm theo hướng dẫn dưới đây.

## Pattern cơ bản

### 1. Trang có loading state riêng

Nếu trang của bạn đã có state `loading`, hãy thay thế phần loading hiện tại bằng skeleton:

**Trước:**
```tsx
if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )
}
```

**Sau:**
```tsx
if (loading) {
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header Skeleton */}
                <div className="mb-6">
                    <div className="h-9 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
                </div>

                {/* Content Skeleton - tùy chỉnh theo layout của trang */}
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                            <div className="h-6 bg-gray-200 rounded w-48 mb-3 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
```

### 2. Trang có loading inline (trong table/list)

Nếu loading state được hiển thị inline (như trong table):

**Trước:**
```tsx
{loading ? (
    <tr>
        <td colSpan={5} className="p-8 text-center">
            Đang tải dữ liệu...
        </td>
    </tr>
) : (
    // Data rows
)}
```

**Sau:**
```tsx
{loading ? (
    <>
        {[1, 2, 3, 4, 5].map(i => (
            <tr key={i} className="border-b">
                <td className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                </td>
                <td className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </td>
                {/* Thêm các cột khác tương tự */}
            </tr>
        ))}
    </>
) : (
    // Data rows
)}
```

## Các component Skeleton có sẵn

Đã tạo sẵn trong `components/skeletons/`:

### CardSkeleton
```tsx
import { CardSkeleton } from '@/components/skeletons'

<CardSkeleton count={3} />
```

### TableSkeleton
```tsx
import { TableSkeleton } from '@/components/skeletons'

<TableSkeleton rows={5} columns={4} />
```

### KanbanSkeleton
```tsx
import { KanbanSkeleton } from '@/components/skeletons'

<KanbanSkeleton columns={3} cards={4} />
```

### FormSkeleton
```tsx
import { FormSkeleton } from '@/components/skeletons'

<FormSkeleton fields={5} />
```

### ChartSkeleton
```tsx
import { ChartSkeleton } from '@/components/skeletons'

<ChartSkeleton />
```

## Ví dụ đã triển khai

### 1. Member Tasks Page (`app/member/tasks/page.tsx`)
- Header với title và description
- Filters (4 select boxes)
- Task list với cards

### 2. Member Dashboard (`app/member/dashboard/page.tsx`)
- Stats cards (4 cards)
- Today tasks list
- Upcoming tasks list

### 3. Member Projects (`app/member/projects/page.tsx`)
- Stats overview (4 stats)
- Project cards grid

### 4. Admin Users (`app/admin/users/page.tsx`)
- Table skeleton với avatar, name, role, actions

### 5. Admin Projects (`app/admin/projects/page.tsx`)
- Project cards grid với status badges

## Tips

1. **Match với layout thật**: Skeleton nên giống với layout thật nhất có thể
2. **Số lượng items**: Hiển thị 3-5 skeleton items cho danh sách
3. **animate-pulse**: Luôn thêm class `animate-pulse` cho hiệu ứng loading
4. **Width variants**: Dùng `w-full`, `w-3/4`, `w-1/2` để tạo variation tự nhiên
5. **Gray shades**: Dùng `bg-gray-200` cho skeleton và `bg-gray-50` cho background

## Các trang cần thêm Skeleton

### Member
- [x] Dashboard
- [x] Tasks  
- [x] Projects
- [ ] Reports (nếu có)
- [ ] Settings (nếu có)

### Admin
- [ ] Dashboard
- [x] Users
- [ ] Groups
- [x] Projects
- [ ] Settings
- [ ] Reports (nếu có)

### Manager
- [ ] Dashboard
- [ ] Teams
- [ ] Reports
- [ ] Analytics (nếu có)

## Lưu ý quan trọng

⚠️ **Next.js loading.tsx chỉ hoạt động với Server Components**

Các file `loading.tsx` đã tạo KHÔNG hoạt động với Client Components (`"use client"`). 

Để sử dụng skeleton với Client Components:
1. Sử dụng state `loading` trong component
2. Render skeleton khi `loading === true`
3. Render nội dung thật khi `loading === false`

```tsx
"use client"
export default function Page() {
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
        loadData().finally(() => setLoading(false))
    }, [])
    
    if (loading) {
        return <SkeletonUI />
    }
    
    return <ActualContent />
}
```

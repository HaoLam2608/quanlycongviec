import { toast } from '@/components/ui/use-toast'

// Global confirm function - sẽ được set bởi GlobalConfirmProvider
let globalConfirmFn: ((options: { title?: string; message: string; confirmText?: string; cancelText?: string }) => Promise<boolean>) | null = null

export const setGlobalConfirm = (fn: typeof globalConfirmFn) => {
  globalConfirmFn = fn
}

/**
 * Hiển thị thông báo thành công
 */
export const showSuccess = (message: string, title?: string) => {
  toast({
    title: title || 'Thành công',
    description: message,
    variant: 'default',
    className: 'bg-green-50 border-green-200 text-green-900',
  })
}

/**
 * Hiển thị thông báo lỗi
 */
export const showError = (message: string, title?: string) => {
  toast({
    title: title || 'Lỗi',
    description: message,
    variant: 'destructive',
  })
}

/**
 * Hiển thị thông báo cảnh báo
 */
export const showWarning = (message: string, title?: string) => {
  toast({
    title: title || 'Cảnh báo',
    description: message,
    variant: 'default',
    className: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  })
}

/**
 * Hiển thị thông báo thông tin
 */
export const showInfo = (message: string, title?: string) => {
  toast({
    title: title || 'Thông tin',
    description: message,
    variant: 'default',
    className: 'bg-blue-50 border-blue-200 text-blue-900',
  })
}

/**
 * Thay thế alert() - hiển thị thông báo
 */
export const showAlert = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  switch (type) {
    case 'success':
      showSuccess(message)
      break
    case 'error':
      showError(message)
      break
    case 'warning':
      showWarning(message)
      break
    default:
      showInfo(message)
  }
}

/**
 * Thay thế confirm() - hiển thị dialog xác nhận
 * Trả về Promise<boolean> - true nếu user xác nhận, false nếu hủy
 */
export const showConfirm = (
  message: string,
  title: string = 'Xác nhận',
  confirmText: string = 'Xác nhận',
  cancelText: string = 'Hủy'
): Promise<boolean> => {
  if (globalConfirmFn) {
    return globalConfirmFn({ message, title, confirmText, cancelText })
  }
  // Fallback nếu chưa có provider
  return Promise.resolve(window.confirm(message))
}


'use client'

import { useState, useCallback } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title: options.title || 'Xác nhận',
        message: options.message,
        confirmText: options.confirmText || 'Xác nhận',
        cancelText: options.cancelText || 'Hủy',
        onConfirm: async () => {
          if (options.onConfirm) {
            await options.onConfirm()
          }
          setConfirmState(null)
          resolve(true)
        },
        onCancel: () => {
          if (options.onCancel) {
            options.onCancel()
          }
          setConfirmState(null)
          resolve(false)
        },
      })
    })
  }, [])

  const closeConfirm = useCallback(() => {
    if (confirmState?.onCancel) {
      confirmState.onCancel()
    }
    setConfirmState(null)
  }, [confirmState])

  return {
    confirm,
    closeConfirm,
    confirmState,
  }
}


'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import ConfirmDialog from './ConfirmDialog'
import { setGlobalConfirm } from '@/lib/notifications'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function useGlobalConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useGlobalConfirm must be used within GlobalConfirmProvider')
  }
  return context
}

export function GlobalConfirmProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
      })
    })
  }

  // Set global confirm function để notifications.ts có thể sử dụng
  useEffect(() => {
    setGlobalConfirm(confirm)
  }, [])

  const handleConfirm = () => {
    if (confirmState) {
      confirmState.resolve(true)
      setConfirmState(null)
    }
  }

  const handleCancel = () => {
    if (confirmState) {
      confirmState.resolve(false)
      setConfirmState(null)
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          onClose={handleCancel}
          onConfirm={handleConfirm}
          title={confirmState.options.title || 'Xác nhận'}
          message={confirmState.options.message}
          confirmText={confirmState.options.confirmText}
          cancelText={confirmState.options.cancelText}
        />
      )}
    </ConfirmContext.Provider>
  )
}


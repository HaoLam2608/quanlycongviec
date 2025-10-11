'use client';

import React, { createContext, useContext } from 'react';
import { ToastNotification } from '@/components/ui/toast-notification';
import { useToast } from '@/hooks/use-toast-notification';

interface ToastContextType {
    showSuccess: (message: string, duration?: number) => void;
    showError: (message: string, duration?: number) => void;
    showWarning: (message: string, duration?: number) => void;
    showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const { toasts, hideToast, showSuccess, showError, showWarning, showInfo } = useToast();

    return (
        <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
            {children}
            {/* Render all toasts */}
            <div className="fixed top-4 right-4 z-50 flex flex-col space-y-3 max-w-lg">
                {toasts.map((toast) => (
                    <ToastNotification
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        isVisible={toast.isVisible}
                        onClose={() => hideToast(toast.id)}
                        duration={toast.duration}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToastContext() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToastContext must be used within a ToastProvider');
    }
    return context;
}
'use client';

import { useState, useCallback } from 'react';

interface ToastOptions {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

export function useToast() {
    const [toasts, setToasts] = useState<(ToastOptions & { id: string; isVisible: boolean })[]>([]);

    const showToast = useCallback((options: ToastOptions) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = {
            ...options,
            id,
            isVisible: true,
        };

        setToasts(prev => [...prev, newToast]);

        // Auto remove after duration
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, options.duration || 5000);
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showSuccess = useCallback((message: string, duration?: number) => {
        showToast({ message, type: 'success', duration });
    }, [showToast]);

    const showError = useCallback((message: string, duration?: number) => {
        showToast({ message, type: 'error', duration });
    }, [showToast]);

    const showWarning = useCallback((message: string, duration?: number) => {
        showToast({ message, type: 'warning', duration });
    }, [showToast]);

    const showInfo = useCallback((message: string, duration?: number) => {
        showToast({ message, type: 'info', duration });
    }, [showToast]);

    return {
        toasts,
        showToast,
        hideToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };
}
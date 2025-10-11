'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

interface ToastNotificationProps {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export function ToastNotification({
    message,
    type,
    isVisible,
    onClose,
    duration = 5000
}: ToastNotificationProps) {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            case 'info':
                return <Info className="h-5 w-5 text-blue-500" />;
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'info':
                return 'bg-blue-50 border-blue-200';
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    const getTextColor = () => {
        switch (type) {
            case 'success':
                return 'text-green-800';
            case 'error':
                return 'text-red-800';
            case 'warning':
                return 'text-yellow-800';
            case 'info':
                return 'text-blue-800';
            default:
                return 'text-blue-800';
        }
    };

    return (
        <div className="animate-in slide-in-from-top-2">
            <div className={`min-w-80 max-w-md border rounded-lg shadow-lg p-4 ${getBackgroundColor()}`}>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-relaxed ${getTextColor()}`}>
                            {message}
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <button
                            className={`inline-flex rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getTextColor()} hover:bg-opacity-20 hover:bg-gray-500 transition-colors`}
                            onClick={onClose}
                        >
                            <span className="sr-only">Đóng</span>
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
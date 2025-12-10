"use client";

import React, { useEffect, useState } from 'react';
import { AIChat } from './AIChat';
import { Button } from '@/components/ui/button';
import { Bot, X, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FloatingAI: React.FC = () => {
  // Default: panel closed on page load
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  if (!isOpen) {
    return (
      <div className={cn("fixed z-40", isMobile ? "bottom-20 right-4" : "bottom-22 right-6")}>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
          </span>
        </Button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className={cn("fixed z-40", isMobile ? "bottom-24 left-1/2 -translate-x-1/2" : "bottom-28 right-6")}>
        <Button
          size="lg"
          variant="secondary"
          className="h-12 px-4 rounded-full shadow-lg flex items-center gap-2"
          onClick={() => setIsMinimized(false)}
        >
          <Bot className="h-5 w-5" />
          <span className="font-semibold">AI Assistant</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed z-40",
          isMobile ? "inset-0 flex items-end justify-center p-3" : "bottom-28 right-6"
        )}
      >
        <div
          className={cn(
            "bg-card border shadow-2xl flex flex-col overflow-hidden",
            isMobile
              ? "w-full h-full max-h-[calc(100vh-1.5rem)] rounded-t-3xl rounded-b-none"
              : "w-[420px] h-[650px] rounded-lg"
          )}
        >
          {/* Header with minimize and close */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* AI Chat Component */}
          <div className="flex-1 overflow-hidden">
            <AIChat />
          </div>
        </div>
      </div>
    </>
  );
};

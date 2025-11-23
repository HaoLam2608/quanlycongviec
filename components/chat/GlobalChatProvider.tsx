"use client";

import React from 'react';
import { ChatProvider } from '@/context/ChatContext';
import { FloatingChatBox } from '@/components/chat/FloatingChatBox';
import { GlobalCallManager } from '@/components/chat/GlobalCallManager';

export const GlobalChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ChatProvider>
      {children}
      <GlobalCallManager />
      <FloatingChatBox />
    </ChatProvider>
  );
};

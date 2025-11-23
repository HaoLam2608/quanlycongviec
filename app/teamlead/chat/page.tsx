"use client";

import React, { useEffect } from 'react';
import { ChatProvider, useChatContext } from '@/context/ChatContext';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageThread } from '@/components/chat/MessageThread';
import { MessageInput } from '@/components/chat/MessageInput';
import { NewChatDialog } from '@/components/chat/NewChatDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, User, Wifi, WifiOff } from 'lucide-react';

const ChatHeader: React.FC = () => {
  const { activeConversation, isConnected } = useChatContext();
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  if (!activeConversation) {
    return (
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6" />
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="gap-1">
              <Wifi className="h-3 w-3 text-green-500" />
              Online
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <WifiOff className="h-3 w-3 text-red-500" />
              Offline
            </Badge>
          )}
        </div>
      </div>
    );
  }

  const getConversationInfo = () => {
    if (activeConversation.type === 'group') {
      return {
        name: activeConversation.name || 'Nhóm chat',
        subtitle: `${activeConversation.participants.length} thành viên`,
        avatar: null,
        icon: <Users className="h-5 w-5" />
      };
    }

    const otherParticipant = activeConversation.participants.find(
      (p: any) => p.userId.toString() !== currentUserId
    );

    return {
      name: otherParticipant?.user.hoten || 'Người dùng',
      subtitle: otherParticipant?.user.email || '',
      avatar: otherParticipant?.user.avatar,
      icon: <User className="h-5 w-5" />
    };
  };

  const info = getConversationInfo();

  return (
    <div className="border-b p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {info.avatar ? (
              <AvatarImage src={`${process.env.NEXT_PUBLIC_API_URL}${info.avatar}`} />
            ) : (
              <AvatarFallback>{info.icon}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="font-semibold">{info.name}</h2>
            <p className="text-sm text-muted-foreground">{info.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="gap-1">
              <Wifi className="h-3 w-3 text-green-500" />
              Online
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <WifiOff className="h-3 w-3 text-red-500" />
              Offline
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatContent: React.FC = () => {
  const { loadConversations } = useChatContext();

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <div className="flex h-[calc(100vh-8rem)] border rounded-lg overflow-hidden bg-card">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Tin nhắn</h2>
            <NewChatDialog />
          </div>
        </div>
        <ConversationList />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader />
        <div className="flex-1 overflow-hidden">
          <MessageThread />
        </div>
        <MessageInput />
      </div>
    </div>
  );
};

export default function ChatPage() {
  return (
    <ChatProvider>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Nhắn tin</h1>
          <p className="text-muted-foreground">Trò chuyện realtime với đồng nghiệp</p>
        </div>
        <ChatContent />
      </div>
    </ChatProvider>
  );
}

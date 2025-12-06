"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { ChatProvider, useChatContext } from '@/context/ChatContext';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageThread } from '@/components/chat/MessageThread';
import { MessageInput } from '@/components/chat/MessageInput';
import { NewChatDialog } from '@/components/chat/NewChatDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, User, Wifi, WifiOff, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  onBack?: () => void;
  isMobile?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onBack, isMobile }) => {
  const { activeConversation, isConnected } = useChatContext();
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  if (!activeConversation) {
    return (
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isMobile && onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 mr-1"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
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
          {isMobile && onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
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
  const { loadConversations, activeConversation, selectConversation } = useChatContext();
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<'list' | 'chat'>('chat');

  useEffect(() => {
    const updateIsMobile = () => {
      const matches = window.innerWidth <= 768;
      setIsMobile(matches);
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!isMobile) {
      setView('chat');
      return;
    }

    if (!activeConversation) {
      setView('list');
    }
  }, [isMobile, activeConversation]);

  const containerHeightClass = useMemo(() => (
    isMobile ? 'h-[calc(100vh-6rem)]' : 'h-[calc(100vh-8rem)]'
  ), [isMobile]);

  const handleSelectConversation = async (conversationId: number) => {
    await selectConversation(conversationId);
    if (isMobile) {
      setView('chat');
    }
  };

  const handleBack = () => {
    if (isMobile) {
      setView('list');
    }
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-card", containerHeightClass, isMobile ? 'flex flex-col' : 'flex')}> 
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r",
          isMobile ? 'w-full border-r-0 flex-1' : 'w-80',
          isMobile && view === 'chat' ? 'hidden' : 'flex'
        )}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Tin nhắn</h2>
            <NewChatDialog />
          </div>
        </div>
        <ConversationList onSelectConversation={handleSelectConversation} />
      </div>

      {/* Main chat area */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          isMobile && view === 'list' ? 'hidden' : 'flex'
        )}
      >
        <ChatHeader onBack={handleBack} isMobile={isMobile} />
        <div className="flex-1 overflow-hidden">
          {activeConversation ? (
            <MessageThread />
          ) : (
            <div className="h-full flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Chọn một cuộc trò chuyện từ danh sách hoặc bắt đầu cuộc trò chuyện mới.
            </div>
          )}
        </div>
        <div className={cn(isMobile && !activeConversation ? 'hidden' : 'block')}>
          <MessageInput />
        </div>
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

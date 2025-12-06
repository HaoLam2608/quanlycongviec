"use client";

import React from 'react';
import { useChatContext } from '@/context/ChatContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  onSelectConversation?: (conversationId: number) => void | Promise<void>;
}
const SOCKET_URL = "https://taskhadflow-api.nibies.space";
export const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation
}) => {
  const { conversations, activeConversation, selectConversation, isLoading, onlineUsers } = useChatContext();

  const getConversationName = (conversation: any, currentUserId: string | null) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Nhóm chat';
    }

    // Direct conversation - get other participant's name
    const otherParticipant = conversation.participants.find(
      (p: any) => p.userId.toString() !== currentUserId
    );

    // Debug log
    console.log('🔍 Conversation:', conversation.id, {
      participants: conversation.participants,
      otherParticipant,
      currentUserId
    });

    if (!otherParticipant || !otherParticipant.user) {
      console.log('⚠️ No participant or user data found');
      return 'Người dùng';
    }

    // Try hoten first, fallback to manv or email
    const name = otherParticipant.user.hoten ||
      otherParticipant.user.manv ||
      otherParticipant.user.email?.split('@')[0] ||
      'Người dùng';

    console.log('✅ Resolved name:', name);
    return name;
  };

  const getConversationAvatar = (conversation: any, currentUserId: string | null) => {
    if (conversation.type === 'group') {
      return null; // Will use fallback
    }

    const otherParticipant = conversation.participants.find(
      (p: any) => p.userId.toString() !== currentUserId
    );
    return otherParticipant?.user.avatar || null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Chưa có cuộc trò chuyện nào</p>
        </div>
      </div>
    );
  }

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-2">
        {conversations.map((conversation) => {
          const name = getConversationName(conversation, currentUserId);
          const avatar = getConversationAvatar(conversation, currentUserId);
          const isActive = activeConversation?.id === conversation.id;
          const lastMessageTime = conversation.lastMessageAt
            ? formatDistanceToNow(new Date(conversation.lastMessageAt), {
              addSuffix: true,
              locale: vi
            })
            : '';

          // Check if the other user is online (for direct conversations)
          let isOnline = false;
          if (conversation.type === 'direct') {
            const otherParticipant = conversation.participants.find(
              (p: any) => p.userId.toString() !== currentUserId
            );
            if (otherParticipant) {
              isOnline = onlineUsers.has(otherParticipant.userId);
              console.log(`🟢 Conv ${conversation.id} - User ${otherParticipant.userId} online?`, isOnline, 'Online users:', Array.from(onlineUsers));
            }
          }

          return (
            <button
              key={conversation.id}
              onClick={() => {
                console.log('🖱️ Clicked conversation:', conversation.id);
                if (onSelectConversation) {
                  onSelectConversation(conversation.id);
                } else {
                  selectConversation(conversation.id);
                }
              }}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left",
                isActive && "bg-accent"
              )}
            >
              <Avatar className="h-12 w-12 flex-shrink-0 relative">
                {conversation.type === 'group' ? (
                  <>
                    <AvatarImage
                      src={`${SOCKET_URL}/chat/conversations/${conversation.id}/avatar`}
                      alt={conversation.name}
                    />
                    <AvatarFallback>
                      <Users className="h-6 w-6" />
                    </AvatarFallback>
                  </>
                ) : (
                  <>
                    {avatar && <AvatarImage src={`${SOCKET_URL}${avatar}`} />}
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </>
                )}
                {/* Online status indicator for direct chats */}
                {conversation.type === 'direct' && (
                  <div
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                  />
                )}
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate flex items-center gap-2">
                    {name}
                    {conversation.type === 'direct' && isOnline && (
                      <span className="text-xs text-green-600">• Online</span>
                    )}
                  </h3>
                  {lastMessageTime && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {lastMessageTime}
                    </span>
                  )}
                </div>

                {conversation.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage.type === 'text'
                      ? conversation.lastMessage.content
                      : '📎 File đính kèm'
                    }
                  </p>
                )}

                {conversation.unreadCount > 0 && (
                  <Badge variant="destructive" className="mt-1 h-5 px-1.5 text-xs">
                    {conversation.unreadCount}
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

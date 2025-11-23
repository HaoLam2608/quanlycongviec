"use client";

import React, { useEffect, useRef } from 'react';
import { useChatContext } from '@/context/ChatContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { User, File as FileIcon, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export const MessageThread: React.FC = () => {
  const { messages, activeConversation, typingUsers, isLoading } = useChatContext();
  const user = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUserId = user.id ? parseInt(user.id) : null;

  // Helper to safely parse attachments
  const parseAttachments = (attachments: any): any[] => {
    if (!attachments) return [];
    if (Array.isArray(attachments)) return attachments;
    if (typeof attachments === 'string') {
      try {
        const parsed = JSON.parse(attachments);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!activeConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold">Chọn một cuộc trò chuyện</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Chọn từ danh sách bên trái hoặc tạo cuộc trò chuyện mới
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Đang tải tin nhắn...</p>
        </div>
      </div>
    );
  }

  const typingUsersInConversation = typingUsers.get(activeConversation.id) || [];

  // Check if message is read by other participants
  const getMessageStatus = (message: any) => {
    if (!activeConversation) return null;
    
    // Only show status for own messages
    if (!currentUserId || message.senderId !== currentUserId) return null;

    // Check if any other participant has read this message
    const otherParticipants = activeConversation.participants.filter(
      (p: any) => p.userId.toString() !== currentUserId
    );

    const allRead = otherParticipants.every((p: any) => {
      if (!p.lastReadAt) return false;
      return new Date(p.lastReadAt) >= new Date(message.createdAt);
    });

    const someRead = otherParticipants.some((p: any) => {
      if (!p.lastReadAt) return false;
      return new Date(p.lastReadAt) >= new Date(message.createdAt);
    });

    if (allRead && otherParticipants.length > 0) {
      return { status: 'read', icon: <CheckCheck className="h-3 w-3" />, text: 'Đã xem' };
    } else if (someRead) {
      return { status: 'delivered', icon: <CheckCheck className="h-3 w-3 opacity-50" />, text: 'Đã gửi' };
    } else {
      return { status: 'sent', icon: <Check className="h-3 w-3 opacity-50" />, text: 'Đã gửi' };
    }
  };

  return (
    <ScrollArea className="h-full p-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.map((message, index) => {
          const isOwnMessage = currentUserId && message.senderId === currentUserId;
          const showAvatar = !isOwnMessage && (
            index === 0 || 
            messages[index - 1]?.senderId !== message.senderId
          );
          const showName = !isOwnMessage && showAvatar && activeConversation.type === 'group';

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                isOwnMessage && "flex-row-reverse"
              )}
            >
              {showAvatar && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {message.sender.avatar && (
                    <AvatarImage src={`${process.env.NEXT_PUBLIC_API_URL}${message.sender.avatar}`} />
                  )}
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              {!showAvatar && !isOwnMessage && (
                <div className="w-8 flex-shrink-0" />
              )}

              <div className={cn(
                "flex flex-col gap-1 max-w-[85%]",
                isOwnMessage && "items-end"
              )}>
                {showName && (
                  <span className="text-xs font-medium text-muted-foreground px-1">
                    {message.sender.hoten}
                  </span>
                )}

                {message.type === 'system' ? (
                  <div className="text-xs text-center text-muted-foreground italic py-2">
                    {message.content}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2",
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.repliedMessage && (
                      <div className={cn(
                        "border-l-2 pl-2 mb-2 text-xs opacity-70",
                        isOwnMessage ? "border-primary-foreground/30" : "border-primary/30"
                      )}>
                        <div className="font-semibold">
                          {message.repliedMessage.sender.hoten}
                        </div>
                        <div className="truncate">
                          {message.repliedMessage.content}
                        </div>
                      </div>
                    )}

                    {message.type === 'text' && (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    )}

                    {message.type === 'image' && message.attachments && (
                      <div className="space-y-2">
                        {parseAttachments(message.attachments).map((attachment: any, i: number) => (
                          <img
                            key={i}
                            src={`${process.env.NEXT_PUBLIC_API_URL}${attachment.path}`}
                            alt={attachment.originalName}
                            className="rounded-lg max-w-full max-h-80 object-contain"
                          />
                        ))}
                        {message.content && (
                          <p className="text-sm mt-2 whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                      </div>
                    )}

                    {message.type === 'file' && message.attachments && (
                      <div className="space-y-2 w-full">
                        {message.content && (
                          <p className="text-sm mb-2">{message.content}</p>
                        )}
                        {parseAttachments(message.attachments).map((attachment: any, i: number) => (
                          <a
                            key={i}
                            href={`${process.env.NEXT_PUBLIC_API_URL}${attachment.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg hover:opacity-80 transition-opacity overflow-hidden",
                              isOwnMessage ? "bg-primary-foreground/10" : "bg-background"
                            )}
                          >
                            <FileIcon className="h-5 w-5 flex-shrink-0" />
                            <span className="text-sm flex-1 min-w-0 truncate" title={attachment.originalName}>
                              {attachment.originalName}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <span className={cn(
                  "text-xs text-muted-foreground px-1 flex items-center gap-1",
                  isOwnMessage && "text-right"
                )}>
                  {formatDistanceToNow(new Date(message.createdAt), { 
                    addSuffix: true, 
                    locale: vi 
                  })}
                  {' • '}
                  {format(new Date(message.createdAt), 'HH:mm', { locale: vi })}
                  
                  {isOwnMessage && (() => {
                    const status = getMessageStatus(message);
                    return status ? (
                      <>
                        {' • '}
                        {status.icon}
                        <span className="ml-1">{status.text}</span>
                      </>
                    ) : null;
                  })()}
                </span>
              </div>
            </div>
          );
        })}

        {typingUsersInConversation.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1">
              <span>{typingUsersInConversation[0].userName} đang nhập</span>
              <div className="flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

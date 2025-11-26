"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: any[];
  metadata?: any;
  replyTo?: number;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    hoten: string;
    avatar?: string;
  };
  repliedMessage?: Message;
}

interface Conversation {
  id: number;
  type: 'direct' | 'group';
  name?: string;
  createdBy: number;
  lastMessageId?: number;
  lastMessageAt?: string;
  participants: Array<{
    id: number;
    userId: number;
    role: 'member' | 'admin';
    lastReadAt?: string;
    user: {
      id: number;
      hoten: string;
      email: string;
      avatar?: string;
    };
  }>;
  lastMessage?: Message;
  unreadCount: number;
}

interface TypingUser {
  userId: number;
  userName: string;
}

interface ChatContextType {
  socket: Socket | null;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  typingUsers: Map<number, TypingUser[]>;
  onlineUsers: Set<number>;
  isConnected: boolean;
  isLoading: boolean;

  // Actions
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: number) => Promise<void>;
  sendMessage: (content: string, replyTo?: number) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  markAsRead: (conversationId: number) => Promise<void>;
  createDirectConversation: (userId: number) => Promise<Conversation>;
  createGroupConversation: (name: string, participantIds: number[]) => Promise<Conversation>;
  updateMessage: (messageId: number, content: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  uploadAttachment: (files: File[], replyTo?: number) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, TypingUser[]>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use ref to always have the latest activeConversation in socket listeners
  const activeConversationRef = useRef<Conversation | null>(null);

  // Sync ref with state
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Get token from localStorage
  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = getToken();
    if (!user.id || !token) {
      console.log('⚠️ Cannot initialize socket: missing user.id or token', { userId: user.id, hasToken: !!token });
      return;
    }

    // Clear online users when initializing new connection
    setOnlineUsers(new Set());
    console.log('🔄 Cleared online users, waiting for fresh data from server');

    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    console.log('🔌 Initializing socket with:', {
      url: SOCKET_URL,
      userId: user.id,
      tokenPreview: token.substring(0, 20) + '...',
      tokenLength: token.length
    });

    console.log('⚠️ NOTE: If you see "Invalid token" error, please LOGOUT and LOGIN again to get a fresh token!');

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Không thể kết nối chat realtime');
    });

    // Message events
    newSocket.on('message:new', (message: Message) => {
      console.log('📩 New message received:', message);
      const currentActiveConv = activeConversationRef.current;
      console.log('📩 Active conversation (from ref):', currentActiveConv?.id);
      console.log('📩 Message conversationId:', message.conversationId);
      console.log('📩 Should add to messages?', currentActiveConv && message.conversationId === currentActiveConv.id);

      // Add to messages if in active conversation
      if (currentActiveConv && message.conversationId === currentActiveConv.id) {
        console.log('✅ Adding message to state');
        setMessages(prev => [...prev, message]);
      } else {
        console.log('❌ Not adding message - conversation mismatch or no active conversation');
      }

      // Update conversation list
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message,
              lastMessageAt: message.createdAt,
              unreadCount: conv.id === currentActiveConv?.id ? conv.unreadCount : conv.unreadCount + 1
            };
          }
          return conv;
        });

        // Sort by last message time
        return updated.sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return timeB - timeA;
        });
      });

      // Show notification if not in active conversation
      if (!currentActiveConv || message.conversationId !== currentActiveConv.id) {
        const currentUserId = user.id ? parseInt(user.id) : null;
        if (currentUserId && message.senderId !== currentUserId) {
          toast.info(`${message.sender.hoten}: ${message.content}`);
        }
      }
    });

    newSocket.on('message:updated', (message: Message) => {
      setMessages(prev => prev.map(m => m.id === message.id ? message : m));
    });

    newSocket.on('message:deleted', ({ messageId }: { messageId: number }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    // Typing events
    newSocket.on('typing:start', ({ conversationId, userId, userName }: { conversationId: number; userId: number; userName: string }) => {
      const currentUserId = user.id ? parseInt(user.id) : null;
      if (currentUserId && userId === currentUserId) return; // Ignore own typing

      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const users = newMap.get(conversationId) || [];
        if (!users.find(u => u.userId === userId)) {
          newMap.set(conversationId, [...users, { userId, userName }]);
        }
        return newMap;
      });
    });

    newSocket.on('typing:stop', ({ conversationId, userId }: { conversationId: number; userId: number }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const users = (newMap.get(conversationId) || []).filter(u => u.userId !== userId);
        if (users.length > 0) {
          newMap.set(conversationId, users);
        } else {
          newMap.delete(conversationId);
        }
        return newMap;
      });
    });

    // Read receipts
    newSocket.on('message:read', ({ conversationId, userId }: { conversationId: number; userId: number }) => {
      // Update conversation participants' lastReadAt
      setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            participants: conv.participants.map(p =>
              p.userId === userId ? { ...p, lastReadAt: new Date().toISOString() } : p
            )
          };
        }
        return conv;
      }));
    });

    // Online status events
    newSocket.on('user:online', ({ userId }: { userId: number }) => {
      console.log('✅ User came online:', userId);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(userId);
        console.log('📊 Online users:', Array.from(newSet));
        return newSet;
      });
    });

    newSocket.on('user:offline', ({ userId }: { userId: number }) => {
      console.log('❌ User went offline:', userId);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        console.log('📊 Online users:', Array.from(newSet));
        return newSet;
      });
    });

    newSocket.on('users:online', ({ userIds }: { userIds: number[] }) => {
      console.log('📋 Initial online users list:', userIds);
      setOnlineUsers(new Set(userIds));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user.id]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Không thể tải danh sách trò chuyện');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select conversation
  const selectConversation = useCallback(async (conversationId: number) => {
    console.log('📌 selectConversation called with ID:', conversationId);
    const token = getToken();
    if (!token || !socket) {
      console.log('❌ Cannot select conversation - no token or socket');
      return;
    }

    setIsLoading(true);
    try {
      // Leave previous conversation
      if (activeConversation) {
        console.log('📤 Leaving conversation:', activeConversation.id);
        socket.emit('conversation:leave', activeConversation.id);
      }

      // Join new conversation
      console.log('📥 Joining conversation:', conversationId);
      socket.emit('conversation:join', conversationId);

      // Load conversation details
      const [convResponse, messagesResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${conversationId}/messages?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (convResponse.ok && messagesResponse.ok) {
        const conversation = await convResponse.json();
        const messages = await messagesResponse.json();

        console.log('✅ Loaded conversation:', conversation);
        console.log('✅ Loaded messages:', messages.length, 'messages');

        setActiveConversation(conversation);
        setMessages(messages);

        // Mark as read
        await markAsRead(conversationId);
      }
    } catch (error) {
      console.error('Error selecting conversation:', error);
      toast.error('Không thể tải cuộc trò chuyện');
    } finally {
      setIsLoading(false);
    }
  }, [socket, activeConversation]);

  // Send message
  const sendMessage = useCallback(async (content: string, replyTo?: number) => {
    if (!socket || !activeConversation || !content.trim()) return;

    socket.emit('message:send', {
      conversationId: activeConversation.id,
      content: content.trim(),
      type: 'text',
      replyTo
    });
  }, [socket, activeConversation]);

  // Send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    if (!socket || !activeConversation) return;

    if (isTyping) {
      socket.emit('typing:start', { conversationId: activeConversation.id });

      // Auto-stop typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { conversationId: activeConversation.id });
      }, 3000);
    } else {
      socket.emit('typing:stop', { conversationId: activeConversation.id });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }, [socket, activeConversation]);

  // Mark as read
  const markAsRead = useCallback(async (conversationId: number) => {
    const token = getToken();
    if (!token || !socket) return;

    socket.emit('message:read', { conversationId });

    // Update local unread count
    setConversations(prev => prev.map(conv =>
      conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
    ));
  }, [socket]);

  // Create direct conversation
  const createDirectConversation = useCallback(async (userId: number): Promise<Conversation> => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    console.log('ChatContext: Creating conversation with userId:', userId);
    console.log('Request body:', { userId });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/direct`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to create conversation');
      }

      const conversation = await response.json();
      console.log('Conversation created:', conversation);

      // Add to conversations if new
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversation.id);
        if (exists) return prev;
        return [conversation, ...prev];
      });

      return conversation;
    } catch (error) {
      console.error('Create conversation error:', error);
      throw error;
    }
  }, []);

  // Create group conversation
  const createGroupConversation = useCallback(async (name: string, participantIds: number[]): Promise<Conversation> => {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/group`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, participantIds })
    });

    if (!response.ok) throw new Error('Failed to create group');

    const conversation = await response.json();
    setConversations(prev => [conversation, ...prev]);
    return conversation;
  }, []);

  // Update message
  const updateMessage = useCallback(async (messageId: number, content: string) => {
    if (!socket) return;
    socket.emit('message:update', { messageId, content });
  }, [socket]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: number) => {
    if (!socket) return;
    socket.emit('message:delete', { messageId });
  }, [socket]);

  // Upload attachment
  const uploadAttachment = useCallback(async (files: File[], replyTo?: number) => {
    const token = getToken();
    if (!token || !activeConversation) return;

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (replyTo) formData.append('replyTo', replyTo.toString());

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${activeConversation.id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const message = await response.json();
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải file lên');
    }
  }, [activeConversation]);

  const value: ChatContextType = {
    socket,
    conversations,
    activeConversation,
    messages,
    typingUsers,
    onlineUsers,
    isConnected,
    isLoading,
    loadConversations,
    selectConversation,
    sendMessage,
    sendTyping,
    markAsRead,
    createDirectConversation,
    createGroupConversation,
    updateMessage,
    deleteMessage,
    uploadAttachment
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

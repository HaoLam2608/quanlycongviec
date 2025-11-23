"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useChatContext } from '@/context/ChatContext';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { MessageInput } from './MessageInput';
import { NewChatDialog } from './NewChatDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Search,
  ArrowLeft,
  Users,
  User,
  Wifi,
  WifiOff,
  Info,
  Phone,
  Video
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FloatingChatBoxProps {
  className?: string;
}

export const FloatingChatBox: React.FC<FloatingChatBoxProps> = ({ className }) => {
  const { 
    conversations, 
    activeConversation, 
    selectConversation,
    isConnected,
    onlineUsers,
    loadConversations,
    createDirectConversation,
    socket 
  } = useChatContext();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [view, setView] = useState<'list' | 'chat' | 'search'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showMemberList, setShowMemberList] = useState(false);

  // Calculate total unread count
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  useEffect(() => {
    // Get token and userId from localStorage after component mounts
    setToken(localStorage.getItem('accessToken'));
    setCurrentUserId(localStorage.getItem('userId'));
  }, []);

  useEffect(() => {
    if (isOpen && conversations.length === 0) {
      loadConversations();
    }
  }, [isOpen, conversations.length, loadConversations]);

  const loadAllUsers = useCallback(async () => {
    setIsSearching(true);
    try {
      if (!token) {
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users?limit=100`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const usersList = data.users || data;
        const selfId = currentUserId || localStorage.getItem('userId');
        const filteredUsers = usersList.filter((u: any) =>
          selfId ? u.id.toString() !== selfId : true
        );
        setAllUsers(filteredUsers);
        setUsers(filteredUsers);
      } else {
        setAllUsers([]);
        setUsers([]);
      }
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [token, currentUserId]);

  // Load all users when opening search view
  useEffect(() => {
    if (view === 'search' && token) {
      loadAllUsers();
    }
  }, [view, token, loadAllUsers]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers(allUsers);
      return;
    }

    const filtered = allUsers.filter(user => {
      const searchLower = query.toLowerCase();
      const hoten = user.hoten || '';
      const email = user.email || '';
      const manv = user.manv || '';
      
      return hoten.toLowerCase().includes(searchLower) ||
             email.toLowerCase().includes(searchLower) ||
             manv.toLowerCase().includes(searchLower);
    });
    setUsers(filtered);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (view === 'search') {
        searchUsers(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, view]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeConversation || !event.target.files?.[0]) return;
    
    const file = event.target.files[0];
    setIsUploadingAvatar(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${activeConversation.id}/avatar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );
      
      if (!response.ok) throw new Error('Upload failed');
      
      // Refresh conversation to get new avatar
      await loadConversations();
      
      // Force image reload
      const timestamp = Date.now();
      const avatarImg = document.querySelector(`img[src*="/conversations/${activeConversation.id}/avatar"]`) as HTMLImageElement;
      if (avatarImg) {
        avatarImg.src = `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${activeConversation.id}/avatar?t=${timestamp}`;
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Không thể upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleStartChat = async (userId: number) => {
    try {
      const conversation = await createDirectConversation(userId);
      await selectConversation(conversation.id);
      setView('chat');
      setSearchTerm('');
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleSelectConversation = async (conversationId: number) => {
    await selectConversation(conversationId);
    setView('chat');
  };

  const handleBack = () => {
    if (view === 'chat' || view === 'search') {
      setView('list');
    }
  };

  // Start call via GlobalCallManager
  const startCall = (type: 'audio' | 'video') => {
    if (!activeConversation || !socket) return;

    // Only support 1-1 calls
    if (activeConversation.type !== 'direct') {
      alert('Chỉ hỗ trợ gọi 1-1');
      return;
    }

    const otherParticipant = activeConversation.participants.find(
      (p: any) => p.userId.toString() !== currentUserId
    );

    if (!otherParticipant) return;

    // Dispatch custom event for GlobalCallManager to handle outgoing call state
    window.dispatchEvent(new CustomEvent('call:start', {
      detail: {
        toUserId: otherParticipant.userId,
        toUserName: otherParticipant.user?.hoten || 'Người dùng',
        conversationId: activeConversation.id,
        callType: type
      }
    }));

    // Send call request to remote user via socket
    socket.emit('call:request', {
      toUserId: otherParticipant.userId,
      conversationId: activeConversation.id,
      callType: type
    });
  };

  const getConversationName = (conversation: any) => {
    if (conversation.type === 'group') {
      const memberCount = conversation.participants?.length || 0;
      const groupName = conversation.name || 'Nhóm chat';
      return `${groupName} (${memberCount} thành viên)`;
    }
    const otherParticipant = conversation.participants.find(
      (p: any) => p.userId.toString() !== currentUserId
    );
    
    if (!otherParticipant || !otherParticipant.user) {
      return 'Người dùng';
    }
    
    // Try hoten first, fallback to manv or email
    return otherParticipant.user.hoten || 
           otherParticipant.user.manv || 
           otherParticipant.user.email?.split('@')[0] ||
           'Người dùng';
  };

  const getConversationAvatar = (conversation: any) => {
    if (conversation.type === 'group') return null;
    const otherParticipant = conversation.participants.find(
      (p: any) => p.userId.toString() !== currentUserId
    );
    return otherParticipant?.user.avatar || null;
  };

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg relative"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center"
            >
              {totalUnread > 99 ? '99+' : totalUnread}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <Button
          size="lg"
          variant="secondary"
          className="h-12 px-4 rounded-full shadow-lg flex items-center gap-2"
          onClick={() => setIsMinimized(false)}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold">
            {activeConversation 
              ? getConversationName(activeConversation)
              : 'Tin nhắn'
            }
          </span>
          {totalUnread > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5">
              {totalUnread}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <div className="w-[420px] h-[650px] bg-card border rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(view === 'chat' || view === 'search') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            {view === 'list' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                      onClick={() => {
                        try {
                          // Try reading role from localStorage first
                          let storedRole = localStorage.getItem('role') || localStorage.getItem('userRole') || localStorage.getItem('roles');

                          // If not in localStorage, try to parse from JWT accessToken payload
                          if (!storedRole) {
                            const t = localStorage.getItem('accessToken');
                            if (t) {
                              const parts = t.split('.');
                              if (parts.length > 1) {
                                try {
                                  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                                  storedRole = payload?.role || payload?.roles || payload?.user?.role || undefined;
                                } catch (e) {
                                  // ignore
                                }
                              }
                            }
                          }

                          // If storedRole is a JSON array string, parse and take first element
                          if (typeof storedRole === 'string' && storedRole.trim().startsWith('[')) {
                            try {
                              const arr = JSON.parse(storedRole);
                              storedRole = Array.isArray(arr) ? arr[0] : storedRole;
                            } catch (e) {
                              // ignore
                            }
                          }

                          // Normalize role -> route segment (map common server values to our folder names)
                          const normalizeRole = (r: any) => {
                            if (!r) return null;
                            const s = String(r).toLowerCase().trim();
                            // common variations
                            if (s === 'teamleader' || s === 'team_leader' || s === 'team lead') return 'teamlead';
                            if (s.includes('teamlead') || s.includes('teamleader')) return 'teamlead';
                            // map employee -> member
                            if (s === 'employee' || s === 'emp' || s.includes('employee')) return 'member';
                            if (s.includes('manager')) return 'manager';
                            if (s.includes('admin')) return 'admin';
                            if (s.includes('member')) return 'member';
                            // fallback: remove spaces/underscores
                            return s.replace(/[_\s]+/g, '');
                          };

                          const slug = normalizeRole(storedRole);
                          if (slug) {
                            window.location.href = `/${slug}/chat`;
                          } else {
                            const current = window.location.pathname.replace(/\/$/, '');
                            window.location.href = `${current}/chat`;
                          }
                        } catch (err) {
                          const current = window.location.pathname.replace(/\/$/, '');
                          window.location.href = `${current}/chat`;
                        }
                      }}
                  title="Mở trang chat đầy đủ"
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <h3 className="font-semibold">Tin nhắn</h3>
              </>
            )}

            {view === 'chat' && activeConversation && (
              <>
                <Avatar className="h-8 w-8">
                  {activeConversation.type === 'group' ? (
                    <>
                      <AvatarImage 
                        src={`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/${activeConversation.id}/avatar`} 
                        alt={activeConversation.name}
                      />
                      <AvatarFallback>
                        <Users className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <>
                      {getConversationAvatar(activeConversation) && (
                        <AvatarImage 
                          src={`${process.env.NEXT_PUBLIC_API_URL}${getConversationAvatar(activeConversation)}`} 
                        />
                      )}
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-sm">
                    {getConversationName(activeConversation)}
                  </div>
                  {activeConversation.type === 'direct' && (() => {
                    // Get the other user's online status
                    const otherParticipant = activeConversation.participants.find(
                      (p: any) => p.userId.toString() !== currentUserId
                    );
                    const isOtherUserOnline = otherParticipant ? onlineUsers.has(otherParticipant.userId) : false;
                    
                    return (
                      <div className="text-xs opacity-80">
                        {isOtherUserOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

            {view === 'search' && (
              <h3 className="font-semibold">Tìm người dùng</h3>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isConnected ? (
              <Wifi className="h-4 w-4 opacity-80" />
            ) : (
              <WifiOff className="h-4 w-4 opacity-80" />
            )}
            {view === 'chat' && activeConversation && activeConversation.type === 'direct' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => startCall('audio')}
                  title="Gọi thoại"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => startCall('video')}
                  title="Gọi video"
                >
                  <Video className="h-4 w-4" />
                </Button>
              </>
            )}
            {view === 'chat' && activeConversation && activeConversation.type === 'group' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setShowMemberList(!showMemberList)}
                title="Xem thành viên"
              >
                <Info className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {view === 'list' && (
          <>
            <div className="p-3 border-b space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setView('search')}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Tìm người dùng
                </Button>
                <NewChatDialog />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConversationList onSelectConversation={handleSelectConversation} />
            </div>
          </>
        )}

        {view === 'search' && (
          <>
            <div className="p-3 border-b">
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="w-full"
                autoFocus
              />
            </div>
            <ScrollArea className="flex-1">
              {isSearching ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-sm text-muted-foreground">Đang tải...</div>
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-sm text-muted-foreground">
                    {searchTerm ? 'Không tìm thấy người dùng' : 'Đang tải...'}
                  </div>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {users.map((user) => {
                    const isOnline = onlineUsers.has(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleStartChat(user.id)}
                        className="w-full flex items-center gap-3 p-2 rounded hover:bg-accent transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            {user.avatar && (
                              <AvatarImage src={`${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`} />
                            )}
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          {/* Online status indicator */}
                          <div
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                              isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {user.hoten || user.manv || user.email?.split('@')[0] || 'Người dùng'}
                            {isOnline && (
                              <span className="text-xs text-green-600">• Online</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email || user.manv || ''}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </>
        )}

        {view === 'chat' && (
          <>
            {/* Member list panel */}
            {showMemberList && activeConversation && activeConversation.type === 'group' && (
              <div className="border-b border-primary-foreground/20 bg-primary/5 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-foreground">
                    Thành viên ({activeConversation.participants.length})
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="group-avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => document.getElementById('group-avatar-upload')?.click()}
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? 'Đang tải...' : 'Đổi ảnh nhóm'}
                    </Button>
                  </div>
                </div>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {activeConversation.participants.map((participant: any) => {
                      const isOnline = onlineUsers.has(participant.userId);
                      const user = participant.user || participant.User || {};
                      
                      return (
                        <div
                          key={participant.userId}
                          className="flex items-center gap-2 p-2 rounded hover:bg-primary-foreground/10 transition-colors"
                        >
                          <div className="relative">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={`${process.env.NEXT_PUBLIC_API_URL}/users/${participant.userId}/avatar`} 
                                alt={user.hoten || user.manv} 
                              />
                              <AvatarFallback className="text-xs">
                                {(user.hoten || user.manv || user.email || 'U')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {/* Online indicator dot */}
                            <span
                              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-primary ${
                                isOnline ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {user.hoten || user.manv || user.email?.split('@')[0] || 'Người dùng'}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            <div className="flex-1 overflow-hidden">
              <MessageThread />
            </div>
            <MessageInput />
          </>
        )}
      </div>
    </div>
    </>
  );
};

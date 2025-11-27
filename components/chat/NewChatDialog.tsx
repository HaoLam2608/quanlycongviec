"use client";

import React, { useState, useEffect } from 'react';
import { useChatContext } from '@/context/ChatContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquarePlus, User, Users } from 'lucide-react';
import { toast } from 'sonner';

interface UserItem {
  id: number;
  manv: string;
  hoten: string;
  email: string;
  avatar?: string;
}
const SOCKET_URL = "https://taskhadflow-api.nibies.space";
export const NewChatDialog: React.FC = () => {
  const { createDirectConversation, createGroupConversation, selectConversation, onlineUsers } = useChatContext();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from localStorage after component mounts
    const accessToken = localStorage.getItem('accessToken');
    setToken(accessToken);
    console.log('Token found:', accessToken ? 'Yes' : 'No');
  }, []);

  useEffect(() => {
    if (open && token) {
      loadUsers();
    }
  }, [open, token]);

  const loadUsers = async () => {
    try {
      if (!token) {
        console.log('No token found');
        return;
      }

      console.log('Loading users...');
      console.log('API URL:', `${SOCKET_URL}/users?limit=100`);
      
      const response = await fetch(`${SOCKET_URL}/users?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users data received:', data);
        // Extract users array from paginated response
        const usersList = data.users || data;
        console.log('Users list:', usersList.length, 'users');
        
        // Filter out current user
        const currentUserId = localStorage.getItem('userId');
        const filteredList = usersList.filter((u: any) => u.id.toString() !== currentUserId);
        console.log('Filtered list (excluding current user):', filteredList.length, 'users');
        
        setUsers(filteredList);
      } else {
        const errorText = await response.text();
        console.error('Response not OK:', errorText);
        toast.error('Không thể tải danh sách người dùng');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Không thể tải danh sách người dùng');
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const hoten = user.hoten || '';
    const email = user.email || '';
    const manv = user.manv || '';
    
    return hoten.toLowerCase().includes(searchLower) ||
           manv.toLowerCase().includes(searchLower) ||
           email.toLowerCase().includes(searchLower);
  });

  const handleCreateDirect = async (userId: number) => {
    console.log('Creating direct conversation with userId:', userId);
    setIsLoading(true);
    try {
      const conversation = await createDirectConversation(userId);
      await selectConversation(conversation.id);
      setOpen(false);
      toast.success('Đã tạo cuộc trò chuyện');
    } catch (error) {
      console.error('Error creating direct conversation:', error);
      toast.error('Không thể tạo cuộc trò chuyện');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Vui lòng nhập tên nhóm');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 thành viên');
      return;
    }

    setIsLoading(true);
    try {
      const conversation = await createGroupConversation(groupName, selectedUsers);
      await selectConversation(conversation.id);
      setOpen(false);
      setGroupName('');
      setSelectedUsers([]);
      toast.success('Đã tạo nhóm chat');
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Không thể tạo nhóm');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          Tạo mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo cuộc trò chuyện mới</DialogTitle>
          <DialogDescription>
            Chọn người dùng để chat trực tiếp hoặc tạo nhóm chat
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="direct" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="direct">
              <User className="h-4 w-4 mr-2" />
              Chat 1-1
            </TabsTrigger>
            <TabsTrigger value="group">
              <Users className="h-4 w-4 mr-2" />
              Nhóm chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="direct" className="space-y-4">
            <Input
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <ScrollArea className="h-[300px] border rounded-md">
              <div className="p-2 space-y-1">
                {filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                    <User className="h-12 w-12 mb-2" />
                    <p className="text-sm">
                      {users.length === 0 ? 'Đang tải danh sách người dùng...' : 'Không tìm thấy người dùng'}
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((user) => {
                    const isOnline = onlineUsers.has(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleCreateDirect(user.id)}
                        disabled={isLoading}
                        className="w-full flex items-center gap-3 p-2 rounded hover:bg-accent transition-colors"
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            {user.avatar && (
                              <AvatarImage src={`${SOCKET_URL}${user.avatar}`} />
                            )}
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                              isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium flex items-center gap-2">
                            {user.hoten || user.manv || user.email?.split('@')[0] || 'Người dùng'}
                            {isOnline && (
                              <span className="text-xs text-green-600">• Online</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email || user.manv || ''}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Tên nhóm</Label>
              <Input
                id="groupName"
                placeholder="Nhập tên nhóm..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Thành viên ({selectedUsers.length} người)</Label>
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[250px] border rounded-md">
              <div className="p-2 space-y-1">
                {filteredUsers.map((user) => {
                  const isOnline = onlineUsers.has(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {user.avatar && (
                            <AvatarImage src={`${SOCKET_URL}${user.avatar}`} />
                          )}
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium flex items-center gap-2">
                          {user.hoten || user.manv || user.email?.split('@')[0] || 'Người dùng'}
                          {isOnline && (
                            <span className="text-xs text-green-600">• Online</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email || user.manv || ''}
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <Button
              onClick={handleCreateGroup}
              disabled={isLoading || !groupName.trim() || selectedUsers.length === 0}
              className="w-full"
            >
              {isLoading ? 'Đang tạo...' : 'Tạo nhóm'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

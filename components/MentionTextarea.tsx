"use client";

import React, { useState, useRef, useEffect } from "react";
import { getMentionableUsers, MentionableUser } from "@/axios/commentApi";

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  taskId?: number;
  subtaskId?: number;
  className?: string;
  rows?: number;
}

export default function MentionTextarea({
  value,
  onChange,
  placeholder = "Nhập bình luận...",
  taskId,
  subtaskId,
  className = "",
  rows = 3
}: MentionTextareaProps) {
  const [users, setUsers] = useState<MentionableUser[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<MentionableUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch mentionable users
  useEffect(() => {
    const fetchUsers = async () => {
      if (taskId || subtaskId) {
        try {
          console.log('Fetching mentionable users for:', { taskId, subtaskId });
          const data = await getMentionableUsers(taskId, subtaskId);
          console.log('Mentionable users received:', data.length, data);
          setUsers(data);
        } catch (error) {
          console.error("Error fetching mentionable users:", error);
        }
      }
    };
    fetchUsers();
  }, [taskId, subtaskId]);

  // Detect @ symbol and show suggestions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    // Find @ symbol before cursor
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    console.log('Text changed:', { lastAtIndex, textBeforeCursor, cursorPos, usersCount: users.length });
    
    if (lastAtIndex !== -1) {
      const afterAt = textBeforeCursor.slice(lastAtIndex + 1);
      console.log('After @ symbol:', afterAt);
      
      // Check if there's no space after @
      if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
        setMentionSearch(afterAt);
        setShowSuggestions(true);
        
        // Filter users based on search
        const filtered = users.filter(user =>
          user.hoten.toLowerCase().includes(afterAt.toLowerCase()) ||
          user.manv.toLowerCase().includes(afterAt.toLowerCase())
        );
        console.log('Filtered users:', filtered.length, 'from total:', users.length);
        setFilteredUsers(filtered);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Insert mention
  const insertMention = (user: MentionableUser) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const beforeAt = value.slice(0, lastAtIndex);
      const mention = `@[${user.id}]${user.hoten}`;
      const newValue = beforeAt + mention + ' ' + textAfterCursor;
      
      onChange(newValue);
      setShowSuggestions(false);
      
      // Focus textarea and set cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeAt.length + mention.length + 1;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || filteredUsers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
    } else if (e.key === 'Enter' && showSuggestions) {
      e.preventDefault();
      insertMention(filteredUsers[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      
      {showSuggestions && filteredUsers.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredUsers.map((user, index) => (
            <div
              key={user.id}
              className={`px-4 py-2 cursor-pointer ${
                index === selectedIndex
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => insertMention(user)}
            >
              <div className="font-medium text-sm">{user.hoten}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{user.manv} - {user.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

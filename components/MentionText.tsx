"use client";

import React from "react";

interface MentionTextProps {
  text: string;
  className?: string;
}

export default function MentionText({ text, className = "" }: MentionTextProps) {
  if (!text) return null;

  // Parse @[userId]username mentions and replace with highlighted span
  const parseText = (content: string) => {
    const mentionPattern = /@\[(\d+)\]([^\s]+)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = mentionPattern.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      // Add highlighted mention
      const userId = match[1];
      const username = match[2];
      parts.push(
        <span
          key={`mention-${key++}`}
          className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1 rounded font-medium cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
          title={`User ID: ${userId}`}
        >
          @{username}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [content];
  };

  return (
    <div className={className}>
      {parseText(text)}
    </div>
  );
}

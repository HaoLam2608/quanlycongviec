import api from "./config";

export interface CommentAttachment {
  filename: string;
  mimetype: string;
  size: number;
  data: string; // base64 encoded data
}

export interface Comment {
  id: number;
  authorId: number;
  taskId?: number;
  subtaskId?: number;
  content: string;
  attachments?: CommentAttachment[];
  mentions?: number[]; // Array of mentioned user IDs
  createdAt: string;
  updatedAt: string;
  author?: {
    id: number;
    manv: string;
    hoten: string;
    email: string;
  };
}

export interface MentionableUser {
  id: number;
  manv: string;
  hoten: string;
  email: string;
}

export interface CreateCommentPayload {
  taskId?: number;
  subtaskId?: number;
  content: string;
  files?: File[];
}

// Get comments for a task
export const getTaskComments = async (taskId: number): Promise<Comment[]> => {
  try {
    const response = await api.get(`/comments/task/${taskId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching task comments:", error);
    throw error;
  }
};

// Get comments for a subtask
export const getSubtaskComments = async (subtaskId: number): Promise<Comment[]> => {
  try {
    const response = await api.get(`/comments/subtask/${subtaskId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching subtask comments:", error);
    throw error;
  }
};

// Create a new comment
export const createComment = async (payload: CreateCommentPayload): Promise<Comment> => {
  try {
    // If files are provided, use FormData
    if (payload.files && payload.files.length > 0) {
      const formData = new FormData();
      
      if (payload.taskId) {
        formData.append('taskId', payload.taskId.toString());
      }
      if (payload.subtaskId) {
        formData.append('subtaskId', payload.subtaskId.toString());
      }
      
      // Only append content if it's not empty
      if (payload.content && payload.content.trim()) {
        formData.append('content', payload.content.trim());
      }
      
      // Append all files
      payload.files.forEach((file) => {
        formData.append('attachments', file);
      });
      
      console.log('Sending FormData with files:', payload.files.length);
      
      const response = await api.post("/comments", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // No files, send as JSON
      const response = await api.post("/comments", {
        taskId: payload.taskId,
        subtaskId: payload.subtaskId,
        content: payload.content,
      });
      return response.data;
    }
  } catch (error) {
    console.error("Error creating comment:", error);
    throw error;
  }
};

// Delete a comment
export const deleteComment = async (commentId: number): Promise<void> => {
  try {
    await api.delete(`/comments/${commentId}`);
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};

// Update a comment
export const updateComment = async (commentId: number, payload: { content?: string; files?: File[] }): Promise<Comment> => {
  try {
    // If files are provided, use FormData
    if (payload.files && payload.files.length > 0) {
      const formData = new FormData();
      
      // Only append content if it's not empty
      if (payload.content && payload.content.trim()) {
        formData.append('content', payload.content.trim());
      }
      
      // Append all files
      payload.files.forEach((file) => {
        formData.append('attachments', file);
      });
      
      console.log('Updating comment with files:', payload.files.length);
      
      const response = await api.put(`/comments/${commentId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // No files, send as JSON
      const response = await api.put(`/comments/${commentId}`, {
        content: payload.content,
      });
      return response.data;
    }
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
};

// Get mentionable users for a task or subtask
export const getMentionableUsers = async (taskId?: number, subtaskId?: number): Promise<MentionableUser[]> => {
  try {
    const params = new URLSearchParams();
    if (taskId) params.append('taskId', taskId.toString());
    if (subtaskId) params.append('subtaskId', subtaskId.toString());
    
    const response = await api.get(`/comments/mentionable-users?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching mentionable users:", error);
    throw error;
  }
};

// Convert base64 data to data URL for display
export const getBase64DataUrl = (mimetype: string, base64Data: string): string => {
  return `data:${mimetype};base64,${base64Data}`;
};

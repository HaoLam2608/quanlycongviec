"use client";

import React, { useEffect, useState, useRef } from "react";
import { getSubtaskComments, createComment, deleteComment, updateComment, Comment, getBase64DataUrl } from "@/axios/commentApi";
import { MessageSquare, Send, Trash2, Paperclip, X, Download, FileText, Image as ImageIcon, Edit2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import MentionTextarea from "./MentionTextarea";
import MentionText from "./MentionText";

interface CommentSubtaskProps {
  subtaskId: number;
  subtaskStatus?: string;
  projectStatus?: string;
}

export default function CommentSubtask({ subtaskId, subtaskStatus, projectStatus }: CommentSubtaskProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mentions, setMentions] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { id: userId } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isCompleted = subtaskStatus === 'Hoàn thành';
  const isPaused = projectStatus === 'da_dong';
  const isDisabled = isCompleted || isPaused;

  useEffect(() => {
    if (subtaskId) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtaskId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await getSubtaskComments(subtaskId);
      setComments(data);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Limit to 5 files max
    if (selectedFiles.length + files.length > 5) {
      setError("Tối đa 5 file đính kèm");
      return;
    }
    setSelectedFiles([...selectedFiles, ...files]);
    setError("");
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!content.trim() && selectedFiles.length === 0) {
      setError("Vui lòng nhập nội dung hoặc đính kèm file");
      return;
    }

    setSubmitting(true);
    try {
      await createComment({
        subtaskId,
        content: content.trim(),
        files: selectedFiles,
        mentions,
      });
      setContent("");
      setSelectedFiles([]);
      setMentions([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setShowForm(false);
      fetchComments();
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể thêm bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    try {
      await deleteComment(commentId);
      fetchComments();
    } catch (err) {
      alert("Không thể xóa bình luận");
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isImage = (mimetype: string): boolean => {
    return mimetype.startsWith("image/");
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare size={20} className="text-primary" />
          Bình luận ({comments.length})
        </h4>
        <button
          className={`text-xs hover:underline font-semibold ${isDisabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-600'
            }`}
          onClick={() => !isDisabled && setShowForm((v) => !v)}
          disabled={isDisabled}
          title={isCompleted ? 'Không thể thêm bình luận cho công việc đã hoàn thành' : isPaused ? 'Dự án đang tạm dừng' : ''}
        >
          {showForm ? "Đóng" : "Thêm bình luận"}
        </button>
      </div>

      {showForm && (
        <form className="mb-3 p-3 border bg-white rounded-lg space-y-2" onSubmit={handleSubmit}>
          <MentionTextarea
            value={content}
            onChange={setContent}
            onMentionsChange={setMentions}
            placeholder="Viết bình luận... (Gõ @ để tag người dùng)"
            subtaskId={subtaskId}
            className="border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />

          {/* File input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id={`file-input-subtask-${subtaskId}`}
              disabled={submitting}
            />
            <label
              htmlFor={`file-input-subtask-${subtaskId}`}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 disabled:opacity-50"
            >
              <Paperclip size={16} />
              Đính kèm file (tối đa 5)
            </label>
          </div>

          {/* Selected files preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-1">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded">
                  <Paperclip size={14} className="text-gray-500" />
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-gray-500">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <div className="text-xs text-red-500">{error}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={16} />
              {submitting ? "Đang gửi..." : "Gửi"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setContent("");
                setSelectedFiles([]);
                setMentions([]);
                setError("");
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 py-4 text-center">Đang tải bình luận...</div>
      ) : comments.length === 0 ? (
        <div className="text-sm text-gray-500 py-4 text-center">Chưa có bình luận nào</div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white p-3 rounded-lg border">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-800">
                      {comment.author?.hoten || "Người dùng"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{comment.author?.manv}</p>
                </div>
                {userId && comment.authorId === Number(userId) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Xóa bình luận"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <MentionText
                text={comment.content}
                className="text-sm text-gray-700 whitespace-pre-wrap mb-2"
              />

              {/* Attachments */}
              {comment.attachments && Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {comment.attachments.map((attachment, idx) => {
                    const dataUrl = getBase64DataUrl(attachment.mimetype, attachment.data);

                    if (isImage(attachment.mimetype)) {
                      return (
                        <div key={idx} className="relative">
                          <a href={dataUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={dataUrl}
                              alt={attachment.filename}
                              className="max-w-xs max-h-48 rounded border hover:opacity-80 transition"
                            />
                          </a>
                          <p className="text-xs text-gray-500 mt-1">{attachment.filename}</p>
                        </div>
                      );
                    } else {
                      return (
                        <a
                          key={idx}
                          href={dataUrl}
                          download={attachment.filename}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 text-sm"
                        >
                          <FileText size={16} className="text-gray-500" />
                          <span className="flex-1 truncate">{attachment.filename}</span>
                          <span className="text-xs text-gray-500">{formatFileSize(attachment.size)}</span>
                          <Download size={14} className="text-gray-500" />
                        </a>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

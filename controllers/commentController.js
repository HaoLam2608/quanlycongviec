'use strict';

const {
  Comment,
  User,
  Task,
  Subtask,
  Notification,
  UserNotification,
  GroupMember,
  Assignment,
  DuAn,
  Group,
  GroupProject
} = require('../models');

/**
 * Extract user IDs from @mentions in text
 * Supports: @userId, @[userId], @username
 * Returns array of unique user IDs
 */
const extractMentions = (text) => {
  if (!text) return [];

  // Match @userId or @[userId] pattern
  const mentionPattern = /@\[?(\d+)\]?|@(\w+)/g;
  const mentions = new Set();
  let match;

  while ((match = mentionPattern.exec(text)) !== null) {
    const userId = match[1]; // Direct userId like @123
    if (userId) {
      mentions.add(parseInt(userId));
    }
  }

  return Array.from(mentions);
};

/**
 * Get all members who have access to a task (for mention suggestions)
 */
const getTaskMembers = async (taskId) => {
  const task = await Task.findByPk(taskId, {
    include: [
      {
        model: Assignment,
        as: 'assignments',
        include: [{ model: User, as: 'user', attributes: ['id', 'manv', 'hoten', 'email'] }]
      }
    ]
  });

  if (!task) return [];

  const members = task.assignments?.map(a => a.user).filter(u => u) || [];
  return members;
};

/**
 * Create mention notifications for tagged users
 */
const createMentionNotifications = async (comment, authorId, mentionedUserIds) => {
  console.log('🔔 createMentionNotifications called with:', { 
    commentId: comment.id, 
    authorId, 
    mentionedUserIds,
    mentionedUserIdsType: typeof mentionedUserIds,
    isArray: Array.isArray(mentionedUserIds)
  });
  
  if (!mentionedUserIds || mentionedUserIds.length === 0) {
    console.log('⏭️ No mentions to process');
    return;
  }

  // Ensure we only create notifications for distinct recipients and skip the author
  const recipientIds = [...new Set(mentionedUserIds)].filter(id => id !== authorId);
  console.log('📧 Recipients after filtering:', recipientIds);
  
  if (recipientIds.length === 0) {
    console.log('⏭️ No recipients after filtering (author or duplicates)');
    return;
  }

  try {
    const author = await User.findByPk(authorId, { attributes: ['hoten', 'manv'] });
    const authorName = author?.hoten || author?.manv || 'Người dùng';
    console.log('👤 Author name:', authorName);

    let contextTitle = '';
    let message = '';

    if (comment.taskId) {
      try {
        const task = await Task.findByPk(comment.taskId, { attributes: ['tentask'] });
        contextTitle = task?.tentask || 'Task';
      } catch (e) {
        console.error('Error fetching task title for mention message:', e);
      }
      message = `${authorName} đã nhắc đến bạn trong bình luận của task "${contextTitle || 'Task'}"`;
    } else if (comment.subtaskId) {
      try {
        const subtask = await Subtask.findByPk(comment.subtaskId, { attributes: ['tenSubtask'] });
        contextTitle = subtask?.tenSubtask || 'Subtask';
      } catch (e) {
        console.error('Error fetching subtask title for mention message:', e);
      }
      message = `${authorName} đã nhắc đến bạn trong bình luận của subtask "${contextTitle || 'Subtask'}"`;
    } else {
      message = `${authorName} đã nhắc đến bạn trong một bình luận`;
    }

    // Append a short excerpt of the comment content if available
    if (comment.content) {
      const normalized = comment.content.trim().replace(/\s+/g, ' ');
      const excerpt = normalized.length > 150 ? `${normalized.slice(0, 147)}...` : normalized;
      if (excerpt) {
        message = `${message}\n"${excerpt}"`;
      }
    }

    const notification = await Notification.create({
      title: `${authorName} đã nhắc đến bạn`,
      content: message,
      type: 'task',
      priority: 'medium',
      targetAudience: 'direct',
      authorId,
      status: 'published',
      publishedAt: new Date()
    });
    console.log('📬 Notification created:', notification.id);

    const metaPayload = {
      eventType: 'mention',
      relatedType: 'comment',
      commentId: comment.id,
      taskId: comment.taskId || null,
      subtaskId: comment.subtaskId || null,
      mentionedBy: authorId,
      contextTitle: contextTitle || null
    };
    console.log('📦 Meta payload:', metaPayload);

    await UserNotification.bulkCreate(
      recipientIds.map(userId => ({
        userId,
        notificationId: notification.id,
        isRead: false,
        meta: { ...metaPayload }
      }))
    );
    console.log('✅ UserNotifications created for:', recipientIds.length, 'users');
  } catch (error) {
    console.error('❌ Error creating mention notifications:', error);
    console.error('Error stack:', error.stack);
    throw error; // Re-throw to be caught by caller
  }
};

const createComment = async (req, res) => {
  try {
    console.log('📨 Received comment request');
    console.log('👤 User:', req.user ? req.user.id : 'not authenticated');
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    console.log('📎 Files received:', req.files ? 'YES' : 'NO');
    if (req.files) {
      console.log('📎 Files type:', Array.isArray(req.files) ? 'Array' : 'Object');
      console.log('📎 Files structure:', Array.isArray(req.files) ? req.files.length : Object.keys(req.files));
    }

    const authorId = req.user && req.user.id;
    if (!authorId) return res.status(401).json({ message: 'Unauthorized' });

    const { taskId, subtaskId, content, mentions: mentionsStr } = req.body;

    // Validate: must have either taskId or subtaskId
    if (!taskId && !subtaskId) {
      return res.status(400).json({ message: 'Either taskId or subtaskId is required' });
    }

    // Must have either content or files
    const allFiles = [];
    if (req.files) {
      if (Array.isArray(req.files)) {
        allFiles.push(...req.files);
      } else {
        if (req.files['images']) allFiles.push(...req.files['images']);
        if (req.files['files']) allFiles.push(...req.files['files']);
        if (req.files['attachments']) allFiles.push(...req.files['attachments']);
      }
    }

    if (!content && allFiles.length === 0) {
      return res.status(400).json({ message: 'Content or attachments required' });
    }

    // Verify task or subtask exists
    if (taskId) {
      const task = await Task.findByPk(taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });
    }
    if (subtaskId) {
      const subtask = await Subtask.findByPk(subtaskId);
      if (!subtask) return res.status(404).json({ message: 'Subtask not found' });
    }

    // Handle file attachments - convert to base64
    let attachments = null;
    if (allFiles.length > 0) {
      console.log('Processing files:', allFiles.length);
      try {
        attachments = allFiles.map(file => {
          console.log('Processing file:', file.originalname, 'size:', file.size, 'mimetype:', file.mimetype);

          // Check file size (limit to 1MB for base64 storage in MySQL)
          const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File ${file.originalname} quá lớn. Tối đa 1MB cho lưu trữ trong database.`);
          }

          // Convert buffer to base64 (multer is using memoryStorage)
          const base64Data = file.buffer.toString('base64');
          console.log('Base64 length:', base64Data.length, 'bytes');

          return {
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            data: base64Data // Store base64 encoded data
          };
        });
        console.log('Attachments prepared:', attachments.length);
      } catch (fileErr) {
        console.error('Error processing files:', fileErr);
        return res.status(400).json({ message: fileErr.message || 'Lỗi xử lý file' });
      }
    } else {
      console.log('No files received in request');
    }

    console.log('Creating comment with data:', {
      authorId,
      taskId,
      subtaskId,
      contentLength: content ? content.length : 0,
      attachmentsCount: attachments ? attachments.length : 0,
      totalSize: attachments ? JSON.stringify(attachments).length : 0
    });

    // Parse mentions from body (sent as JSON string) or extract from content
    let mentions = [];
    if (mentionsStr) {
      try {
        console.log('Parsing mentions string:', mentionsStr, 'type:', typeof mentionsStr);
        mentions = JSON.parse(mentionsStr);
        console.log('Parsed mentions:', mentions, 'isArray:', Array.isArray(mentions));
      } catch (e) {
        console.warn('Failed to parse mentions JSON:', e.message, '- extracting from content');
        mentions = extractMentions(content);
      }
    } else {
      mentions = extractMentions(content);
    }
    console.log('Final extracted mentions:', mentions);

    const comment = await Comment.create({
      authorId,
      taskId,
      subtaskId,
      content: content || '', // Default to empty string if no content
      attachments,
      mentions: mentions.length > 0 ? mentions : null
    });
    console.log('Comment created with ID:', comment.id);

    // Create notifications for mentioned users
    if (mentions.length > 0) {
      console.log('Creating mention notifications for:', mentions);
      try {
        await createMentionNotifications(comment, authorId, mentions);
        console.log('✅ Created mention notifications for users:', mentions);
      } catch (notifError) {
        console.error('❌ Error creating mention notifications:', notifError);
        console.error('Stack:', notifError.stack);
        // Don't fail the whole comment creation if notifications fail
      }
    }

    // Reload with author info
    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'manv', 'hoten', 'email'] }]
    });

    // Parse attachments if it's a string
    const result = commentWithAuthor.toJSON();
    if (result.attachments && typeof result.attachments === 'string') {
      try {
        result.attachments = JSON.parse(result.attachments);
      } catch (e) {
        console.error('Failed to parse attachments JSON:', e);
        result.attachments = [];
      }
    }

    return res.status(201).json(result);
  } catch (err) {
    console.error('❌ createComment error:', err);
    console.error('Error stack:', err.stack);
    console.error('Error details:', {
      message: err.message,
      name: err.name,
      taskId: req.body.taskId,
      subtaskId: req.body.subtaskId
    });
    return res.status(500).json({
      message: 'Internal server error',
      error: err.message
    });
  }
};

const listCommentsByTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const comments = await Comment.findAll({
      where: { taskId },
      attributes: ['id', 'content', 'authorId', 'taskId', 'subtaskId', 'mentions', 'createdAt', 'updatedAt'],
      include: [
        { model: User, as: 'author', attributes: ['id', 'manv', 'hoten', 'email'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Load attachments separately for each comment to avoid large sort operations
    const commentsWithAttachments = await Promise.all(comments.map(async (c) => {
      const json = c.toJSON();
      
      // Fetch attachments separately
      const fullComment = await Comment.findByPk(c.id, {
        attributes: ['attachments']
      });
      
      // Parse JSON string to array if needed
      if (fullComment && fullComment.attachments) {
        if (typeof fullComment.attachments === 'string') {
          try {
            json.attachments = JSON.parse(fullComment.attachments);
          } catch (e) {
            console.error('Failed to parse attachments JSON:', e);
            json.attachments = [];
          }
        } else {
          json.attachments = fullComment.attachments;
        }
      } else {
        json.attachments = [];
      }
      
      return json;
    }));

    return res.json(commentsWithAttachments);
  } catch (err) {
    console.error('listCommentsByTask error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const listCommentsBySubtask = async (req, res) => {
  try {
    const subtaskId = req.params.id;
    const comments = await Comment.findAll({
      where: { subtaskId },
      attributes: ['id', 'content', 'authorId', 'taskId', 'subtaskId', 'mentions', 'createdAt', 'updatedAt'],
      include: [
        { model: User, as: 'author', attributes: ['id', 'manv', 'hoten', 'email'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Load attachments separately for each comment to avoid large sort operations
    const commentsWithAttachments = await Promise.all(comments.map(async (c) => {
      const json = c.toJSON();
      
      // Fetch attachments separately
      const fullComment = await Comment.findByPk(c.id, {
        attributes: ['attachments']
      });
      
      // Parse JSON string to array if needed
      if (fullComment && fullComment.attachments) {
        if (typeof fullComment.attachments === 'string') {
          try {
            json.attachments = JSON.parse(fullComment.attachments);
          } catch (e) {
            console.error('Failed to parse attachments JSON:', e);
            json.attachments = [];
          }
        } else {
          json.attachments = fullComment.attachments;
        }
      } else {
        json.attachments = [];
      }
      
      return json;
    }));

    return res.json(commentsWithAttachments);
  } catch (err) {
    console.error('listCommentsBySubtask error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const id = req.params.id;
    const comment = await Comment.findByPk(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Allow author to delete
    if (!req.user || req.user.id !== comment.authorId) {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    await comment.destroy();
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteComment error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateComment = async (req, res) => {
  try {
    const id = req.params.id;
    const { content } = req.body;
    const authorId = req.user && req.user.id;

    if (!authorId) return res.status(401).json({ message: 'Unauthorized' });

    const comment = await Comment.findByPk(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Only author can edit
    if (comment.authorId !== authorId) {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    // Handle new file attachments if provided
    let attachments = comment.attachments;
    if (req.files && req.files.length > 0) {
      console.log('Processing new files for update:', req.files.length);

      try {
        const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

        const newAttachments = req.files.map(file => {
          console.log('Processing file:', file.originalname, 'size:', file.size, 'mimetype:', file.mimetype);

          if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File ${file.originalname} quá lớn. Tối đa 1MB cho lưu trữ trong database.`);
          }

          const fileBuffer = fs.readFileSync(file.path);
          const base64Data = fileBuffer.toString('base64');

          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            console.error('Error deleting temp file:', err);
          }

          return {
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            data: base64Data
          };
        });

        // Parse existing attachments if string
        let existingAttachments = [];
        if (attachments) {
          if (typeof attachments === 'string') {
            try {
              existingAttachments = JSON.parse(attachments);
            } catch (e) {
              console.error('Failed to parse existing attachments:', e);
            }
          } else if (Array.isArray(attachments)) {
            existingAttachments = attachments;
          }
        }

        // Combine existing and new attachments
        attachments = [...existingAttachments, ...newAttachments];
      } catch (fileErr) {
        console.error('File processing error:', fileErr);
        return res.status(400).json({ message: fileErr.message });
      }
    }

    // Extract mentions from content
    const oldMentions = comment.mentions ? (Array.isArray(comment.mentions) ? comment.mentions : JSON.parse(comment.mentions)) : [];
    const newMentions = extractMentions(content);
    const addedMentions = newMentions.filter(id => !oldMentions.includes(id));

    console.log('Old mentions:', oldMentions, 'New mentions:', newMentions, 'Added:', addedMentions);

    // Update comment
    await comment.update({
      content: content || comment.content,
      attachments: attachments,
      mentions: newMentions.length > 0 ? newMentions : null
    });

    // Create notifications for newly mentioned users
    if (addedMentions.length > 0) {
      await createMentionNotifications(comment, authorId, addedMentions);
      console.log('Created mention notifications for new users:', addedMentions);
    }

    // Reload with author info
    const updatedComment = await Comment.findByPk(id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'manv', 'hoten', 'email'] }]
    });

    // Parse attachments if it's a string
    const result = updatedComment.toJSON();
    if (result.attachments && typeof result.attachments === 'string') {
      try {
        result.attachments = JSON.parse(result.attachments);
      } catch (e) {
        console.error('Failed to parse attachments JSON:', e);
        result.attachments = [];
      }
    }

    return res.json(result);
  } catch (err) {
    console.error('updateComment error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get mentionable users for a task/subtask
 */
const getMentionableUsers = async (req, res) => {
  try {
    const { taskId, subtaskId } = req.query;

    if (!taskId && !subtaskId) {
      return res.status(400).json({ message: 'taskId or subtaskId required' });
    }

    const userMap = new Map(); // To avoid duplicates

    if (taskId) {
      // Get task with related users
      const task = await Task.findByPk(taskId, {
        include: [
          { model: User, as: 'nguoiGiao', attributes: ['id', 'manv', 'hoten', 'email'] },
          { model: User, as: 'nguoiDuocGiao', attributes: ['id', 'manv', 'hoten', 'email'] },
          {
            model: DuAn,
            as: 'duan',
            include: [
              {
                model: GroupProject,
                as: 'groupProjects',
                include: [
                  {
                    model: Group,
                    as: 'group',
                    include: [
                      {
                        model: User,
                        as: 'members',
                        attributes: ['id', 'manv', 'hoten', 'email'],
                        through: { attributes: [] } // Don't include join table attributes
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      });

      if (task) {
        // Add nguoiGiao and nguoiDuocGiao
        if (task.nguoiGiao) userMap.set(task.nguoiGiao.id, task.nguoiGiao);
        if (task.nguoiDuocGiao) userMap.set(task.nguoiDuocGiao.id, task.nguoiDuocGiao);

        // Add all group members from the project
        if (task.duan && task.duan.groupProjects) {
          task.duan.groupProjects.forEach(gp => {
            if (gp.group && gp.group.members) {
              gp.group.members.forEach(member => {
                // member is directly a User object due to belongsToMany
                userMap.set(member.id, member);
              });
            }
          });
        }

        // Also get assignments if they exist
        const assignments = await Assignment.findAll({
          where: { taskId },
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'manv', 'hoten', 'email'] },
            { model: User, as: 'manager', attributes: ['id', 'manv', 'hoten', 'email'] }
          ]
        });

        assignments.forEach(assignment => {
          if (assignment.assignee) userMap.set(assignment.assignee.id, assignment.assignee);
          if (assignment.manager) userMap.set(assignment.manager.id, assignment.manager);
        });
      }
    } else if (subtaskId) {
      // Get subtask and parent task
      const subtask = await Subtask.findByPk(subtaskId, {
        include: [
          { model: User, as: 'nguoiThucHien', attributes: ['id', 'manv', 'hoten', 'email'] },
          { model: User, as: 'approver', attributes: ['id', 'manv', 'hoten', 'email'] }
        ]
      });

      if (subtask) {
        // Add subtask users
        if (subtask.nguoiThucHien) userMap.set(subtask.nguoiThucHien.id, subtask.nguoiThucHien);
        if (subtask.approver) userMap.set(subtask.approver.id, subtask.approver);

        // Get parent task users
        if (subtask.taskId) {
          const task = await Task.findByPk(subtask.taskId, {
            include: [
              { model: User, as: 'nguoiGiao', attributes: ['id', 'manv', 'hoten', 'email'] },
              { model: User, as: 'nguoiDuocGiao', attributes: ['id', 'manv', 'hoten', 'email'] },
              {
                model: DuAn,
                as: 'duan',
                include: [
                  {
                    model: GroupProject,
                    as: 'groupProjects',
                    include: [
                      {
                        model: Group,
                        as: 'group',
                        include: [
                          {
                            model: User,
                            as: 'members',
                            attributes: ['id', 'manv', 'hoten', 'email'],
                            through: { attributes: [] }
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          });

          if (task) {
            if (task.nguoiGiao) userMap.set(task.nguoiGiao.id, task.nguoiGiao);
            if (task.nguoiDuocGiao) userMap.set(task.nguoiDuocGiao.id, task.nguoiDuocGiao);

            // Add group members
            if (task.duan && task.duan.groupProjects) {
              task.duan.groupProjects.forEach(gp => {
                if (gp.group && gp.group.members) {
                  gp.group.members.forEach(member => {
                    // member is directly a User object due to belongsToMany
                    userMap.set(member.id, member);
                  });
                }
              });
            }
          }
        }

        // Get subtask assignments
        const subtaskAssignments = await Assignment.findAll({
          where: { subtaskId },
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'manv', 'hoten', 'email'] },
            { model: User, as: 'manager', attributes: ['id', 'manv', 'hoten', 'email'] }
          ]
        });

        subtaskAssignments.forEach(assignment => {
          if (assignment.assignee) userMap.set(assignment.assignee.id, assignment.assignee);
          if (assignment.manager) userMap.set(assignment.manager.id, assignment.manager);
        });
      }
    }

    const users = Array.from(userMap.values());
    console.log('Mentionable users found:', users.length, 'unique users');

    return res.json(users);
  } catch (err) {
    console.error('getMentionableUsers error', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};

module.exports = {
  createComment,
  listCommentsByTask,
  listCommentsBySubtask,
  deleteComment,
  updateComment,
  getMentionableUsers
};

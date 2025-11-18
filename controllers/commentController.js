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
const { Op } = require('sequelize');

/**
 * Extract mentions from text.
 * Supports: @123, @[123], @manv, @hoten (exact match)
 * Returns array of user IDs.
 * This function performs DB lookup for username-like mentions, so it's async.
 */
const extractMentions = async (text) => {
  if (!text) return [];

  const mentionPattern = /@\[?(\d+)\]?|@([\w.@\-\s]+)/g;
  const mentions = new Set();
  const nameTokens = new Set();
  let match;

  while ((match = mentionPattern.exec(text)) !== null) {
    const userId = match[1]; // numeric id
    const nameToken = match[2]; // username/manv/hoten
    if (userId) {
      mentions.add(parseInt(userId));
    } else if (nameToken) {
      // trim and push to name tokens to resolve later
      const cleaned = nameToken.trim();
      if (cleaned) nameTokens.add(cleaned);
    }
  }

  // Resolve name tokens to user IDs by matching manv, hoten or email exactly
  if (nameTokens.size > 0) {
    try {
      const tokens = Array.from(nameTokens);
      // 1) try exact matches (manv/hoten/email)
      const exactUsers = await User.findAll({
        where: {
          [Op.or]: [
            { manv: { [Op.in]: tokens } },
            { hoten: { [Op.in]: tokens } },
            { email: { [Op.in]: tokens } }
          ]
        },
        attributes: ['id', 'manv', 'hoten', 'email']
      });
      exactUsers.forEach(u => mentions.add(u.id));

      // 2) For tokens not resolved, try partial/case-insensitive LIKE matching
      const resolvedNames = new Set(exactUsers.map(u => u.manv).filter(Boolean).concat(exactUsers.map(u => u.hoten).filter(Boolean)));
      const unresolved = tokens.filter(t => !resolvedNames.has(t));
      if (unresolved.length > 0) {
        // Build OR clauses for LIKE across fields for all unresolved tokens
        const likeClauses = [];
        unresolved.forEach(t => {
          if (!t || t.length < 2) return; // skip too-short tokens
          likeClauses.push({ hoten: { [Op.like]: `%${t}%` } });
          likeClauses.push({ manv: { [Op.like]: `%${t}%` } });
          likeClauses.push({ email: { [Op.like]: `%${t}%` } });
        });

        if (likeClauses.length > 0) {
          const likeUsers = await User.findAll({
            where: { [Op.or]: likeClauses },
            attributes: ['id', 'manv', 'hoten', 'email']
          });
          likeUsers.forEach(u => mentions.add(u.id));
          if (likeUsers.length > 0) {
            console.log('Resolved mention name tokens via LIKE to users:', likeUsers.map(u => ({ id: u.id, manv: u.manv, hoten: u.hoten }))); 
          }
        }
      }
    } catch (err) {
      console.error('Error resolving mention names to users:', err);
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
  if (!mentionedUserIds || mentionedUserIds.length === 0) return;

  try {
    const author = await User.findByPk(authorId, { attributes: ['hoten'] });
    const authorName = author?.hoten || 'Người dùng';

    // Determine context and friendly title/content
    let title = 'Bạn được nhắc đến';
    let content = '';
    if (comment.taskId) {
      const task = await Task.findByPk(comment.taskId, { attributes: ['tentask'] });
      content = `${authorName} đã nhắc đến bạn trong bình luận của task "${task?.tentask || 'Task'}"`;
    } else if (comment.subtaskId) {
      const subtask = await Subtask.findByPk(comment.subtaskId, { attributes: ['tenSubtask'] });
      content = `${authorName} đã nhắc đến bạn trong bình luận của subtask "${subtask?.tenSubtask || 'Subtask'}"`;
    } else {
      content = `${authorName} đã nhắc đến bạn trong một bình luận.`;
    }

    // Create a Notification record (one parent) and then per-user UserNotification links
    const notif = await Notification.create({
      title,
      content,
      type: 'task',
      priority: 'medium',
      status: 'published',
      targetAudience: 'member',
      authorId
    });
    console.log('Created parent Notification for mentions:', { id: notif.id, title: notif.title, type: notif.type, targetAudience: notif.targetAudience });

    // Normalize mentionedUserIds: coerce to integers, dedupe, remove author
    const normalizedIds = Array.from(new Set((mentionedUserIds || [])
      .map(id => {
        if (!id && id !== 0) return null;
        // if object with id property
        if (typeof id === 'object' && id.id) return Number(id.id);
        return Number(id);
      })
      .filter(n => Number.isInteger(n) && n > 0 && n !== authorId)
    ));

    if (normalizedIds.length === 0) {
      console.log('No valid mentioned user IDs after normalization, skipping creating UserNotifications');
      return;
    }

    // Prepare UserNotification entries
    const userNotifRows = normalizedIds.map(uId => ({
      userId: uId,
      notificationId: notif.id,
      isRead: false,
      meta: {
        relatedType: 'comment',
        relatedId: comment.id,
        taskId: comment.taskId || null,
        subtaskId: comment.subtaskId || null
      }
    }));

    try {
      // Ask Sequelize to return created rows (Postgres respects returning; MySQL will still create rows)
      const createdRows = await UserNotification.bulkCreate(userNotifRows, { returning: true });
      console.log('Created UserNotification rows (ids):', createdRows.map(r => ({ id: r.id, userId: r.userId, notificationId: r.notificationId })) );

      // Verify meta persisted by fetching the rows from DB and logging their meta field
      try {
        const persisted = await UserNotification.findAll({
          where: { notificationId: notif.id },
          attributes: ['id', 'userId', 'notificationId', 'meta']
        });
        console.log('Persisted UserNotification rows (with meta):', persisted.map(p => ({ id: p.id, userId: p.userId, meta: p.meta }))); 
      } catch (fetchErr) {
        console.warn('Unable to re-fetch created UserNotification rows for verification:', fetchErr);
      }
    } catch (err) {
      console.error('Error bulk creating UserNotification rows:', err);
      throw err;
    }
  } catch (err) {
    // Let caller handle errors; log for diagnostics
    console.error('createMentionNotifications error:', err);
    throw err;
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
        mentions = JSON.parse(mentionsStr);
      } catch (e) {
        console.warn('Failed to parse mentions JSON, extracting from content');
        mentions = await extractMentions(content);
      }
    } else {
      mentions = await extractMentions(content);
    }
    console.log('Extracted mentions:', mentions);

    const comment = await Comment.create({ 
      authorId, 
      taskId, 
      subtaskId, 
      content: content || '', // Default to empty string if no content
      attachments,
      mentions: mentions.length > 0 ? mentions : null
    });
    console.log('Comment created with ID:', comment.id);
    
    // Create notifications for mentioned users (do not fail comment creation if notifications fail)
    if (mentions.length > 0) {
      try {
        await createMentionNotifications(comment, authorId, mentions);
        console.log('Created mention notifications for users:', mentions);
      } catch (noteErr) {
        console.error('createMentionNotifications failed, continuing. Error:', noteErr);
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
      include: [
        { model: User, as: 'author', attributes: ['id', 'manv', 'hoten', 'email'] }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    // Ensure attachments is always an array and parsed from JSON
    const commentsWithAttachments = comments.map(c => {
      const json = c.toJSON();
      // Parse JSON string to array if needed
      if (json.attachments) {
        if (typeof json.attachments === 'string') {
          try {
            json.attachments = JSON.parse(json.attachments);
          } catch (e) {
            console.error('Failed to parse attachments JSON:', e);
            json.attachments = [];
          }
        }
      } else {
        json.attachments = [];
      }
      return json;
    });
    
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
      include: [
        { model: User, as: 'author', attributes: ['id', 'manv', 'hoten', 'email'] }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    // Ensure attachments is always an array and parsed from JSON
    const commentsWithAttachments = comments.map(c => {
      const json = c.toJSON();
      // Parse JSON string to array if needed
      if (json.attachments) {
        if (typeof json.attachments === 'string') {
          try {
            json.attachments = JSON.parse(json.attachments);
          } catch (e) {
            console.error('Failed to parse attachments JSON:', e);
            json.attachments = [];
          }
        }
      } else {
        json.attachments = [];
      }
      return json;
    });
    
    return res.json(commentsWithAttachments);
  } catch (err) {
    console.error('listCommentsBySubtask error', err);
    return res.status(500).json({ message: 'Internal server error' });
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

    // Before deleting the comment, remove any UserNotifications / Notifications created for this comment mentions
    try {
      // First try: meta JSON matching (works when meta is stored as JSON object)
      let relatedUserNotifs = await UserNotification.findAll({
        where: {
          meta: {
            relatedType: 'comment',
            relatedId: comment.id
          }
        }
      });

      // Fallback: if none found, try LIKE search on meta string (covers cases where meta stored as string)
      if ((!relatedUserNotifs || relatedUserNotifs.length === 0) && UserNotification.sequelize) {
        try {
          const pattern = `%"relatedId":%${comment.id}%`;
          const [rows] = await UserNotification.sequelize.query(
            'SELECT id, notificationId, userId, meta FROM `UserNotifications` WHERE meta LIKE :pattern',
            { replacements: { pattern } }
          );
          if (rows && rows.length > 0) {
            // convert raw rows to model-like objects
            relatedUserNotifs = rows.map(r => ({ id: r.id, notificationId: r.notificationId, userId: r.userId, meta: r.meta }));
          }
        } catch (qerr) {
          console.warn('Fallback meta LIKE query failed:', qerr);
        }
      }

      if (relatedUserNotifs && relatedUserNotifs.length > 0) {
        const notifIds = Array.from(new Set(relatedUserNotifs.map(n => n.notificationId)));
        const userNotifIds = relatedUserNotifs.map(n => n.id);
        // delete user-specific rows
        await UserNotification.destroy({ where: { id: userNotifIds } });
        // delete parent notifications that were created for these mention events
        await Notification.destroy({ where: { id: notifIds } });
        console.log(`Deleted ${userNotifIds.length} UserNotification rows and ${notifIds.length} Notification(s) related to comment ${comment.id}`);
      }
    } catch (err) {
      console.error('Error cleaning up notifications for deleted comment:', err);
      // continue to delete comment even if cleanup fails
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
  const newMentions = await extractMentions(content);
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
          // Subtask model defines 'nguoiThucHien' as the performer
          { model: User, as: 'nguoiThucHien', attributes: ['id', 'manv', 'hoten', 'email'] }
        ]
      });
      
      if (subtask) {
  // Add subtask users (Subtask uses 'nguoiThucHien' as the performer)
  if (subtask.nguoiThucHien) userMap.set(subtask.nguoiThucHien.id, subtask.nguoiThucHien);
        
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

const { DuAn, User, Task, Subtask, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Get public statistics for the landing page
 * No authentication required
 */
exports.getPublicStats = async (req, res) => {
  try {
    // Get total projects
    const totalProjects = await DuAn.count();

    // Get active projects (status = 'dang_chay')
    const activeProjects = await DuAn.count({
      where: { status: 'dang_chay' }
    });

    // Get total users
    const totalUsers = await User.count();

    // Get total tasks (including both tasks and subtasks)
    const totalTasks = await Task.count();
    const totalSubtasks = await Subtask.count();
    const combinedTasks = totalTasks + totalSubtasks;

    // Get completed tasks for completion rate
    const completedTasks = await Task.count({
      where: { trangthai: 'Hoàn thành' }
    });
    const completedSubtasks = await Subtask.count({
      where: { trangthai: 'Hoàn thành' }
    });
    const totalCompleted = completedTasks + completedSubtasks;
    
    // Calculate completion rate
    const completionRate = combinedTasks > 0 
      ? Math.round((totalCompleted / combinedTasks) * 100) 
      : 0;

    res.json({
      totalProjects,
      activeProjects,
      totalUsers,
      totalTasks: combinedTasks,
      completionRate,
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thống kê công khai',
      error: error.message 
    });
  }
};

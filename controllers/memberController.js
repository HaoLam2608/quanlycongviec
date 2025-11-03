const { User, Task, Subtask, DuAn, Worklog } = require('../models');
const { Op } = require('sequelize');

// Get member dashboard statistics
const getMemberStats = async (req, res) => {
    try {
        // For testing, return mock data first
        const mockStats = {
            totalTasks: 15,
            completedTasks: 8,
            inProgressTasks: 5,
            overdueTasks: 2,
            completionRate: 53
        };

        res.json(mockStats);

    } catch (error) {
        console.error('Error getting member stats:', error);
        res.status(500).json({ message: 'Không thể lấy thống kê thành viên', error: error.message });
    }
};

// Get today's tasks for member
const getTodayTasks = async (req, res) => {
    try {
        // Return mock data for testing
        const mockTodayTasks = [
            {
                id: 1,
                tentask: "Thiết kế UI Dashboard",
                priority: "high",
                deadline: "2025-11-03",
                status: "Đang chạy",
                type: "task"
            },
            {
                id: 2,
                tentask: "Code API endpoint",
                tenSubtask: "Viết unit test",
                priority: "medium",
                deadline: "2025-11-03",
                status: "Chưa bắt đầu",
                type: "subtask"
            }
        ];

        res.json(mockTodayTasks);

    } catch (error) {
        console.error('Error getting today tasks:', error);
        res.status(500).json({ message: 'Không thể lấy công việc hôm nay', error: error.message });
    }
};

// Get upcoming tasks (next 7 days)
const getUpcomingTasks = async (req, res) => {
    try {
        // Return mock data for testing
        const mockUpcomingTasks = [
            {
                id: 1,
                title: "Deploy lên staging",
                deadline: "2025-11-05",
                priority: "high",
                daysLeft: 2
            },
            {
                id: 2,
                title: "Testing tích hợp",
                deadline: "2025-11-07",
                priority: "medium",
                daysLeft: 4
            }
        ];

        res.json(mockUpcomingTasks);

    } catch (error) {
        console.error('Error getting upcoming tasks:', error);
        res.status(500).json({ message: 'Không thể lấy công việc sắp tới', error: error.message });
    }
};

// Get recent activities for member
const getRecentActivities = async (req, res) => {
    try {
        // Return mock data for testing
        const mockActivities = [
            {
                id: 1,
                action: "Hoàn thành",
                taskTitle: "Setup database",
                timestamp: "2 giờ trước",
                type: "status_change"
            },
            {
                id: 2,
                action: "Thêm comment",
                taskTitle: "Code review PR #123",
                timestamp: "4 giờ trước",
                type: "comment"
            },
            {
                id: 3,
                action: "Log 3h làm việc",
                taskTitle: "Thiết kế database",
                timestamp: "1 ngày trước",
                type: "worklog"
            }
        ];

        res.json(mockActivities);

    } catch (error) {
        console.error('Error getting recent activities:', error);
        res.status(500).json({ message: 'Không thể lấy hoạt động gần đây', error: error.message });
    }
};

// Get member's tasks with filters
const getMemberTasks = async (req, res) => {
    try {
        // Return mock data for testing
        res.json({
            tasks: [],
            subtasks: []
        });

    } catch (error) {
        console.error('Error getting member tasks:', error);
        res.status(500).json({ message: 'Không thể lấy danh sách công việc', error: error.message });
    }
};

module.exports = {
    getMemberStats,
    getTodayTasks,
    getUpcomingTasks,
    getRecentActivities,
    getMemberTasks
};
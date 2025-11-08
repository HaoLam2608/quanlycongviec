const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Lấy id user, task, subtask mẫu
        const users = await queryInterface.sequelize.query("SELECT id, manv FROM `Users`", { type: QueryTypes.SELECT });
        const tasks = await queryInterface.sequelize.query("SELECT id, tentask FROM `Tasks`", { type: QueryTypes.SELECT });
        const subtasks = await queryInterface.sequelize.query("SELECT id, tenSubtask, taskId FROM `Subtasks`", { type: QueryTypes.SELECT });
        
        const getUser = manv => { 
            const u = users.find(u => u.manv === manv); 
            return u ? u.id : null; 
        };
        
        const getTask = (tentask) => {
            if (tentask) {
                const t = tasks.find(t => t.tentask === tentask);
                return t ? t.id : null;
            }
            return tasks.length > 0 ? tasks[0].id : null;
        };
        
        const getSubtask = (tenSubtask) => {
            if (tenSubtask) {
                const s = subtasks.find(s => s.tenSubtask === tenSubtask);
                return s ? s.id : null;
            }
            return subtasks.length > 0 ? subtasks[0].id : null;
        };
        
        // Helper function to format date as DATEONLY (YYYY-MM-DD)
        const formatDateOnly = (date) => {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const worklogs = [];
        
        // Worklogs cho task "Phân tích yêu cầu"
        const phanTichTaskId = getTask('Phân tích yêu cầu');
        if (phanTichTaskId) {
            worklogs.push(
                {
                    user_id: getUser('BA001'),
                    task_id: phanTichTaskId,
                    subtask_id: getSubtask('Họp với khách hàng'),
                    description: 'Họp với khách hàng để thu thập yêu cầu chi tiết, ghi chép và phân tích',
                    hours_spent: 4.0,
                    work_date: formatDateOnly(new Date('2025-01-10')),
                    status: 'approved',
                    issues: null,
                    created_at: new Date('2025-01-10'),
                    updated_at: new Date('2025-01-10')
                },
                {
                    user_id: getUser('QLY001'),
                    task_id: phanTichTaskId,
                    subtask_id: getSubtask('Viết tài liệu yêu cầu'),
                    description: 'Soạn thảo tài liệu đặc tả yêu cầu hệ thống dựa trên kết quả họp',
                    hours_spent: 6.5,
                    work_date: formatDateOnly(new Date('2025-01-11')),
                    status: 'approved',
                    issues: null,
                    created_at: new Date('2025-01-11'),
                    updated_at: new Date('2025-01-11')
                },
                {
                    user_id: getUser('ADMIN001'),
                    task_id: phanTichTaskId,
                    subtask_id: getSubtask('Review và phê duyệt'),
                    description: 'Review tài liệu yêu cầu và phê duyệt',
                    hours_spent: 2.0,
                    work_date: formatDateOnly(new Date('2025-01-13')),
                    status: 'approved',
                    issues: null,
                    created_at: new Date('2025-01-13'),
                    updated_at: new Date('2025-01-13')
                }
            );
        }
        
        // Worklogs cho task "Thiết kế Database"
        const thietKeDBTaskId = getTask('Thiết kế Database');
        if (thietKeDBTaskId) {
            worklogs.push(
                {
                    user_id: getUser('DEV002'),
                    task_id: thietKeDBTaskId,
                    subtask_id: getSubtask('Vẽ ERD diagram'),
                    description: 'Thiết kế sơ đồ thực thể quan hệ, xác định các bảng và mối quan hệ',
                    hours_spent: 5.0,
                    work_date: formatDateOnly(new Date('2025-01-15')),
                    status: 'approved',
                    issues: null,
                    created_at: new Date('2025-01-15'),
                    updated_at: new Date('2025-01-15')
                },
                {
                    user_id: getUser('DEV002'),
                    task_id: thietKeDBTaskId,
                    subtask_id: getSubtask('Tạo migration scripts'),
                    description: 'Viết các script migration để tạo cấu trúc database',
                    hours_spent: 4.5,
                    work_date: formatDateOnly(new Date('2025-01-16')),
                    status: 'submitted',
                    issues: 'Cần review lại một số foreign key constraints',
                    created_at: new Date('2025-01-16'),
                    updated_at: new Date('2025-01-16')
                },
                {
                    user_id: getUser('DEV002'),
                    task_id: thietKeDBTaskId,
                    subtask_id: getSubtask('Tạo migration scripts'),
                    description: 'Tiếp tục viết migration scripts cho các bảng còn lại',
                    hours_spent: 3.0,
                    work_date: formatDateOnly(new Date('2025-01-17')),
                    status: 'draft',
                    issues: null,
                    created_at: new Date('2025-01-17'),
                    updated_at: new Date('2025-01-17')
                }
            );
        }
        
        // Worklogs cho task "Xây dựng API"
        const xayDungAPITaskId = getTask('Xây dựng API');
        if (xayDungAPITaskId) {
            worklogs.push(
                {
                    user_id: getUser('DEV002'),
                    task_id: xayDungAPITaskId,
                    subtask_id: getSubtask('API Authentication'),
                    description: 'Phát triển API đăng nhập, đăng ký và xác thực JWT',
                    hours_spent: 6.0,
                    work_date: formatDateOnly(new Date('2025-01-20')),
                    status: 'approved',
                    issues: null,
                    created_at: new Date('2025-01-20'),
                    updated_at: new Date('2025-01-20')
                },
                {
                    user_id: getUser('DEV002'),
                    task_id: xayDungAPITaskId,
                    subtask_id: getSubtask('API Authentication'),
                    description: 'Hoàn thiện JWT implementation và refresh token',
                    hours_spent: 3.5,
                    work_date: formatDateOnly(new Date('2025-01-21')),
                    status: 'submitted',
                    issues: null,
                    created_at: new Date('2025-01-21'),
                    updated_at: new Date('2025-01-21')
                },
                {
                    user_id: getUser('DEV001'),
                    task_id: xayDungAPITaskId,
                    subtask_id: getSubtask('API User Management'),
                    description: 'Bắt đầu phát triển API quản lý người dùng',
                    hours_spent: 4.0,
                    work_date: formatDateOnly(new Date('2025-01-23')),
                    status: 'draft',
                    issues: null,
                    created_at: new Date('2025-01-23'),
                    updated_at: new Date('2025-01-23')
                }
            );
        }
        
        // Worklogs cho task "Thiết kế UI/UX"
        const thietKeUITaskId = getTask('Thiết kế UI/UX');
        if (thietKeUITaskId) {
            worklogs.push(
                {
                    user_id: getUser('DES001'),
                    task_id: thietKeUITaskId,
                    subtask_id: getSubtask('Wireframe các màn hình'),
                    description: 'Vẽ wireframe cho các màn hình chính của hệ thống',
                    hours_spent: 5.5,
                    work_date: formatDateOnly(new Date('2025-01-18')),
                    status: 'draft',
                    issues: 'Cần xác nhận lại yêu cầu từ khách hàng',
                    created_at: new Date('2025-01-18'),
                    updated_at: new Date('2025-01-18')
                }
            );
        }
        
        // Worklogs tổng quát (không gắn với task/subtask cụ thể - được phép theo migration)
        worklogs.push(
            {
                user_id: getUser('QA001'),
                task_id: null,
                subtask_id: null,
                description: 'Chuẩn bị test cases cho module authentication',
                hours_spent: 3.0,
                work_date: formatDateOnly(new Date('2025-01-22')),
                status: 'submitted',
                issues: null,
                created_at: new Date('2025-01-22'),
                updated_at: new Date('2025-01-22')
            },
            {
                user_id: getUser('DEV003'),
                task_id: null,
                subtask_id: null,
                description: 'Setup CI/CD pipeline và Docker configuration',
                hours_spent: 4.5,
                work_date: formatDateOnly(new Date('2025-01-19')),
                status: 'approved',
                issues: null,
                created_at: new Date('2025-01-19'),
                updated_at: new Date('2025-01-19')
            }
        );
        
        // Lọc worklog hợp lệ (có user_id, cho phép cả worklog không gắn task/subtask)
        const valid = worklogs.filter(w => w.user_id);
        if (valid.length === 0) return;
        await queryInterface.bulkInsert('Worklogs', valid);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Worklogs', null, {});
    }
};

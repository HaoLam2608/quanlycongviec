'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // First, let's get admin and manager roles
        const roles = await queryInterface.sequelize.query(
            `SELECT id, name FROM Roles WHERE name IN ('admin', 'manager');`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (roles.length === 0) {
            console.log('No admin or manager roles found. Skipping notification seeding.');
            return;
        }

        const adminRole = roles.find(r => r.name === 'admin');
        const managerRole = roles.find(r => r.name === 'manager');

        // Get users with admin or manager roles
        const userConditions = [];
        if (adminRole) userConditions.push(`u.roleId = ${adminRole.id}`);
        if (managerRole) userConditions.push(`u.roleId = ${managerRole.id}`);

        if (userConditions.length === 0) {
            console.log('No admin or manager roles available. Skipping notification seeding.');
            return;
        }

        const users = await queryInterface.sequelize.query(
            `SELECT u.id, r.name as roleName 
       FROM Users u 
       JOIN Roles r ON u.roleId = r.id 
       WHERE ${userConditions.join(' OR ')} 
       LIMIT 5;`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (users.length === 0) {
            console.log('No admin or manager users found. Skipping notification seeding.');
            return;
        }

        const adminUser = users.find(u => u.roleName === 'admin') || users[0];
        const managerUser = users.find(u => u.roleName === 'manager') || users[0]; const notifications = [
            {
                title: 'Thông báo bảo trì hệ thống',
                content: 'Hệ thống sẽ được bảo trì vào lúc 2:00 AM ngày 15/12/2024. Dự kiến hoàn thành trong 2 giờ. Trong thời gian này, các chức năng của hệ thống sẽ tạm thời không khả dụng.',
                type: 'system',
                priority: 'high',
                status: 'published',
                targetAudience: 'all',
                authorId: adminUser.id,
                publishedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Cập nhật tính năng mới',
                content: 'Chúng tôi đã thêm tính năng theo dõi thời gian làm việc và báo cáo tiến độ chi tiết. Các bạn có thể trải nghiệm ngay bây giờ.',
                type: 'announcement',
                priority: 'medium',
                status: 'published',
                targetAudience: 'all',
                authorId: adminUser.id,
                publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
            },
            {
                title: 'Thông báo nghỉ lễ Tết Nguyên đán',
                content: 'Công ty sẽ nghỉ lễ Tết Nguyên đán từ ngày 27/1 đến 5/2/2025. Chúc mọi người năm mới vui vẻ, thành công và hạnh phúc!',
                type: 'announcement',
                priority: 'low',
                status: 'published',
                targetAudience: 'all',
                authorId: adminUser.id,
                publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
                createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
            },
            {
                title: 'Hướng dẫn sử dụng tính năng mới',
                content: 'Chúng tôi đã tạo video hướng dẫn chi tiết về cách sử dụng các tính năng mới. Các manager vui lòng xem và hướng dẫn cho team.',
                type: 'system',
                priority: 'medium',
                status: 'published',
                targetAudience: 'manager',
                authorId: adminUser.id,
                publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                title: 'Thông báo nháp - Cập nhật quy trình',
                content: 'Quy trình làm việc mới sẽ được áp dụng từ tháng 1/2025. Chi tiết sẽ được thông báo sau.',
                type: 'announcement',
                priority: 'medium',
                status: 'draft',
                targetAudience: 'all',
                authorId: adminUser.id,
                publishedAt: null,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Cảnh báo bảo mật',
                content: 'Phát hiện một số tài khoản có hoạt động đăng nhập bất thường. Vui lòng thay đổi mật khẩu và kích hoạt xác thực 2 lớp.',
                type: 'system',
                priority: 'urgent',
                status: 'published',
                targetAudience: 'all',
                authorId: adminUser.id,
                publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
            }
        ];

        // Only add manager notifications if we have a manager user
        if (managerUser && managerUser.id !== adminUser.id) {
            notifications.push({
                title: 'Báo cáo tuần từ team',
                content: 'Các thành viên vui lòng chuẩn bị báo cáo tiến độ công việc tuần này. Deadline: cuối ngày thứ 6.',
                type: 'task',
                priority: 'medium',
                status: 'published',
                targetAudience: 'member',
                authorId: managerUser.id,
                publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
                createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
            });
        }

        await queryInterface.bulkInsert('Notifications', notifications, {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('Notifications', null, {});
    }
};
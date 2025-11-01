const bcrypt = require('bcryptjs');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Xóa sạch dữ liệu cũ để tránh lỗi duplicate
        await queryInterface.bulkDelete('Users', null, {});
        await queryInterface.bulkDelete('Roles', null, {});
        await queryInterface.bulkInsert('Roles', [
            { name: 'admin', description: 'Quản trị viên hệ thống', createdAt: new Date(), updatedAt: new Date() },
            { name: 'manager', description: 'Quản lý dự án', createdAt: new Date(), updatedAt: new Date() },
            { name: 'employee', description: 'Nhân viên', createdAt: new Date(), updatedAt: new Date() }
        ]);
        // Lấy lại id thực tế của từng role
        const roles = await queryInterface.sequelize.query("SELECT id, name FROM Roles", { type: Sequelize.QueryTypes.SELECT });
        const getRoleId = (name) => roles.find(r => r.name === name)?.id;
        const hashedPassword = await bcrypt.hash('123456', 10);
        await queryInterface.bulkInsert('Users', [
            { manv: 'ADMIN001', email: 'admin001@example.com', password: hashedPassword, chucvu: 'Quản trị viên hệ thống', hoten: 'Nguyễn Minh An', sdt: '0901234567', roleId: getRoleId('admin'), createdAt: new Date(), updatedAt: new Date() },
            { manv: 'QLY001', email: 'qly001@example.com', password: hashedPassword, chucvu: 'Quản lý dự án IT', hoten: 'Trần Thành Đạt', sdt: '0912345678', roleId: getRoleId('manager'), createdAt: new Date(), updatedAt: new Date() },
            { manv: 'QLY002', email: 'qly002@example.com', password: hashedPassword, chucvu: 'Trưởng phòng Phát triển', hoten: 'Lê Thị Hoài Thu', sdt: '0923456789', roleId: getRoleId('manager'), createdAt: new Date(), updatedAt: new Date() },
            { manv: 'DEV001', email: 'dev001@example.com', password: hashedPassword, chucvu: 'Lập trình viên Frontend', hoten: 'Phan Văn Khôi', sdt: '0934567890', roleId: getRoleId('employee'), createdAt: new Date(), updatedAt: new Date() },
            { manv: 'DEV002', email: 'dev002@example.com', password: hashedPassword, chucvu: 'Lập trình viên Backend', hoten: 'Võ Thị Thanh Hương', sdt: '0945678901', roleId: getRoleId('employee'), createdAt: new Date(), updatedAt: new Date() },
            { manv: 'DEV003', email: 'dev003@example.com', password: hashedPassword, chucvu: 'Lập trình viên Fullstack', hoten: 'Đỗ Minh Quân', sdt: '0956789012', roleId: getRoleId('employee'), createdAt: new Date(), updatedAt: new Date() },
            { manv: 'QA001', email: 'qa001@example.com', password: hashedPassword, chucvu: 'Chuyên viên Kiểm thử', hoten: 'Nguyễn Thị Lan Anh', sdt: '0967890123', roleId: getRoleId('employee'), createdAt: new Date(), updatedAt: new Date() },
            { manv: 'DES001', email: 'des001@example.com', password: hashedPassword, chucvu: 'Thiết kế UI/UX', hoten: 'Bùi Thanh Long', sdt: '0978901234', roleId: getRoleId('employee'), createdAt: new Date(), updatedAt: new Date() },
            { manv: 'SUP001', email: 'sup001@example.com', password: hashedPassword, chucvu: 'Chuyên viên Hỗ trợ kỹ thuật', hoten: 'Hoàng Văn Tùng', sdt: '0989012345', roleId: getRoleId('employee'), createdAt: new Date(), updatedAt: new Date() },
            { manv: 'BA001', email: 'ba001@example.com', password: hashedPassword, chucvu: 'Business Analyst', hoten: 'Phạm Thị Mỹ Linh', sdt: '0990123456', roleId: getRoleId('employee'), createdAt: new Date(), updatedAt: new Date() }
        ]);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Users', null, {});
        await queryInterface.bulkDelete('Roles', null, {});
    }
};

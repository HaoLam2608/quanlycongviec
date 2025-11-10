"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("Groups", "status", {
            type: Sequelize.ENUM("active", "closed"),
            allowNull: false,
            defaultValue: "active",
            comment: "Trạng thái nhóm: active (đang hoạt động), closed (đã đóng)"
        });
    },
    async down(queryInterface, Sequelize) {
        // Kiểm tra xem cột có tồn tại trước khi xóa
        const tableDesc = await queryInterface.describeTable("Groups");
        if (tableDesc.status) {
            await queryInterface.removeColumn("Groups", "status");
        }
        // Dòng dưới chỉ dùng cho PostgreSQL, MySQL không cần:
        // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Groups_status";');
    }
};

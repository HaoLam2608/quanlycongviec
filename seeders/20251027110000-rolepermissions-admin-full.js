const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Lấy id role admin
        const roles = await queryInterface.sequelize.query(
            "SELECT id, name FROM Roles WHERE name = 'admin'",
            { type: QueryTypes.SELECT }
        );
        const permissions = await queryInterface.sequelize.query(
            "SELECT id FROM Permissions",
            { type: QueryTypes.SELECT }
        );
        if (!roles.length || !permissions.length) return;
        const adminId = roles[0].id;
        const now = new Date();
        const rolePermissions = permissions.map(p => ({
            roleId: adminId,
            permissionId: p.id,
            createdAt: now,
            updatedAt: now
        }));
        await queryInterface.bulkDelete('RolePermissions', { roleId: adminId });
        await queryInterface.bulkInsert('RolePermissions', rolePermissions);
    },
    async down(queryInterface, Sequelize) {
        const roles = await queryInterface.sequelize.query(
            "SELECT id FROM Roles WHERE name = 'admin'",
            { type: QueryTypes.SELECT }
        );
        if (!roles.length) return;
        await queryInterface.bulkDelete('RolePermissions', { roleId: roles[0].id });
    }
};

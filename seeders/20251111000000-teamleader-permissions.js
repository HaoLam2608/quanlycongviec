const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Get teamleader role
        const roles = await queryInterface.sequelize.query(
            "SELECT id, name FROM Roles WHERE name = 'teamleader'",
            { type: QueryTypes.SELECT }
        );
        
        if (!roles.length) {
            console.log('⚠️  Teamleader role not found, skipping permissions');
            return;
        }
        
        const teamleaderId = roles[0].id;
        
        // Get permissions that teamleader should have
        // Teamleader can manage groups, tasks, and view projects (similar to manager but less permissions)
        const permissionNames = [
            'groups:read',
            'groups:create', 
            'groups:update',
            'tasks:read',
            'tasks:create',
            'tasks:update',
            'projects:read',
            'reports:read'
        ];
        
        const permissions = await queryInterface.sequelize.query(
            `SELECT id, name FROM Permissions WHERE name IN (${permissionNames.map(n => `'${n}'`).join(',')})`,
            { type: QueryTypes.SELECT }
        );
        
        if (!permissions.length) {
            console.log('⚠️  No permissions found, skipping');
            return;
        }
        
        console.log(`✅ Found ${permissions.length} permissions for teamleader`);
        
        const now = new Date();
        const rolePermissions = permissions.map(p => ({
            roleId: teamleaderId,
            permissionId: p.id,
            createdAt: now,
            updatedAt: now
        }));
        
        // Delete existing permissions for teamleader
        await queryInterface.bulkDelete('RolePermissions', { roleId: teamleaderId });
        
        // Insert new permissions
        await queryInterface.bulkInsert('RolePermissions', rolePermissions);
        
        console.log(`✅ Assigned ${rolePermissions.length} permissions to teamleader role`);
    },
    
    async down(queryInterface, Sequelize) {
        const roles = await queryInterface.sequelize.query(
            "SELECT id FROM Roles WHERE name = 'teamleader'",
            { type: QueryTypes.SELECT }
        );
        
        if (roles.length) {
            await queryInterface.bulkDelete('RolePermissions', { roleId: roles[0].id });
        }
    }
};

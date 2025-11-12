const { sequelize, Role, Permission, RolePermission } = require('./models');

async function checkEmployeePermissions() {
    try {
        console.log('🔍 Checking employee role permissions...\n');
        
        // Find employee role
        const employeeRole = await Role.findOne({
            where: { name: 'employee' },
            include: [{
                model: Permission,
                as: 'permissions',
                through: { attributes: [] }
            }]
        });

        if (!employeeRole) {
            console.log('❌ Employee role not found!');
            process.exit(1);
        }

        console.log('✅ Employee role found:', employeeRole.name);
        console.log('📋 Permissions count:', employeeRole.permissions?.length || 0);
        console.log('\n📝 Permissions list:');
        
        if (employeeRole.permissions && employeeRole.permissions.length > 0) {
            employeeRole.permissions.forEach(p => {
                console.log(`  - ${p.name}: ${p.description || 'No description'}`);
            });
            
            // Check if tasks:update exists
            const hasTasksUpdate = employeeRole.permissions.some(p => p.name === 'tasks:update');
            console.log('\n🎯 Has tasks:update permission:', hasTasksUpdate ? '✅ YES' : '❌ NO');
        } else {
            console.log('  ❌ No permissions assigned to employee role!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkEmployeePermissions();

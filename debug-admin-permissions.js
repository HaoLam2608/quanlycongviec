const { User, Role, Permission, RolePermission } = require('./models');

async function debugAdminPermissions() {
    try {
        console.log('=== DEBUGGING ADMIN PERMISSIONS ===\n');

        // 1. Check admin user
        const adminUser = await User.findOne({ 
            where: { email: 'admin001@example.com' },
            include: [{
                model: Role,
                as: 'role'
            }]
        });
        
        if (!adminUser) {
            console.log('❌ Admin user not found');
            return;
        }
        
        console.log('✅ Admin user found:');
        console.log(`   ID: ${adminUser.id}`);
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Role: ${adminUser.role ? adminUser.role.name : 'NO ROLE'}`);
        console.log();

        if (!adminUser.role) {
            console.log('❌ Admin user has no role assigned');
            return;
        }

        // 2. Check permissions in Permission table
        const usersReadPermission = await Permission.findOne({ 
            where: { name: 'users:read' } 
        });
        
        if (!usersReadPermission) {
            console.log('❌ Permission "users:read" not found in database');
            return;
        }
        
        console.log('✅ Permission "users:read" exists:');
        console.log(`   ID: ${usersReadPermission.id}`);
        console.log(`   Name: ${usersReadPermission.name}`);
        console.log();

        // 3. Check if admin role has users:read permission
        const adminRolePermission = await RolePermission.findOne({
            where: { 
                roleId: adminUser.role.id,
                permissionId: usersReadPermission.id 
            }
        });

        if (!adminRolePermission) {
            console.log('❌ Admin role does not have "users:read" permission');
            
            // Show all permissions for admin role
            const adminPermissions = await RolePermission.findAll({
                where: { roleId: adminUser.role.id },
                include: [{
                    model: Permission,
                    as: 'permission'
                }]
            });
            
            console.log(`Admin role has ${adminPermissions.length} permissions:`);
            adminPermissions.forEach(rp => {
                console.log(`   - ${rp.permission.name}`);
            });
            return;
        }

        console.log('✅ Admin role has "users:read" permission');
        console.log();

        // 4. Test full user with role and permissions
        const fullAdminUser = await User.findByPk(adminUser.id, {
            include: [{
                model: Role,
                as: 'role',
                include: [{
                    model: Permission,
                    as: 'permissions'
                }]
            }]
        });

        const hasUsersReadPermission = fullAdminUser.role?.permissions?.some(p => 
            p.name === 'users:read'
        );

        if (hasUsersReadPermission) {
            console.log('✅ Full admin user has "users:read" permission via role');
        } else {
            console.log('❌ Full admin user does NOT have "users:read" permission');
            console.log('Permissions found:');
            fullAdminUser.role?.permissions?.forEach(p => {
                console.log(`   - ${p.name}`);
            });
        }

    } catch (error) {
        console.error('Debug error:', error);
    }
}

debugAdminPermissions().then(() => {
    process.exit(0);
}).catch(console.error);
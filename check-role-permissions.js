const { QueryTypes } = require('sequelize');
const { sequelize } = require('./models');

async function checkRolePermissions() {
    try {
        console.log('\n📊 KIỂM TRA QUYỀN CỦA CÁC ROLES\n');
        console.log('='.repeat(80));

        // Lấy tất cả roles
        const roles = await sequelize.query(
            "SELECT id, name, description FROM Roles ORDER BY id",
            { type: QueryTypes.SELECT }
        );

        for (const role of roles) {
            console.log(`\n🎭 ${role.name.toUpperCase()} (${role.description || 'Không có mô tả'})`);
            console.log('-'.repeat(80));

            // Lấy permissions của role
            const permissions = await sequelize.query(
                `SELECT p.name, p.description, p.resource, p.action 
                 FROM Permissions p
                 INNER JOIN RolePermissions rp ON p.id = rp.permissionId
                 WHERE rp.roleId = ?
                 ORDER BY p.resource, p.action`,
                { replacements: [role.id], type: QueryTypes.SELECT }
            );

            if (permissions.length === 0) {
                console.log('  ⚠️  Chưa có quyền nào được cấp');
            } else {
                console.log(`  ✅ Tổng số quyền: ${permissions.length}`);
                console.log('');

                // Nhóm theo resource
                const grouped = permissions.reduce((acc, perm) => {
                    if (!acc[perm.resource]) {
                        acc[perm.resource] = [];
                    }
                    acc[perm.resource].push(perm);
                    return acc;
                }, {});

                Object.keys(grouped).sort().forEach(resource => {
                    console.log(`  📦 ${resource}:`);
                    grouped[resource].forEach(perm => {
                        console.log(`     • ${perm.action.padEnd(10)} - ${perm.description}`);
                    });
                });
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ Hoàn thành kiểm tra!\n');

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkRolePermissions();

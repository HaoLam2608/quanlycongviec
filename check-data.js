const { User, DuAn, Task } = require('./models');

async function checkData() {
    try {
        console.log('='.repeat(60));
        console.log('🔍 CHECKING DATABASE DATA');
        console.log('='.repeat(60));

        // Check users
        const users = await User.findAll({
            attributes: ['id', 'manv', 'hoten', 'chucvu'],
            raw: true
        });
        console.log('\n👥 USERS:');
        console.table(users);

        // Check managers
        const managers = users.filter(u => u.chucvu === 'manager' || u.manv?.startsWith('QLY'));
        console.log('\n👔 MANAGERS:');
        console.table(managers);

        // Check projects
        const projects = await DuAn.findAll({
            attributes: ['id', 'tenduan', 'status', 'userId', 'ngaybatdau', 'ngayketthuc'],
            raw: true
        });
        console.log('\n📋 PROJECTS (DuAns):');
        console.table(projects);

        // Check projects by manager
        if (managers.length > 0) {
            const managerId = managers[0].id;
            console.log(`\n🔎 Projects for Manager ID ${managerId} (${managers[0].manv}):`);
            const managerProjects = projects.filter(p => p.userId === managerId);
            console.table(managerProjects);
        }

        // Check tasks
        const tasks = await Task.findAll({
            attributes: ['id', 'tenTask', 'trangThai', 'duanId'],
            limit: 10,
            raw: true
        });
        console.log('\n✅ TASKS (First 10):');
        console.table(tasks);

        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY:');
        console.log(`   Users: ${users.length}`);
        console.log(`   Managers: ${managers.length}`);
        console.log(`   Projects: ${projects.length}`);
        console.log(`   Tasks: ${tasks.length}`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

checkData();

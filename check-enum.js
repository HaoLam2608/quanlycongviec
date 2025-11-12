const { sequelize } = require('./models');

async function checkEnums() {
    try {
        console.log('🔍 Checking Tasks trangThai enum...');
        const tasksColumn = await sequelize.query(
            'SHOW COLUMNS FROM Tasks WHERE Field = "trangThai"',
            { type: sequelize.QueryTypes.SELECT }
        );
        console.log('Tasks trangThai:', JSON.stringify(tasksColumn, null, 2));

        console.log('\n🔍 Checking Subtasks trangThai enum...');
        const subtasksColumn = await sequelize.query(
            'SHOW COLUMNS FROM Subtasks WHERE Field = "trangThai"',
            { type: sequelize.QueryTypes.SELECT }
        );
        console.log('Subtasks trangThai:', JSON.stringify(subtasksColumn, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkEnums();

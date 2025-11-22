const { sequelize } = require('./models');

(async () => {
    try {
        const [results] = await sequelize.query(`
            UPDATE Subtasks 
            SET approvedAt = NOW() 
            WHERE approvedBy IS NOT NULL AND approvedAt IS NULL
        `);
        console.log('Updated rows:', results);
        
        // Check again
        const [subtasks] = await sequelize.query(`
            SELECT id, tenSubtask, approvedBy, approvedAt 
            FROM Subtasks 
            WHERE approvedBy IS NOT NULL
        `);
        console.log('Subtasks with approvedBy:', JSON.stringify(subtasks, null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();

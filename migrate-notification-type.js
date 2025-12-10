const { sequelize } = require('./models');

async function migrateNotificationType() {
    try {
        console.log('🔄 Migrating notifications type column...');
        
        await sequelize.query(`
            ALTER TABLE notifications 
            MODIFY COLUMN type ENUM('system', 'project', 'task', 'announcement', 'deadline_reminder') 
            NOT NULL DEFAULT 'announcement'
        `);
        
        console.log('✅ Migration successful!');
        console.log('Added deadline_reminder to notification type ENUM');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

migrateNotificationType();

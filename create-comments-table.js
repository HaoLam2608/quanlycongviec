const { sequelize } = require('./models');

async function createCommentsTable() {
    try {
        console.log('🔧 Creating Comments table...');

        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS Comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                authorId INT NOT NULL,
                taskId INT NULL,
                subtaskId INT NULL,
                content TEXT NOT NULL,
                attachments JSON NULL,
                mentions JSON NULL,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_authorId (authorId),
                INDEX idx_taskId (taskId),
                INDEX idx_subtaskId (subtaskId),
                INDEX idx_createdAt (createdAt),
                FOREIGN KEY (authorId) REFERENCES Users(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (taskId) REFERENCES Tasks(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (subtaskId) REFERENCES Subtasks(id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Comments table created successfully!');

        // Verify
        const [results] = await sequelize.query('DESCRIBE Comments;');
        console.log('\n📋 Comments table structure:');
        console.table(results);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

createCommentsTable();

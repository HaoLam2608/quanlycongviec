const { sequelize } = require('./models');

async function checkCommentsTable() {
    try {
        const [results] = await sequelize.query(`
            DESCRIBE Comments;
        `);
        
        console.log('📋 Comments table structure:');
        console.table(results);
        
        const hasAuthorId = results.some(col => col.Field === 'authorId');
        console.log('\n✅ Has authorId column:', hasAuthorId);
        
        if (!hasAuthorId) {
            console.log('\n⚠️  WARNING: authorId column is missing!');
            console.log('Run this SQL to add it:');
            console.log(`
ALTER TABLE Comments 
ADD COLUMN authorId INT NOT NULL AFTER id,
ADD INDEX idx_authorId (authorId),
ADD CONSTRAINT fk_comments_author 
    FOREIGN KEY (authorId) REFERENCES Users(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;
            `);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sequelize.close();
    }
}

checkCommentsTable();

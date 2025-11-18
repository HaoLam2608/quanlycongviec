const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

const env = 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect
});

async function addGroupIdColumn() {
    try {
        // Add column
        await sequelize.query('ALTER TABLE Documents ADD COLUMN groupId INT NULL');
        console.log('✅ Added groupId column');
    } catch (err) {
        console.log('⚠️  Column may exist:', err.message);
    }

    try {
        // Add foreign key
        await sequelize.query(`
            ALTER TABLE Documents 
            ADD CONSTRAINT fk_documents_groupId 
            FOREIGN KEY (groupId) 
            REFERENCES \`Groups\`(id) 
            ON UPDATE CASCADE 
            ON DELETE SET NULL
        `);
        console.log('✅ Added foreign key constraint');
    } catch (err) {
        console.log('⚠️  Foreign key may exist:', err.message);
    }

    try {
        // Mark migration as done
        await sequelize.query(`
            INSERT INTO SequelizeMeta (name) 
            VALUES ('20251201000001-add-groupId-to-documents.js')
            ON DUPLICATE KEY UPDATE name=name
        `);
        console.log('✅ Marked migration as completed');
    } catch (err) {
        console.log('⚠️  Migration record issue:', err.message);
    }

    await sequelize.close();
    console.log('✅ Done!');
}

addGroupIdColumn();

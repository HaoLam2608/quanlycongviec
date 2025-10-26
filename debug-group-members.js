(async () => {
  try {
    const db = require('./models');
    const realQi = db.sequelize.getQueryInterface();
    const Sequelize = db.Sequelize;
    const seeder = require('./seeders/20251011140100-group-members-data.js');

    // Provide a mock queryInterface that proxies SELECT queries to realQi and intercepts bulkInsert
    const mockQi = Object.create(realQi);
    mockQi.bulkInsert = async (tableName, records, options) => {
      console.log('bulkInsert called for table:', tableName);
      console.log('records to insert:', JSON.stringify(records, null, 2));
      // Do not perform actual insert to avoid DB errors
      return records.length;
    };

    await seeder.up(mockQi, Sequelize);
    console.log('Seeder up() executed with mockQi');
    process.exit(0);
  } catch (err) {
    console.error('Debug run failed:', err);
    process.exit(1);
  }
})();

const path = require('path');
(async () => {
  try {
    const db = require('./models');
    const queryInterface = db.sequelize.getQueryInterface();
    const Sequelize = db.Sequelize;
    const seeder = require('./seeders/20251004100001-rbac-data-fixed.js');
    console.log('Running seeder up()...');
    await seeder.up(queryInterface, Sequelize);
    console.log('Seeder finished.');
    process.exit(0);
  } catch (err) {
    console.error('Seeder failed with error:\n', err);
    process.exit(1);
  }
})();

const mysql = require('mysql2/promise');
(async () => {
    try {
        const c = require('../config/config.json').development;
        const conn = await mysql.createConnection({ host: c.host, user: c.username, password: c.password, database: c.database });
        const names = [
            '20251025-create-worklog.js',
            '20251025180000-recreate-worklogs.js',
            '20251025182000-add-subtaskid-to-worklogs.js',
            '20251025183000-allow-null-taskid-subtaskid-worklogs.js'
        ];
        const placeholders = names.map(() => '?').join(',');
        const sql = `DELETE FROM SequelizeMeta WHERE name IN (${placeholders})`;
        const [res] = await conn.query(sql, names);
        console.log('Deleted rows count (if any):', res.affectedRows);
        await conn.end();
    } catch (e) {
        console.error('ERROR:', e.message);
        process.exit(1);
    }
})();

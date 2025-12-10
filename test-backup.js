const backupService = require('./services/backupService');

console.log('🧪 Testing database backup service...\n');

async function test() {
    try {
        // 1. Hiển thị settings
        console.log('📋 Current settings:');
        const settings = backupService.getSettings();
        console.log(JSON.stringify(settings, null, 2));
        console.log('');

        // 2. Thực hiện backup
        console.log('💾 Performing backup...');
        const result = await backupService.performBackup();
        console.log('✅ Backup result:', result);
        console.log('');

        // 3. Hiển thị danh sách backups
        console.log('📦 Backup list:');
        const backups = backupService.getBackupList();
        backups.forEach((backup, index) => {
            console.log(`  ${index + 1}. ${backup.fileName}`);
            console.log(`     Size: ${backup.size}`);
            console.log(`     Age: ${backup.age}`);
            console.log('');
        });

        console.log('✅ Test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

test();

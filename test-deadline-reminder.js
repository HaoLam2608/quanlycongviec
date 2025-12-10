const service = require('./services/deadlineReminderService');

console.log('🚀 Testing deadline reminder service...\n');

service.sendDeadlineReminders()
    .then(() => {
        console.log('\n✅ Test completed successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ Test failed:', err);
        process.exit(1);
    });

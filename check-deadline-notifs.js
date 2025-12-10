const {UserNotification, Notification, User} = require('./models');

UserNotification.findAll({
    include: [
        {
            model: Notification, 
            as: 'notification', 
            where: {type: 'deadline_reminder'}
        }, 
        {
            model: User, 
            as: 'user', 
            attributes: ['id','hoten','email']
        }
    ], 
    order: [['createdAt', 'DESC']], 
    limit: 20
}).then(uns => {
    console.log('=== DEADLINE REMINDER NOTIFICATIONS ===');
    console.log(`Total: ${uns.length} notifications\n`);
    
    uns.forEach((un, idx) => {
        const n = un.notification;
        let meta = {};
        try {
            meta = JSON.parse(un.meta);
        } catch (e) {
            meta = un.meta;
        }
        
        console.log(`[${idx + 1}] NotificationID: ${n.id}`);
        console.log(`    Title: ${n.title}`);
        console.log(`    Sent to: User #${un.userId} - ${un.user.hoten} (${un.user.email})`);
        console.log(`    Read: ${un.isRead}`);
        console.log(`    Meta: ${JSON.stringify(meta)}`);
        console.log(`    Created: ${un.createdAt}`);
        console.log('---');
    });
    
    process.exit(0);
}).catch(e => {
    console.error('Error:', e);
    process.exit(1);
});

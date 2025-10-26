(async () => {
  try {
    const db = require('./models');
    const { Role, Permission, User, DuAn, Group, GroupMember } = db;
    const counts = {};
    counts.Roles = await Role.count();
    counts.Permissions = await Permission.count();
    counts.Users = await User.count();
    counts.DuAns = await DuAn.count();
    counts.Groups = await Group.count();
    counts.GroupMembers = await GroupMember.count();

    console.log('Row counts:', counts);

    const groups = await Group.findAll({ limit: 50, attributes: ['id','name','duanId','leaderId'] });
    console.log('Groups sample:', groups.map(g => g.get({ plain: true })));

    const users = await User.findAll({ limit: 20, attributes: ['id','manv','hoten'] });
    console.log('Users sample:', users.map(u => u.get({ plain: true })));

    await db.sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('inspect-db error:', err);
    process.exit(1);
  }
})();

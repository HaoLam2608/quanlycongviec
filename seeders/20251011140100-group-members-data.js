'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Resolve group IDs and user IDs dynamically to avoid hard-coded IDs
    const groups = await queryInterface.sequelize.query(
      "SELECT id, name FROM Groups",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const users = await queryInterface.sequelize.query(
      "SELECT id, manv, hoten FROM Users",
      { type: Sequelize.QueryTypes.SELECT }
    );

    function gid(name) { const g = groups.find(x => x.name === name); return g ? g.id : null; }
    function uidByManv(manv) { const u = users.find(x => x.manv === manv); return u ? u.id : null; }
    function uidByHoten(hoten) { const u = users.find(x => x.hoten === hoten); return u ? u.id : null; }

    const members = [
      // Frontend Development Team
      { groupId: gid('Frontend Development Team'), userId: uidByManv('DEV001'), roleInGroup: 'Leader' },
      { groupId: gid('Frontend Development Team'), userId: uidByManv('DEV002'), roleInGroup: 'Member' },
      { groupId: gid('Frontend Development Team'), userId: uidByManv('DEV003'), roleInGroup: 'Member' },

      // Backend Development Team
      { groupId: gid('Backend Development Team'), userId: uidByManv('QLY001'), roleInGroup: 'Leader' },
      { groupId: gid('Backend Development Team'), userId: uidByManv('DEV001'), roleInGroup: 'Member' },
      { groupId: gid('Backend Development Team'), userId: uidByManv('DEV002'), roleInGroup: 'Member' },

      // UI/UX Design Team
      { groupId: gid('UI/UX Design Team'), userId: uidByManv('DES001'), roleInGroup: 'Leader' },
      { groupId: gid('UI/UX Design Team'), userId: uidByManv('DEV001'), roleInGroup: 'Member' },

      // DevOps & Infrastructure
      { groupId: gid('DevOps & Infrastructure'), userId: uidByManv('DEV003'), roleInGroup: 'Leader' },
      { groupId: gid('DevOps & Infrastructure'), userId: uidByManv('SUP001'), roleInGroup: 'Member' },

      // Quality Assurance Team
      { groupId: gid('Quality Assurance Team'), userId: uidByManv('QA001'), roleInGroup: 'Leader' },
      { groupId: gid('Quality Assurance Team'), userId: uidByManv('BA001'), roleInGroup: 'Member' },

      // Product Management
      { groupId: gid('Product Management'), userId: uidByManv('BA001'), roleInGroup: 'Leader' },
      { groupId: gid('Product Management'), userId: uidByManv('QLY002'), roleInGroup: 'Member' },
      { groupId: gid('Product Management'), userId: uidByManv('QLY001'), roleInGroup: 'Member' }
    ];

    // Add timestamps and filter invalid entries
    const toInsert = members
      .filter(m => m.groupId && m.userId)
      .map(m => ({ ...m, createdAt: new Date(), updatedAt: new Date() }));

    if (toInsert.length === 0) {
      console.warn('No group members to insert: make sure Groups and Users are seeded first.');
      return;
    }

    await queryInterface.bulkInsert('GroupMembers', toInsert);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('GroupMembers', null, {});
  }
};
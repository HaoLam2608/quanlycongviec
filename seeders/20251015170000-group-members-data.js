const { QueryTypes } = require('sequelize');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Lấy groups với leaderId để đảm bảo leaders là members
        const groups = await queryInterface.sequelize.query(
            "SELECT id, name, leaderId FROM `Groups`",
            { type: QueryTypes.SELECT }
        );
        const users = await queryInterface.sequelize.query(
            "SELECT id, manv, hoten FROM `Users`",
            { type: QueryTypes.SELECT }
        );
        
        function gid(name) { 
            const g = groups.find(x => x.name === name); 
            return g ? g.id : null; 
        }
        
        function getGroupLeaderId(name) {
            const g = groups.find(x => x.name === name);
            return g ? g.leaderId : null;
        }
        
        function uidByManv(manv) { 
            const u = users.find(x => x.manv === manv); 
            return u ? u.id : null; 
        }
        
        const members = [];
        
        // Frontend Development Team - leaderId từ Groups là QLY002
        const frontendLeaderId = getGroupLeaderId('Frontend Development Team');
        if (frontendLeaderId) {
            members.push({ groupId: gid('Frontend Development Team'), userId: frontendLeaderId, roleInGroup: 'Leader' });
        }
        members.push(
            { groupId: gid('Frontend Development Team'), userId: uidByManv('DEV001'), roleInGroup: 'Member' },
            { groupId: gid('Frontend Development Team'), userId: uidByManv('DEV002'), roleInGroup: 'Member' },
            { groupId: gid('Frontend Development Team'), userId: uidByManv('DEV003'), roleInGroup: 'Member' }
        );
        
        // Backend Development Team - leaderId từ Groups là QLY001
        const backendLeaderId = getGroupLeaderId('Backend Development Team');
        if (backendLeaderId) {
            members.push({ groupId: gid('Backend Development Team'), userId: backendLeaderId, roleInGroup: 'Leader' });
        }
        members.push(
            { groupId: gid('Backend Development Team'), userId: uidByManv('DEV001'), roleInGroup: 'Member' },
            { groupId: gid('Backend Development Team'), userId: uidByManv('DEV002'), roleInGroup: 'Member' }
        );
        
        // UI/UX Design Team - leaderId từ Groups là DES001
        const uiuxLeaderId = getGroupLeaderId('UI/UX Design Team');
        if (uiuxLeaderId) {
            members.push({ groupId: gid('UI/UX Design Team'), userId: uiuxLeaderId, roleInGroup: 'Leader' });
        }
        members.push(
            { groupId: gid('UI/UX Design Team'), userId: uidByManv('DEV001'), roleInGroup: 'Member' }
        );
        
        // DevOps & Infrastructure - leaderId từ Groups là DEV003
        const devopsLeaderId = getGroupLeaderId('DevOps & Infrastructure');
        if (devopsLeaderId) {
            members.push({ groupId: gid('DevOps & Infrastructure'), userId: devopsLeaderId, roleInGroup: 'Leader' });
        }
        members.push(
            { groupId: gid('DevOps & Infrastructure'), userId: uidByManv('SUP001'), roleInGroup: 'Member' }
        );
        
        // Quality Assurance Team - leaderId từ Groups là QA001
        const qaLeaderId = getGroupLeaderId('Quality Assurance Team');
        if (qaLeaderId) {
            members.push({ groupId: gid('Quality Assurance Team'), userId: qaLeaderId, roleInGroup: 'Leader' });
        }
        members.push(
            { groupId: gid('Quality Assurance Team'), userId: uidByManv('BA001'), roleInGroup: 'Member' }
        );
        
        // Product Management - leaderId từ Groups là BA001
        const pmLeaderId = getGroupLeaderId('Product Management');
        if (pmLeaderId) {
            members.push({ groupId: gid('Product Management'), userId: pmLeaderId, roleInGroup: 'Leader' });
        }
        members.push(
            { groupId: gid('Product Management'), userId: uidByManv('QLY002'), roleInGroup: 'Member' },
            { groupId: gid('Product Management'), userId: uidByManv('QLY001'), roleInGroup: 'Member' }
        );
        
        // Lọc và loại bỏ duplicate (nếu leaderId trùng với member)
        const uniqueMembers = [];
        const seen = new Set();
        for (const m of members) {
            if (!m.groupId || !m.userId) continue;
            const key = `${m.groupId}-${m.userId}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueMembers.push(m);
            }
        }
        
        const toInsert = uniqueMembers.map(m => ({ 
            ...m, 
            joinedAt: new Date(),
            createdAt: new Date(), 
            updatedAt: new Date() 
        }));
        
        if (toInsert.length === 0) return;
        await queryInterface.bulkInsert('GroupMembers', toInsert);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('GroupMembers', null, {});
    }
};

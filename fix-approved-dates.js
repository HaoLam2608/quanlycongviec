const { Subtask } = require('./models');
const { Op } = require('sequelize');

(async () => {
    try {
        const result = await Subtask.update(
            { approvedAt: new Date() },
            {
                where: {
                    approvedBy: { [Op.not]: null },
                    approvedAt: null
                }
            }
        );
        console.log('Updated subtasks:', result[0]);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();

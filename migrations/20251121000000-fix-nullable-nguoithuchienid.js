'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Xóa các foreign key constraints cũ (nếu có)
            const constraints = [
                'subtasks_ibfk_2', 'subtasks_ibfk_3', 'subtasks_ibfk_4',
                'subtasks_ibfk_5', 'subtasks_ibfk_6', 'subtasks_ibfk_7',
                'subtasks_ibfk_8', 'subtasks_ibfk_9', 'subtasks_ibfk_10',
                'subtasks_ibfk_11', 'subtasks_ibfk_12', 'subtasks_ibfk_13',
                'subtasks_ibfk_14', 'subtasks_ibfk_15'
            ];

            for (const constraint of constraints) {
                try {
                    await queryInterface.sequelize.query(
                        `ALTER TABLE Subtasks DROP FOREIGN KEY ${constraint}`,
                        { transaction }
                    );
                } catch (err) {
                    // Ignore error if constraint doesn't exist
                    console.log(`Constraint ${constraint} does not exist or already dropped`);
                }
            }

            // Thay đổi cột nguoiThucHienId cho phép NULL
            await queryInterface.changeColumn('Subtasks', 'nguoiThucHienId', {
                type: Sequelize.INTEGER,
                allowNull: true,
                comment: 'ID người thực hiện subtask'
            }, { transaction });

            // Kiểm tra xem constraint đã tồn tại chưa
            const [results] = await queryInterface.sequelize.query(
                `SELECT CONSTRAINT_NAME 
                 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME = 'Subtasks' 
                 AND CONSTRAINT_NAME = 'fk_subtasks_nguoiThucHienId'`,
                { transaction }
            );

            // Chỉ thêm constraint nếu chưa tồn tại
            if (results.length === 0) {
                await queryInterface.addConstraint('Subtasks', {
                    fields: ['nguoiThucHienId'],
                    type: 'foreign key',
                    name: 'fk_subtasks_nguoiThucHienId',
                    references: {
                        table: 'Users',
                        field: 'id'
                    },
                    onDelete: 'SET NULL',
                    onUpdate: 'CASCADE',
                    transaction
                });
                console.log('✅ Added new foreign key constraint');
            } else {
                console.log('✅ Foreign key constraint already exists');
            }

            await transaction.commit();
            console.log('✅ Migration completed: nguoiThucHienId now allows NULL');
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Migration failed:', error);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Xóa constraint mới
            await queryInterface.removeConstraint('Subtasks', 'fk_subtasks_nguoiThucHienId', { transaction });

            // Đổi lại cột về NOT NULL (chú ý: phải có dữ liệu hợp lệ trước)
            await queryInterface.changeColumn('Subtasks', 'nguoiThucHienId', {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'ID người thực hiện subtask'
            }, { transaction });

            // Thêm lại foreign key cũ
            await queryInterface.addConstraint('Subtasks', {
                fields: ['nguoiThucHienId'],
                type: 'foreign key',
                name: 'subtasks_ibfk_2',
                references: {
                    table: 'Users',
                    field: 'id'
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
                transaction
            });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('UserNotifications', 'processed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates if this notification has been processed (approved/declined)'
    });

    await queryInterface.addColumn('UserNotifications', 'processedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp when the notification was processed'
    });

    await queryInterface.addColumn('UserNotifications', 'processedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'User ID who processed this notification',
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('UserNotifications', 'processedBy');
    await queryInterface.removeColumn('UserNotifications', 'processedAt');
    await queryInterface.removeColumn('UserNotifications', 'processed');
  }
};

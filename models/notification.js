'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Notification extends Model {
        static associate(models) {
            // Notification belongs to User (author)
            Notification.belongsTo(models.User, {
                foreignKey: 'authorId',
                as: 'author'
            });
            // per-user links
            if (models.UserNotification) {
                Notification.hasMany(models.UserNotification, {
                    foreignKey: 'notificationId',
                    as: 'UserNotifications'
                });
            }
        }

        // Instance method to get target audience as array
        getTargetAudienceArray() {
            return this.targetAudience ? this.targetAudience.split(',') : [];
        }

        // Instance method to check if notification is for specific role
        isForRole(role) {
            const audiences = this.getTargetAudienceArray();
            return audiences.includes('all') || audiences.includes(role);
        }
    }

    Notification.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Tiêu đề không được để trống'
                },
                len: {
                    args: [1, 255],
                    msg: 'Tiêu đề phải từ 1-255 ký tự'
                }
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Nội dung không được để trống'
                }
            }
        },
        type: {
            type: DataTypes.ENUM('system', 'project', 'task', 'announcement', 'deadline_reminder'),
            allowNull: false,
            defaultValue: 'announcement',
            validate: {
                isIn: {
                    args: [['system', 'project', 'task', 'announcement', 'deadline_reminder']],
                    msg: 'Loại thông báo không hợp lệ'
                }
            }
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            allowNull: false,
            defaultValue: 'medium',
            validate: {
                isIn: {
                    args: [['low', 'medium', 'high', 'urgent']],
                    msg: 'Độ ưu tiên không hợp lệ'
                }
            }
        },
        status: {
            type: DataTypes.ENUM('draft', 'published'),
            allowNull: false,
            defaultValue: 'draft',
            validate: {
                isIn: {
                    args: [['draft', 'published']],
                    msg: 'Trạng thái không hợp lệ'
                }
            }
        },
        targetAudience: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Đối tượng mục tiêu không được để trống'
                },
                isValidAudience(value) {
                    const validAudiences = ['all', 'admin', 'manager', 'member', 'direct'];
                    const audiences = value.split(',');
                    for (const audience of audiences) {
                        if (!validAudiences.includes(audience.trim())) {
                            throw new Error('Đối tượng mục tiêu không hợp lệ');
                        }
                    }
                }
            }
        },
        authorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        publishedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        timestamps: true,
        hooks: {
            beforeUpdate: (notification, options) => {
                // Set publishedAt when status changes to published
                if (notification.changed('status') && notification.status === 'published' && !notification.publishedAt) {
                    notification.publishedAt = new Date();
                }
                // Clear publishedAt when status changes to draft
                if (notification.changed('status') && notification.status === 'draft') {
                    notification.publishedAt = null;
                }
            }
        }
    });

    return Notification;
};
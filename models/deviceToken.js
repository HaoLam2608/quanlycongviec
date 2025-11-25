module.exports = (sequelize, DataTypes) => {
    const DeviceToken = sequelize.define('DeviceToken', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        expoPushToken: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        deviceId: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        platform: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'ios, android, web'
        },
        deviceModel: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        lastActive: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'devicetokens',
        timestamps: true
    });

    DeviceToken.associate = (models) => {
        DeviceToken.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return DeviceToken;
};

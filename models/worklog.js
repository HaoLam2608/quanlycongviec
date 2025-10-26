const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Worklog extends Model {
        static associate(models) {
            Worklog.belongsTo(models.User, { foreignKey: "userId" });
            Worklog.belongsTo(models.Task, { foreignKey: "taskId" });
            Worklog.belongsTo(models.Subtask, { foreignKey: "subtaskId" });
        }
    }
    Worklog.init(
        {
            userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
            taskId: { type: DataTypes.INTEGER, allowNull: true, field: 'task_id' },
            subtaskId: { type: DataTypes.INTEGER, allowNull: true, field: 'subtask_id' },
            hours: { type: DataTypes.FLOAT, allowNull: false, field: 'hours_spent' },
            note: { type: DataTypes.TEXT, allowNull: true, field: 'description' },
            date: { type: DataTypes.DATEONLY, allowNull: false, field: 'work_date' },
            createdAt: { type: DataTypes.DATE, allowNull: true, field: 'created_at' },
            updatedAt: { type: DataTypes.DATE, allowNull: true, field: 'updated_at' },
        },
        {
            sequelize,
            modelName: "Worklog",
        }
    );
    return Worklog;
};

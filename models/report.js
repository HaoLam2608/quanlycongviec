'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Report extends Model {
        static associate(models) {
            // Báo cáo thuộc về một dự án
            Report.belongsTo(models.DuAn, {
                foreignKey: 'duanId',
                as: 'duan'
            });
            // Báo cáo được tạo bởi một user
            Report.belongsTo(models.User, {
                foreignKey: 'createdBy',
                as: 'creator'
            });
            // Người xem xét báo cáo
            Report.belongsTo(models.User, {
                foreignKey: 'reviewedBy',
                as: 'reviewer'
            });
            // Báo cáo có thể thuộc về một nhóm (optional)
            Report.belongsTo(models.Group, {
                foreignKey: 'groupId',
                as: 'group'
            });
        }
    }

    Report.init({
        duanId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'ID dự án'
        },
        groupId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID nhóm (nếu báo cáo theo nhóm)'
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Tiêu đề báo cáo'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Nội dung báo cáo'
        },
        reportType: {
            type: DataTypes.ENUM('tien_do', 'van_de', 'hoan_thanh', 'tong_ket', 'khac'),
            allowNull: false,
            defaultValue: 'tien_do',
            comment: 'Loại báo cáo: tiến độ, vấn đề, hoàn thành, tổng kết, khác'
        },
        status: {
            type: DataTypes.ENUM('draft', 'submitted', 'reviewed', 'approved'),
            allowNull: false,
            defaultValue: 'draft',
            comment: 'Trạng thái: nháp, đã gửi, đã xem, đã duyệt'
        },
        reportDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: 'Ngày báo cáo'
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'Người tạo báo cáo'
        },
        attachments: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            comment: 'Danh sách file đính kèm (JSON)',
            get() {
                const value = this.getDataValue('attachments');
                if (!value) return [];
                if (typeof value === 'string') {
                    try {
                        return JSON.parse(value);
                    } catch {
                        return [];
                    }
                }
                return Array.isArray(value) ? value : [];
            }
        },
        statistics: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Thống kê số liệu (JSON): tasks completed, hours worked, etc.'
        },
        reviewedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Người xem xét báo cáo'
        },
        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Thời gian xem xét'
        },
        reviewNote: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Ghi chú từ người xem xét'
        }
    }, {
        sequelize,
        modelName: 'Report',
        tableName: 'Reports',
        timestamps: true
    });

    return Report;
};

const { User, Role, Permission } = require('../models');

// Middleware kiểm tra RBAC

const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Không được phép' });
            }

            const user = await User.findByPk(userId, {
                include: [{
                    model: Role,
                    as: 'role',
                    include: [
                        {
                            model: Permission,
                            as: 'permissions'
                        }
                    ]
                }]
            });

            if (!user) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng' });
            }

            // Kiểm tra permission
            const permissionName = `${resource}-${action}`;
            const hasPermission = user.role?.permissions?.some(permission =>
                permission.name === permissionName
            );

            if (!hasPermission) {
                return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này' });
            }

            req.user = user;
            next();
        }
        catch (error) {
            console.error('RBAC Middleware Error:', error);
            return res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    }
}
// Middleware kiểm tra role
const checkRole = (roleName) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Không được phép' });
            }

            const user = await User.findByPk(userId, {
                include: [{
                    model: Role,
                    as: 'role'
                }]
            });

            if (!user) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng' });
            }

            if (!user.role || user.role.name !== roleName) {
                return res.status(403).json({ message: `Không có quyền truy cập. Cần vai trò: ${roleName}` });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('RBAC Middleware Error:', error);
            return res.status(500).json({ message: 'Lỗi hệ thống' });
        }
    }
}
module.exports = { checkPermission, checkRole };
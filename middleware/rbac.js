const { User, Role, Permission } = require('../models');

// Middleware kiểm tra RBAC

const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
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
                return res.status(404).json({ message: 'User not found' });
            }

            // Kiểm tra permission
            const permissionName = `${resource}-${action}`;
            const hasPermission = user.role?.permissions?.some(permission =>
                permission.name === permissionName
            );

            if (!hasPermission) {
                return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
            }

            req.user = user;
            next();
        }
        catch (error) {
            console.error('RBAC Middleware Error:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}
// Middleware kiểm tra role
const checkRole = (roleName) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            const user = await User.findByPk(userId, {
                include: [{
                    model: Role,
                    as: 'role'
                }]
            });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (!user.role || user.role.name !== roleName) {
                return res.status(403).json({ message: `Access denied. Required role: ${roleName}` });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('RBAC Middleware Error:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}
module.exports = { checkPermission, checkRole };
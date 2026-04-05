/**
 * Authorization Middleware
 * Checks if a user has permission to perform an action
 * Uses role-based access control (RBAC)
 */

const db = require('../config/database');

/**
 * Middleware factory to check if user has required permission
 * @param {string} requiredPermission - The permission name to check
 * @returns {Function} Express middleware
 */
function requirePermission(requiredPermission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User information not found'
      });
    }

    const { roleId } = req.user;

    // Query to check if role has permission
    const query = `
      SELECT rp.permission_id
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ? AND p.name = ?
    `;

    db.get(query, [roleId, requiredPermission], (err, row) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: err.message
        });
      }

      if (!row) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `You do not have permission to ${requiredPermission}`
        });
      }

      next();
    });
  };
}

module.exports = { requirePermission };

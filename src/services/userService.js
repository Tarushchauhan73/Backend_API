/**
 * User Service
 * Handles all user-related business logic
 */

const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

/**
 * Create a new user
 */
function createUser(userData) {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(userData.password, 10);

    const query = `
      INSERT INTO users (id, username, email, password_hash, role_id, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `;

    db.run(query, [id, userData.username, userData.email, hashedPassword, userData.role_id], function(err) {
      if (err) {
        // Handle unique constraint violations
        if (err.message.includes('UNIQUE')) {
          reject({
            status: 409,
            message: 'Username or email already exists'
          });
        } else {
          reject({
            status: 500,
            message: err.message
          });
        }
      } else {
        resolve({ id, username: userData.username, email: userData.email, role_id: userData.role_id });
      }
    });
  });
}

/**
 * Get user by ID
 */
function getUserById(userId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id, username, email, role_id, status, created_at FROM users WHERE id = ?';
    
    db.get(query, [userId], (err, row) => {
      if (err) {
        reject({
          status: 500,
          message: err.message
        });
      } else if (!row) {
        reject({
          status: 404,
          message: 'User not found'
        });
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Get all users (admin only)
 */
function getAllUsers(limit = 50, offset = 0) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, username, email, role_id, status, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    db.all(query, [limit, offset], (err, rows) => {
      if (err) {
        reject({
          status: 500,
          message: err.message
        });
      } else {
        resolve(rows || []);
      }
    });
  });
}

/**
 * Update user information
 */
function updateUser(userId, updateData) {
  return new Promise((resolve, reject) => {
    const allowedFields = ['email', 'status', 'role_id'];
    const updates = [];
    const values = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      reject({
        status: 400,
        message: 'No valid fields to update'
      });
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
      if (err) {
        reject({
          status: 500,
          message: err.message
        });
      } else if (this.changes === 0) {
        reject({
          status: 404,
          message: 'User not found'
        });
      } else {
        resolve({ message: 'User updated successfully' });
      }
    });
  });
}

/**
 * Get user's role and permissions
 */
function getUserRoleAndPermissions(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        u.id, 
        u.username, 
        r.id as role_id, 
        r.name as role_name,
        json_group_array(json_object('id', p.id, 'name', p.name, 'resource', p.resource, 'action', p.action)) as permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ?
      GROUP BY u.id, r.id
    `;

    db.get(query, [userId], (err, row) => {
      if (err) {
        reject({
          status: 500,
          message: err.message
        });
      } else if (!row) {
        reject({
          status: 404,
          message: 'User not found'
        });
      } else {
        row.permissions = JSON.parse(row.permissions || '[]');
        resolve(row);
      }
    });
  });
}

module.exports = {
  createUser,
  getUserById,
  getAllUsers,
  updateUser,
  getUserRoleAndPermissions
};

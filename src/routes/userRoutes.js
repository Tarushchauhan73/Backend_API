/**
 * User Routes
 * Endpoints for user management
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requirePermission } = require('../middleware/authorization');

/**
 * POST /users - Create a new user
 * Required permission: Manage Users
 */
router.post('/', requirePermission('Manage Users'), userController.createUser);

/**
 * GET /users - List all users with pagination
 * Required permission: Manage Users
 */
router.get('/', requirePermission('Manage Users'), userController.listUsers);

/**
 * GET /users/:userId - Get user details
 */
router.get('/:userId', userController.getUser);

/**
 * GET /users/:userId/role-permissions - Get user's role and permissions
 */
router.get('/:userId/role-permissions', userController.getUserRoleAndPermissions);

/**
 * PUT /users/:userId - Update user information
 * Required permission: Manage Users
 */
router.put('/:userId', requirePermission('Manage Users'), userController.updateUser);

module.exports = router;

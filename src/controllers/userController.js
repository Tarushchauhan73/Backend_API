/**
 * User Controller
 * Handles user-related HTTP requests
 */

const userService = require('../services/userService');
const { validateUser, validateEmail } = require('../middleware/validation');

/**
 * POST /users - Create a new user (admin only)
 */
async function createUser(req, res) {
  try {
    const { username, email, password, role_id } = req.body;

    // Validate input
    const validation = validateUser(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const newUser = await userService.createUser({
      username,
      email,
      password,
      role_id
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'User creation failed',
      message: error.message
    });
  }
}

/**
 * GET /users/:userId - Get user details
 */
async function getUser(req, res) {
  try {
    const { userId } = req.params;

    const user = await userService.getUserById(userId);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message
    });
  }
}

/**
 * GET /users - List all users (admin only)
 */
async function listUsers(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = parseInt(req.query.offset) || 0;

    const users = await userService.getAllUsers(limit, offset);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        limit,
        offset,
        count: users.length
      }
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Failed to list users',
      message: error.message
    });
  }
}

/**
 * PUT /users/:userId - Update user information (admin only or self)
 */
async function updateUser(req, res) {
  try {
    const { userId } = req.params;
    const { email, status, role_id } = req.body;

    // Basic validation for email if provided
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['Invalid email format']
      });
    }

    const result = await userService.updateUser(userId, {
      email,
      status,
      role_id
    });

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'User update failed',
      message: error.message
    });
  }
}

/**
 * GET /users/:userId/role-permissions - Get user's role and permissions
 */
async function getUserRoleAndPermissions(req, res) {
  try {
    const { userId } = req.params;

    const userRoleInfo = await userService.getUserRoleAndPermissions(userId);

    res.status(200).json({
      success: true,
      data: userRoleInfo
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Failed to fetch user role information',
      message: error.message
    });
  }
}

module.exports = {
  createUser,
  getUser,
  listUsers,
  updateUser,
  getUserRoleAndPermissions
};

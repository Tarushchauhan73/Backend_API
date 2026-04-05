/**
 * Authentication Middleware
 * Extracts and validates user information from request headers
 * Uses a simple header-based auth for simplicity (in production, use JWT)
 */

function authMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'];
  const roleId = req.headers['x-role-id'];

  if (!userId || !roleId) {
    return res.status(401).json({
      success: false,
      error: 'Missing authentication headers',
      message: 'Please provide x-user-id and x-role-id headers'
    });
  }

  // Store in request for downstream handlers
  req.user = {
    id: userId,
    roleId: roleId
  };

  next();
}

module.exports = authMiddleware;

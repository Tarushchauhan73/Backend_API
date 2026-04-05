/**
 * Input Validation Middleware and Utilities
 * Provides validation functions for API inputs
 */

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateFinancialRecord(body) {
  const errors = [];

  if (!body.amount || isNaN(body.amount) || parseFloat(body.amount) <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (!body.type || !['income', 'expense'].includes(body.type)) {
    errors.push('Type must be either "income" or "expense"');
  }

  if (!body.category || typeof body.category !== 'string' || body.category.trim() === '') {
    errors.push('Category is required and must be a non-empty string');
  }

  if (!body.record_date || isNaN(Date.parse(body.record_date))) {
    errors.push('Record date must be a valid date');
  }

  if (body.description && typeof body.description !== 'string') {
    errors.push('Description must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateUser(body) {
  const errors = [];

  if (!body.username || typeof body.username !== 'string' || body.username.trim().length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  if (!body.email || !validateEmail(body.email)) {
    errors.push('Email must be a valid email address');
  }

  if (!body.password || body.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!body.role_id || typeof body.role_id !== 'string') {
    errors.push('Role ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Express middleware for JSON body parsing with error handling
 */
function validationErrorMiddleware(req, res, next) {
  // This is called when request body is invalid JSON
  res.status(400).json({
    success: false,
    error: 'Invalid request body',
    message: 'Request body must be valid JSON'
  });
}

module.exports = {
  validateEmail,
  validateFinancialRecord,
  validateUser,
  validationErrorMiddleware
};

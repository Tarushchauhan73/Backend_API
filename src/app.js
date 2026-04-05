/**
 * Express Application Configuration
 * Initializes middleware, routes, and error handling
 */

const express = require('express');
const authMiddleware = require('./middleware/auth');
const userRoutes = require('./routes/userRoutes');
const recordRoutes = require('./routes/recordRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Public routes (no authentication required)
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Finance Dashboard Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
      records: '/api/records',
      dashboard: '/api/dashboard'
    }
  });
});

// Apply authentication middleware to all API routes
app.use('/api', authMiddleware);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `The requested endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: {
      health: 'GET /health',
      api: 'GET /api',
      users: 'GET /api/users, POST /api/users, GET /api/users/:userId, PUT /api/users/:userId',
      records: 'GET /api/records, POST /api/records, GET /api/records/:recordId, PUT /api/records/:recordId, DELETE /api/records/:recordId',
      dashboard: 'GET /api/dashboard/summary, /categories, /recent, /trends, /statistics'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      message: 'Request body must be valid JSON'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;

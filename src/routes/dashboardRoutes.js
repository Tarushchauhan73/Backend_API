/**
 * Dashboard Routes
 * Endpoints for dashboard summaries and analytics
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requirePermission } = require('../middleware/authorization');

/**
 * GET /dashboard/summary - Get user's financial summary
 * Required permission: View Dashboard
 */
router.get('/summary', requirePermission('View Dashboard'), dashboardController.getDashboardSummary);

/**
 * GET /dashboard/categories - Get category-wise breakdown
 * Required permission: View Dashboard
 */
router.get('/categories', requirePermission('View Dashboard'), dashboardController.getCategoryBreakdown);

/**
 * GET /dashboard/recent - Get recent transactions
 * Required permission: View Dashboard
 */
router.get('/recent', requirePermission('View Dashboard'), dashboardController.getRecentTransactions);

/**
 * GET /dashboard/trends - Get monthly trends
 * Required permission: View Dashboard
 */
router.get('/trends', requirePermission('View Dashboard'), dashboardController.getMonthlyTrends);

/**
 * GET /dashboard/statistics - Get system statistics (admin only)
 * Required permission: Manage Users (admin)
 */
router.get('/statistics', requirePermission('Manage Users'), dashboardController.getSystemStatistics);

module.exports = router;

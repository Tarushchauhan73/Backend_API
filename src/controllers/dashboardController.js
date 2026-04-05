/**
 * Dashboard Controller
 * Handles dashboard summary requests
 */

const dashboardService = require('../services/dashboardService');

/**
 * GET /dashboard/summary - Get user's dashboard summary
 */
async function getDashboardSummary(req, res) {
  try {
    const userId = req.user.id;

    const summary = await dashboardService.getUserDashboardSummary(userId);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Failed to fetch dashboard summary',
      message: error.message
    });
  }
}

/**
 * GET /dashboard/categories - Get category-wise breakdown
 */
async function getCategoryBreakdown(req, res) {
  try {
    const userId = req.user.id;

    const breakdown = await dashboardService.getCategoryBreakdown(userId);

    res.status(200).json({
      success: true,
      data: breakdown
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Failed to fetch category breakdown',
      message: error.message
    });
  }
}

/**
 * GET /dashboard/recent - Get recent transactions
 */
async function getRecentTransactions(req, res) {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const transactions = await dashboardService.getRecentTransactions(userId, limit);

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Failed to fetch recent transactions',
      message: error.message
    });
  }
}

/**
 * GET /dashboard/trends - Get monthly trends
 */
async function getMonthlyTrends(req, res) {
  try {
    const userId = req.user.id;
    const months = Math.min(parseInt(req.query.months) || 6, 24);

    const trends = await dashboardService.getMonthlyTrends(userId, months);

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Failed to fetch monthly trends',
      message: error.message
    });
  }
}

/**
 * GET /dashboard/statistics - Get system-wide statistics (admin only)
 */
async function getSystemStatistics(req, res) {
  try {
    const statistics = await dashboardService.getSystemStatistics();

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Failed to fetch system statistics',
      message: error.message
    });
  }
}

module.exports = {
  getDashboardSummary,
  getCategoryBreakdown,
  getRecentTransactions,
  getMonthlyTrends,
  getSystemStatistics
};

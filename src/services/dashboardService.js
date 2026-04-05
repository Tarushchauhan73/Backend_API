/**
 * Dashboard Service
 * Generates summary analytics and insights for the dashboard
 */

const db = require('../config/database');

/**
 * Get dashboard summary for a user
 * Returns total income, expenses, net balance, and category breakdown
 */
function getUserDashboardSummary(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_balance,
        COUNT(*) as total_records
      FROM financial_records
      WHERE user_id = ? AND is_deleted = 0
    `;

    db.get(query, [userId], (err, summary) => {
      if (err) {
        reject({
          status: 500,
          message: err.message
        });
      } else {
        // Ensure numbers are properly formatted
        const result = {
          total_income: summary.total_income || 0,
          total_expenses: summary.total_expenses || 0,
          net_balance: summary.net_balance || 0,
          total_records: summary.total_records || 0
        };
        resolve(result);
      }
    });
  });
}

/**
 * Get category-wise breakdown for a user
 */
function getCategoryBreakdown(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        category,
        type,
        COUNT(*) as count,
        SUM(amount) as total
      FROM financial_records
      WHERE user_id = ? AND is_deleted = 0
      GROUP BY category, type
      ORDER BY total DESC
    `;

    db.all(query, [userId], (err, rows) => {
      if (err) {
        reject({
          status: 500,
          message: err.message
        });
      } else {
        // Format response
        const breakdown = {
          by_category: rows || []
        };
        resolve(breakdown);
      }
    });
  });
}

/**
 * Get recent transactions
 */
function getRecentTransactions(userId, limit = 10) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT *
      FROM financial_records
      WHERE user_id = ? AND is_deleted = 0
      ORDER BY record_date DESC, created_at DESC
      LIMIT ?
    `;

    db.all(query, [userId, limit], (err, rows) => {
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
 * Get monthly trends (last N months)
 */
function getMonthlyTrends(userId, months = 6) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        strftime('%Y-%m', record_date) as month,
        type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM financial_records
      WHERE user_id = ? AND is_deleted = 0
      AND record_date >= date('now', '-' || ? || ' months')
      GROUP BY month, type
      ORDER BY month DESC
    `;

    db.all(query, [userId, months], (err, rows) => {
      if (err) {
        reject({
          status: 500,
          message: err.message
        });
      } else {
        // Process into a more useful format
        const trends = {};
        (rows || []).forEach(row => {
          if (!trends[row.month]) {
            trends[row.month] = { month: row.month, income: 0, expenses: 0 };
          }
          if (row.type === 'income') {
            trends[row.month].income = row.total;
          } else {
            trends[row.month].expenses = row.total;
          }
        });

        resolve(Object.values(trends).reverse());
      }
    });
  });
}

/**
 * Get overall system statistics (admin view)
 */
function getSystemStatistics() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM financial_records WHERE is_deleted = 0) as total_records,
        (SELECT SUM(amount) FROM financial_records WHERE type = 'income' AND is_deleted = 0) as total_income,
        (SELECT SUM(amount) FROM financial_records WHERE type = 'expense' AND is_deleted = 0) as total_expenses
    `;

    db.get(query, [], (err, stats) => {
      if (err) {
        reject({
          status: 500,
          message: err.message
        });
      } else {
        resolve({
          active_users: stats.active_users || 0,
          total_users: stats.total_users || 0,
          total_records: stats.total_records || 0,
          total_income: stats.total_income || 0,
          total_expenses: stats.total_expenses || 0
        });
      }
    });
  });
}

module.exports = {
  getUserDashboardSummary,
  getCategoryBreakdown,
  getRecentTransactions,
  getMonthlyTrends,
  getSystemStatistics
};

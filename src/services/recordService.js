/**
 * Financial Records Service
 * Handles all financial record operations
 */

const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new financial record
 */
function createRecord(userId, recordData) {
  return new Promise((resolve, reject) => {
    const id = uuidv4();

    const query = `
      INSERT INTO financial_records 
      (id, user_id, amount, type, category, description, record_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      query,
      [id, userId, recordData.amount, recordData.type, recordData.category, recordData.description, recordData.record_date],
      function(err) {
        if (err) {
          reject({
            status: 500,
            message: err.message
          });
        } else {
          resolve({
            id,
            user_id: userId,
            ...recordData,
            created_at: new Date().toISOString()
          });
        }
      }
    );
  });
}

/**
 * Get record by ID
 */
function getRecordById(recordId, userId = null) {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT * FROM financial_records 
      WHERE id = ? AND is_deleted = 0
    `;
    const params = [recordId];

    // If userId provided, ensure user owns the record
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    db.get(query, params, (err, row) => {
      if (err) {
        reject({
          status: 500,
          message: err.message
        });
      } else if (!row) {
        reject({
          status: 404,
          message: 'Financial record not found'
        });
      } else {
        resolve(row);
      }
    });
  });
}

/**
 * Get all records for a user with optional filtering
 */
function getRecordsByUser(userId, filters = {}, limit = 100, offset = 0) {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT * FROM financial_records 
      WHERE user_id = ? AND is_deleted = 0
    `;
    const params = [userId];

    // Apply filters
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.startDate) {
      query += ' AND record_date >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND record_date <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY record_date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
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
 * Update a financial record
 */
function updateRecord(recordId, userId, updateData) {
  return new Promise((resolve, reject) => {
    const allowedFields = ['amount', 'type', 'category', 'description', 'record_date'];
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
    values.push(recordId, userId);

    const query = `
      UPDATE financial_records 
      SET ${updates.join(', ')} 
      WHERE id = ? AND user_id = ? AND is_deleted = 0
    `;

    db.run(query, values, function(err) {
      if (err) {
        reject({
          status: 500,
          message: err.message
        });
      } else if (this.changes === 0) {
        reject({
          status: 404,
          message: 'Financial record not found or access denied'
        });
      } else {
        resolve({ message: 'Record updated successfully' });
      }
    });
  });
}

/**
 * Soft delete a financial record
 */
function deleteRecord(recordId, userId) {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE financial_records 
      SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ? AND is_deleted = 0
    `;

    db.run(query, [recordId, userId], function(err) {
      if (err) {
        reject({
          status: 500,
          message: err.message
        });
      } else if (this.changes === 0) {
        reject({
          status: 404,
          message: 'Financial record not found or already deleted'
        });
      } else {
        resolve({ message: 'Record deleted successfully' });
      }
    });
  });
}

/**
 * Get all records (admin view)
 */
function getAllRecords(limit = 100, offset = 0) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT fr.*, u.username 
      FROM financial_records fr
      JOIN users u ON fr.user_id = u.id
      WHERE fr.is_deleted = 0
      ORDER BY fr.record_date DESC 
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

module.exports = {
  createRecord,
  getRecordById,
  getRecordsByUser,
  getAllRecords,
  updateRecord,
  deleteRecord
};

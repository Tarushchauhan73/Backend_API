/**
 * Financial Records Controller
 * Handles financial record HTTP requests
 */

const recordService = require('../services/recordService');
const { validateFinancialRecord } = require('../middleware/validation');

/**
 * POST /records - Create a new financial record
 */
async function createRecord(req, res) {
  try {
    const { amount, type, category, description, record_date } = req.body;
    const userId = req.user.id;

    // Validate input
    const validation = validateFinancialRecord(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const newRecord = await recordService.createRecord(userId, {
      amount,
      type,
      category,
      description: description || null,
      record_date
    });

    res.status(201).json({
      success: true,
      message: 'Financial record created successfully',
      data: newRecord
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Record creation failed',
      message: error.message
    });
  }
}

/**
 * GET /records/:recordId - Get a specific financial record
 */
async function getRecord(req, res) {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;

    const record = await recordService.getRecordById(recordId, userId);

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Failed to fetch record',
      message: error.message
    });
  }
}

/**
 * GET /records - Get all financial records for the current user
 */
async function listRecords(req, res) {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;

    // Parse filters from query parameters
    const filters = {};
    if (req.query.type) filters.type = req.query.type;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.startDate) filters.startDate = req.query.startDate;
    if (req.query.endDate) filters.endDate = req.query.endDate;

    const records = await recordService.getRecordsByUser(userId, filters, limit, offset);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        limit,
        offset,
        count: records.length
      }
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Failed to list records',
      message: error.message
    });
  }
}

/**
 * PUT /records/:recordId - Update a financial record
 */
async function updateRecord(req, res) {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;

    // Validate only the fields being updated
    const updateData = {};
    const allowedFields = ['amount', 'type', 'category', 'description', 'record_date'];
    
    allowedFields.forEach(field => {
      if (field in req.body) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: ['No valid fields to update']
      });
    }

    // Validate if amount or type is being updated
    if (updateData.amount && !req.body.type) {
      req.body.type = 'expense'; // Use a placeholder for validation
    }
    if (updateData.type && !updateData.amount) {
      req.body.amount = 1; // Use a placeholder for validation
    }

    const validation = validateFinancialRecord(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const result = await recordService.updateRecord(recordId, userId, updateData);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Record update failed',
      message: error.message
    });
  }
}

/**
 * DELETE /records/:recordId - Delete a financial record (soft delete)
 */
async function deleteRecord(req, res) {
  try {
    const { recordId } = req.params;
    const userId = req.user.id;

    const result = await recordService.deleteRecord(recordId, userId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Record deletion failed',
      message: error.message
    });
  }
}

/**
 * GET /records/admin/all - Get all records (admin only)
 */
async function getAllRecordsAdmin(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;

    const records = await recordService.getAllRecords(limit, offset);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        limit,
        offset,
        count: records.length
      }
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: 'Failed to fetch records',
      message: error.message
    });
  }
}

module.exports = {
  createRecord,
  getRecord,
  listRecords,
  updateRecord,
  deleteRecord,
  getAllRecordsAdmin
};

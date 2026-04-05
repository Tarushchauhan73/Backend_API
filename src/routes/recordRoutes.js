/**
 * Financial Records Routes
 * Endpoints for managing financial records
 */

const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const { requirePermission } = require('../middleware/authorization');

/**
 * POST /records - Create a new financial record
 * Required permission: Create Record
 */
router.post('/', requirePermission('Create Record'), recordController.createRecord);

/**
 * GET /records - List all records for the current user
 * Required permission: Read Record
 */
router.get('/', requirePermission('Read Record'), recordController.listRecords);

/**
 * GET /records/admin/all - Get all records (admin only)
 * Required permission: Manage Users (admin only)
 */
router.get('/admin/all', requirePermission('Manage Users'), recordController.getAllRecordsAdmin);

/**
 * GET /records/:recordId - Get a specific record
 * Required permission: Read Record
 */
router.get('/:recordId', requirePermission('Read Record'), recordController.getRecord);

/**
 * PUT /records/:recordId - Update a financial record
 * Required permission: Update Record
 */
router.put('/:recordId', requirePermission('Update Record'), recordController.updateRecord);

/**
 * DELETE /records/:recordId - Delete a financial record
 * Required permission: Delete Record
 */
router.delete('/:recordId', requirePermission('Delete Record'), recordController.deleteRecord);

module.exports = router;

const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { verifyToken } = require('../middleware/auth');

// ==========================================
// DONOR LIVE TRACKING ROUTES
// ==========================================

// Update donor real-time status: PATCH /api/donors/:donorId/live-status
router.patch('/:donorId/live-status', verifyToken, donorController.updateLiveStatus);

// Get active tracking info for donor: GET /api/donors/:donorId/active-tracking
router.get('/:donorId/active-tracking', verifyToken, donorController.getActiveTracking);

module.exports = router;

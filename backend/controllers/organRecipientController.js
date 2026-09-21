/**
 * Organ Recipient Controller — Phase 4
 * Academic organ donation MVP — recipient registration & management
 */

const mongoose = require('mongoose');
const OrganRecipient = require('../models/OrganRecipient');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Validate a MongoDB ObjectId string; return 400 if invalid.
 */
function validateObjectId(id, label, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: `Invalid ${label} ID format.` });
    return false;
  }
  return true;
}

const ALLOWED_UPDATE_FIELDS = [
  'patientName', 'patientId', 'urgency', 'status',
  'hlaMarkers', 'medicalMetadata'
];

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/organ/recipients
 * Create a new recipient record for the authenticated hospital.
 */
exports.createRecipient = async (req, res) => {
  try {
    const hospitalId = req.user.id;

    const {
      patientName,
      patientId,
      bloodGroup,
      organType,
      urgency,
      hlaMarkers,
      medicalMetadata
    } = req.body;

    if (!patientName || !bloodGroup || !organType) {
      return res.status(400).json({
        success: false,
        message: 'patientName, bloodGroup, and organType are required.'
      });
    }

    const recipient = await OrganRecipient.create({
      hospitalId,
      patientName,
      patientId: patientId || '',
      bloodGroup,
      organType,
      urgency: urgency || 'Moderate',
      hlaMarkers: hlaMarkers || {},
      medicalMetadata: medicalMetadata || {}
    });

    return res.status(201).json({
      success: true,
      message: 'Recipient registered successfully.',
      data: recipient
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/organ/recipients
 * List all recipients belonging to the authenticated hospital.
 */
exports.getRecipients = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { status, organType, bloodGroup, page = 1, limit = 50 } = req.query;

    const filter = { hospitalId };
    if (status) filter.status = status;
    if (organType) filter.organType = organType;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [recipients, total] = await Promise.all([
      OrganRecipient.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      OrganRecipient.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: recipients,
      meta: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/organ/recipients/:recipientId
 * Get a single recipient by ID. Hospital must own the record.
 */
exports.getRecipientById = async (req, res) => {
  try {
    const { recipientId } = req.params;
    if (!validateObjectId(recipientId, 'recipient', res)) return;

    const recipient = await OrganRecipient.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found.' });
    }

    if (recipient.hospitalId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this recipient record.'
      });
    }

    return res.status(200).json({ success: true, data: recipient });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/organ/recipients/:recipientId
 * Update permitted fields on a recipient the hospital owns.
 */
exports.updateRecipient = async (req, res) => {
  try {
    const { recipientId } = req.params;
    if (!validateObjectId(recipientId, 'recipient', res)) return;

    const recipient = await OrganRecipient.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found.' });
    }

    if (recipient.hospitalId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this recipient record.'
      });
    }

    // Only allow whitelisted fields
    const updates = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: `No updatable fields provided. Allowed: ${ALLOWED_UPDATE_FIELDS.join(', ')}`
      });
    }

    const updated = await OrganRecipient.findByIdAndUpdate(
      recipientId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Recipient updated successfully.',
      data: updated
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

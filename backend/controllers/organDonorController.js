/**
 * Organ Donor (Procurement) Controller — Phase 4
 * Academic organ donation MVP — donor registration & organ management
 */

const mongoose = require('mongoose');
const OrganDonor = require('../models/OrganDonor');

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_ORGAN_TYPES = ['Heart', 'Lung', 'Liver', 'Kidney', 'Pancreas'];
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Default viability windows (hours) used when not provided
const DEFAULT_VIABILITY = {
  Heart: 4, Lung: 4, Liver: 8, Pancreas: 12, Kidney: 24
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateObjectId(id, label, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: `Invalid ${label} ID format.` });
    return false;
  }
  return true;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/organ/donors
 * Register a new organ donor/procurement record.
 */
exports.createOrganDonor = async (req, res) => {
  try {
    const procurementHospitalId = req.user.id;

    const {
      donorName,
      donorType,
      bloodGroup,
      hlaMarkers,
      location,
      donorId
    } = req.body;

    if (!donorName || !bloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'donorName and bloodGroup are required.'
      });
    }

    if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}`
      });
    }

    const donor = await OrganDonor.create({
      procurementHospitalId,
      donorId: donorId || null,
      donorName,
      donorType: donorType || 'Deceased',
      bloodGroup,
      hlaMarkers: hlaMarkers || {},
      location: location || undefined,
      availableOrgans: []
    });

    return res.status(201).json({
      success: true,
      message: 'Organ donor registered successfully.',
      data: donor
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/organ/donors
 * List organ donors belonging to the authenticated procurement hospital.
 */
exports.getOrganDonors = async (req, res) => {
  try {
    const procurementHospitalId = req.user.id;
    const { status, page = 1, limit = 50 } = req.query;

    const filter = { procurementHospitalId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [donors, total] = await Promise.all([
      OrganDonor.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      OrganDonor.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: donors,
      meta: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/organ/donors/:donorId
 * Get a single organ donor by ID. Must belong to the authenticated hospital.
 */
exports.getOrganDonorById = async (req, res) => {
  try {
    const { donorId } = req.params;
    if (!validateObjectId(donorId, 'donor', res)) return;

    const donor = await OrganDonor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Organ donor not found.' });
    }

    if (donor.procurementHospitalId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not own this donor record.'
      });
    }

    return res.status(200).json({ success: true, data: donor });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/organ/donors/:donorId/organs
 * Add an available organ subdocument to an existing donor record.
 * Validates organ type, blood group (inherited from donor), timestamps, viability hours.
 */
exports.addOrganToDonor = async (req, res) => {
  try {
    const { donorId } = req.params;
    if (!validateObjectId(donorId, 'donor', res)) return;

    const donor = await OrganDonor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Organ donor not found.' });
    }

    // Only the procuring hospital can add organs
    if (donor.procurementHospitalId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only the procurement hospital can add organs to this record.'
      });
    }

    const { organIdentifier, organType, viabilityHours, procurementTimestamp } = req.body;

    // Required field checks
    if (!organIdentifier || !organType) {
      return res.status(400).json({
        success: false,
        message: 'organIdentifier and organType are required.'
      });
    }

    // Validate organ type
    if (!VALID_ORGAN_TYPES.includes(organType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid organType. Must be one of: ${VALID_ORGAN_TYPES.join(', ')}`
      });
    }

    // Validate organIdentifier uniqueness within this donor record
    const alreadyExists = donor.availableOrgans.some(
      (o) => o.organIdentifier === organIdentifier
    );
    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        message: `An organ with identifier '${organIdentifier}' already exists on this donor.`
      });
    }

    // Validate and resolve viability hours
    const resolvedViabilityHours = Number(viabilityHours) || DEFAULT_VIABILITY[organType];
    if (resolvedViabilityHours <= 0 || resolvedViabilityHours > 72) {
      return res.status(400).json({
        success: false,
        message: 'viabilityHours must be between 1 and 72.'
      });
    }

    // Validate procurement timestamp if provided
    let resolvedProcurement = new Date();
    if (procurementTimestamp) {
      resolvedProcurement = new Date(procurementTimestamp);
      if (isNaN(resolvedProcurement.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid procurementTimestamp. Provide a valid ISO 8601 date string.'
        });
      }
      // Prevent future procurement timestamps
      if (resolvedProcurement > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'procurementTimestamp cannot be in the future.'
        });
      }
    }

    // Check the organ has not already expired at registration time
    const expiryMs = resolvedProcurement.getTime() + resolvedViabilityHours * 3600 * 1000;
    if (Date.now() >= expiryMs) {
      return res.status(400).json({
        success: false,
        message: 'This organ has already exceeded its viability window and cannot be registered as Available.'
      });
    }

    // Push new organ subdocument
    donor.availableOrgans.push({
      organIdentifier,
      organType,
      viabilityHours: resolvedViabilityHours,
      procurementTimestamp: resolvedProcurement,
      organStatus: 'Available'
    });

    await donor.save();

    // Return the newly added organ
    const addedOrgan = donor.availableOrgans[donor.availableOrgans.length - 1];

    return res.status(201).json({
      success: true,
      message: `Organ '${organType}' (${organIdentifier}) added successfully.`,
      data: {
        donorId: donor._id,
        organ: addedOrgan
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

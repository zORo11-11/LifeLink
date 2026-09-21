const Donor = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const AuditLog = require('../models/AuditLog');
const Inventory = require('../models/Inventory');

// Helper to broadcast socket events if available
const emitSocketEvents = (req, donor, request) => {
  const io = req.app ? req.app.get('io') : null;
  if (!io) return;

  const payload = {
    donorId: donor._id,
    liveStatus: donor.liveStatus,
    currentLocationStatus: donor.currentLocationStatus,
    estimatedArrival: donor.estimatedArrival,
    assignedRequestId: donor.assignedRequestId,
    trackingLogs: donor.trackingLogs,
    request: request || null,
    updatedAt: new Date()
  };

  io.emit('donor_status_updated', payload);
  if (donor._id) {
    io.to(`user_${donor._id}`).emit('donor_status_updated', payload);
  }

  if (request) {
    io.emit('request_updated', request);
    if (request.hospitalId) {
      const hospId = request.hospitalId._id || request.hospitalId;
      io.to(`hospital_${hospId}`).emit('request_updated', request);
    }
  }
};

/**
 * Update real-time live status of a donor and sync active blood request
 * PATCH /api/donors/:donorId/live-status
 */
exports.updateLiveStatus = async (req, res) => {
  try {
    const { donorId } = req.params;
    const { status, currentLocationStatus, estimatedArrival, assignedRequestId, notes } = req.body;

    // 1. Authorization check: Allow both assigned Donors and Hospital/Admin users to update tracking
    const isDonorOwner = req.user && (req.user.id === donorId || req.user._id === donorId);
    const isHospitalOrAdmin = req.user && ['hospital', 'admin', 'staff', 'doctor'].includes(req.user.role);

    if (!req.user || (!isDonorOwner && !isHospitalOrAdmin)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to modify this donation status.'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status field is required.'
      });
    }

    // Standardize status format (Added support for direct hospital completion actions)
    const validStatuses = ['Pending', 'In Transit', 'In-Transit', 'Accepted', 'Reached', 'Arrived', 'Completed', 'Verified', 'Verify', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Normalize status names for consistent database storage
    let normalizedStatus = status;
    if (status === 'In-Transit') normalizedStatus = 'In Transit';
    if (status === 'Arrived') normalizedStatus = 'Reached';
    if (status === 'Verified' || status === 'Verify') normalizedStatus = 'Completed';

    // 2. Fetch Donor
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor record not found.'
      });
    }

    // Determine target Blood Request ID
    const targetRequestId = assignedRequestId || donor.assignedRequestId;

    // 3. Update Donor Tracking Fields
    donor.liveStatus = normalizedStatus;
    if (currentLocationStatus !== undefined) donor.currentLocationStatus = currentLocationStatus;
    if (estimatedArrival !== undefined) donor.estimatedArrival = estimatedArrival;
    if (assignedRequestId !== undefined) donor.assignedRequestId = assignedRequestId;

    const logEntry = {
      status: normalizedStatus,
      timestamp: new Date(),
      notes: notes || `Status marked as '${normalizedStatus}'`
    };
    if (!donor.trackingLogs) donor.trackingLogs = [];
    donor.trackingLogs.push(logEntry);

    // 4. Find & Sync Associated Blood Request
    let targetRequest = null;
    if (targetRequestId) {
      targetRequest = await BloodRequest.findById(targetRequestId)
        .populate('hospitalId', 'name phone address')
        .populate('acceptedByDonor', 'fullName name bloodGroup phone address email');
    }

    // If request exists, map donor live status to Blood Request status & step
    if (targetRequest) {
      let reqStatus = targetRequest.status;
      let reqStep = targetRequest.step;

      if (normalizedStatus === 'Accepted') {
        reqStatus = 'Accepted';
        reqStep = 1;
      } else if (normalizedStatus === 'In Transit') {
        reqStatus = 'In-Transit';
        reqStep = 2;
      } else if (normalizedStatus === 'Reached') {
        reqStatus = 'Arrived';
        reqStep = 3;
      } else if (normalizedStatus === 'Completed') {
        reqStatus = 'Completed';
        reqStep = 4;
      } else if (normalizedStatus === 'Cancelled') {
        reqStatus = 'Cancelled';
      }

      targetRequest.status = reqStatus;
      targetRequest.step = reqStep;
      targetRequest.acceptedByDonor = donor._id;
      if (!targetRequest.trackingHistory) targetRequest.trackingHistory = [];
      targetRequest.trackingHistory.push({
        status: reqStatus,
        timestamp: new Date()
      });

      await targetRequest.save();
    }

    // 5. Automatic side effects on 'Completed' status
    if (normalizedStatus === 'Completed') {
      const bloodGroupToUpdate = targetRequest ? targetRequest.bloodType : (donor.bloodGroup || donor.bloodType || 'O+');
      const unitsToInc = targetRequest ? (targetRequest.requiredUnits || 1) : 1;

      // a. Update Inventory
      if (targetRequest && targetRequest.hospitalId) {
        const hospitalObjId = targetRequest.hospitalId._id || targetRequest.hospitalId;
        await Inventory.findOneAndUpdate(
          { hospitalId: hospitalObjId, bloodType: bloodGroupToUpdate },
          { $inc: { units: unitsToInc }, $set: { status: 'Optimal' } },
          { upsert: true, new: true }
        );
      } else {
        await Inventory.findOneAndUpdate(
          { bloodType: bloodGroupToUpdate },
          { $inc: { units: unitsToInc } },
          { upsert: true, new: true }
        );
      }

      // b. Write to AuditLog
      await AuditLog.create({
        hospitalId: targetRequest && targetRequest.hospitalId ? (targetRequest.hospitalId._id || targetRequest.hospitalId) : donor._id,
        caseId: targetRequest ? targetRequest._id.toString() : `DON-${donor._id}`,
        patientName: targetRequest ? targetRequest.patientName : 'Emergency Patient',
        bloodType: bloodGroupToUpdate,
        units: unitsToInc,
        urgency: targetRequest ? (targetRequest.urgencyLevel || 'Critical Priority') : 'Standard',
        donorName: donor.fullName || donor.name || 'Verified Donor',
        donorId: donor._id,
        status: 'Completed',
        completedAt: new Date()
      });

      // c. Update donor's stats, mark unavailable for 90-day window, and release assigned request
      donor.totalDonations = (donor.totalDonations || 0) + 1;
      donor.lastDonated = new Date();
      donor.lastDonation = new Date();
      donor.lastDonatedDate = new Date();
      donor.isAvailable = false;
      donor.assignedRequestId = null;
    }

    // If cancelled, clear assigned request
    if (normalizedStatus === 'Cancelled') {
      donor.assignedRequestId = null;
    }

    await donor.save();

    // 6. Emit real-time Socket notifications
    emitSocketEvents(req, donor, targetRequest);

    return res.status(200).json({
      success: true,
      message: `Donor live status updated to '${normalizedStatus}' successfully.`,
      donor: {
        id: donor._id,
        _id: donor._id,
        liveStatus: donor.liveStatus,
        currentLocationStatus: donor.currentLocationStatus,
        estimatedArrival: donor.estimatedArrival,
        assignedRequestId: donor.assignedRequestId,
        totalDonations: donor.totalDonations,
        lastDonated: donor.lastDonated,
        lastDonatedDate: donor.lastDonatedDate,
        isAvailable: donor.isAvailable,
        trackingLogs: donor.trackingLogs
      },
      request: targetRequest
    });

  } catch (error) {
    console.error('Error in updateLiveStatus:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while updating donor live status.'
    });
  }
};

/**
 * Get active tracking state and assigned blood request for a donor
 * GET /api/donors/:donorId/active-tracking
 */
exports.getActiveTracking = async (req, res) => {
  try {
    const { donorId } = req.params;
    const donor = await Donor.findById(donorId);

    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    let activeRequest = null;
    if (donor.assignedRequestId) {
      activeRequest = await BloodRequest.findById(donor.assignedRequestId)
        .populate('hospitalId', 'name phone address')
        .populate('acceptedByDonor', 'fullName name bloodGroup phone address email');
    }

    if (!activeRequest) {
      // Fallback: search for any active request accepted by this donor
      activeRequest = await BloodRequest.findOne({
        acceptedByDonor: donorId,
        status: { $in: ['Accepted', 'In-Transit', 'Arrived', 'In_progress', 'IN_PROGRESS'] }
      })
        .populate('hospitalId', 'name phone address')
        .populate('acceptedByDonor', 'fullName name bloodGroup phone address email')
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      data: {
        donorId: donor._id,
        liveStatus: donor.liveStatus || 'Pending',
        currentLocationStatus: donor.currentLocationStatus || 'Not Started',
        estimatedArrival: donor.estimatedArrival || 'N/A',
        assignedRequestId: donor.assignedRequestId,
        trackingLogs: donor.trackingLogs || [],
        activeRequest
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching active tracking data.'
    });
  }
};
// routes/reqRoutes.js
const express = require('express');
const router = express.Router();
const BloodRequest = require('../models/BloodRequest');
const Inventory = require('../models/Inventory');
const auth = require('../middleware/auth');

// Helper to broadcast socket events to targeted user/hospital rooms
const emitSocketEvent = (req, eventName, payload) => {
  const io = req.app.get('io');
  if (!io) return;

  // Emit to specific rooms if targets exist in payload
  if (payload.acceptedByDonor) {
    const donorId = payload.acceptedByDonor._id || payload.acceptedByDonor;
    io.to(`user_${donorId}`).emit(eventName, payload);
  }
  if (payload.hospitalId) {
    const hospitalId = payload.hospitalId._id || payload.hospitalId;
    io.to(`hospital_${hospitalId}`).emit(eventName, payload);
  }

  // Fallback broadcast for general feeds (e.g., new broadcasted requests)
  if (eventName === 'request_created') {
    io.emit(eventName, payload);
  }
};

// 1. CREATE BLOOD REQUEST (Hospital Creates Request)
router.post('/create', auth, async (req, res) => {
  try {
    const {
      hospitalId,
      patientName,
      targetWard,
      bloodType,
      requiredUnits,
      urgencyLevel,
      medicalDetails,
    } = req.body;

    // Generate a random 6-digit verification code for desk check-in
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newRequest = await BloodRequest.create({
      hospitalId,
      patientName,
      targetWard,
      bloodType: bloodType || 'O+',
      requiredUnits: Number(requiredUnits) || 1,
      urgencyLevel: urgencyLevel || 'Critical Priority',
      medicalDetails: medicalDetails || '',
      verificationCode,
      status: 'Broadcasted',
      step: 0,
      trackingHistory: [{ status: 'Broadcasted', timestamp: new Date() }]
    });

    const populatedRequest = await BloodRequest.findById(newRequest._id)
      .populate('hospitalId', 'name phone address')
      .populate('acceptedByDonor', 'fullName name bloodGroup phone address email');

    const resultData = populatedRequest || newRequest;

    emitSocketEvent(req, 'request_created', resultData);

    res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      data: resultData,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// 2. DONOR FEED ROUTE (Fetch Broadcasted Requests matching Donor Blood Group)
router.get('/donor-feed', auth, async (req, res) => {
  try {
    let { bloodGroup } = req.query;
    const filter = {
      status: { $in: ['Broadcasted', 'Broadcast Sent', 'Pending', 'Pending Response'] }
    };

    if (bloodGroup && typeof bloodGroup === 'string' && bloodGroup.trim() !== '' && !bloodGroup.includes('${')) {
      const sanitizedGroup = decodeURIComponent(bloodGroup).replace(/ /g, '+').trim();
      filter.bloodType = sanitizedGroup;
    }

    const requests = await BloodRequest.find(filter)
      .populate('hospitalId', 'name phone address')
      .populate('acceptedByDonor', 'fullName name bloodGroup phone address email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 2b. HOSPITAL FEED ROUTE (Fetch active requests for Hospital Real-time Mirroring)
router.get('/hospital-feed', auth, async (req, res) => {
  try {
    const { hospitalId } = req.query;
    const filter = {};
    if (hospitalId && hospitalId !== 'undefined' && hospitalId !== 'null') {
      filter.hospitalId = hospitalId;
    }

    const requests = await BloodRequest.find(filter)
      .populate('hospitalId', 'name phone address')
      .populate('acceptedByDonor', 'fullName name bloodGroup phone address email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 3. ACCEPT REQUEST ROUTE (Atomic Lock to prevent race conditions)
router.patch('/:id/accept', auth, async (req, res) => {
  try {
    const requestId = req.params.id;
    const { donorId } = req.body;

    if (!donorId) {
      return res.status(400).json({ success: false, message: 'Donor ID is required to accept request' });
    }

    const updatedRequest = await BloodRequest.findOneAndUpdate(
      { 
        _id: requestId,
        status: { $in: ['Broadcasted', 'Broadcast Sent', 'Pending', 'Pending Response'] }
      },
      {
        $set: {
          status: 'Accepted',
          acceptedByDonor: donorId,
          step: 1
        },
        $push: {
          respondedDonors: { donorId, status: 'Accepted' },
          trackingHistory: { status: 'Accepted', timestamp: new Date() }
        }
      },
      { new: true }
    )
      .populate('hospitalId', 'name phone address')
      .populate('acceptedByDonor', 'fullName name bloodGroup phone address email');

    if (!updatedRequest) {
      return res.status(409).json({ 
        success: false, 
        message: 'This blood request has already been accepted by another donor or is no longer active.' 
      });
    }

    emitSocketEvent(req, 'request_updated', updatedRequest);

    res.status(200).json({
      success: true,
      message: 'Request accepted successfully',
      data: updatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 4. UPDATE REQUEST STATUS ROUTE (With Desk Verification & Inventory Trigger)
router.patch('/status/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { donorId, step, status, verificationCode } = req.body;

    const request = await BloodRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Direct completion without verification code check
    if (status === 'Verified & Complete' || status === 'Completed') {
      await Inventory.findOneAndUpdate(
        { bloodGroup: request.bloodType },
        { $inc: { units: request.requiredUnits } },
        { upsert: true, new: true }
      );
    }

    const updateFields = {};
    if (step !== undefined) updateFields.step = step;
    if (status !== undefined) updateFields.status = status;
    if (donorId) updateFields.acceptedByDonor = donorId;

    const updatedRequest = await BloodRequest.findByIdAndUpdate(
      id,
      { 
        $set: updateFields,
        $push: { trackingHistory: { status: status || request.status, timestamp: new Date() } }
      },
      { new: true }
    )
      .populate('hospitalId', 'name phone address')
      .populate('acceptedByDonor', 'fullName name bloodGroup phone address email');

    emitSocketEvent(req, 'request_updated', updatedRequest);

    res.status(200).json({
      success: true,
      message: 'Request status updated successfully',
      data: updatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Alias for /:id/status to support alternative route convention
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { donorId, step, status, verificationCode } = req.body;

    const request = await BloodRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (status === 'Verified & Complete' || status === 'Completed') {
      if (request.verificationCode && request.verificationCode !== verificationCode) {
        return res.status(400).json({ success: false, message: 'Invalid verification code provided.' });
      }

      await Inventory.findOneAndUpdate(
        { bloodGroup: request.bloodType },
        { $inc: { units: request.requiredUnits } },
        { upsert: true, new: true }
      );
    }

    const updateFields = {};
    if (step !== undefined) updateFields.step = step;
    if (status !== undefined) updateFields.status = status;
    if (donorId) updateFields.acceptedByDonor = donorId;

    const updatedRequest = await BloodRequest.findByIdAndUpdate(
      id,
      { 
        $set: updateFields,
        $push: { trackingHistory: { status: status || request.status, timestamp: new Date() } }
      },
      { new: true }
    )
      .populate('hospitalId', 'name phone address')
      .populate('acceptedByDonor', 'fullName name bloodGroup phone address email');

    emitSocketEvent(req, 'request_updated', updatedRequest);

    res.status(200).json({
      success: true,
      message: 'Request status updated successfully',
      data: updatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 5. CANCEL REQUEST ROUTE
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRequest = await BloodRequest.findByIdAndUpdate(
      id,
      {
        $set: { status: 'Cancelled' },
        $push: { trackingHistory: { status: 'Cancelled', timestamp: new Date() } }
      },
      { new: true }
    )
      .populate('hospitalId', 'name phone address')
      .populate('acceptedByDonor', 'fullName name bloodGroup phone address email');

    if (!updatedRequest) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    emitSocketEvent(req, 'request_updated', updatedRequest);

    res.status(200).json({
      success: true,
      message: 'Blood request cancelled successfully',
      data: updatedRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 6. GET HOSPITAL REQUESTS
router.get('/hospital/:hospitalId', auth, async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const requests = await BloodRequest.find({ hospitalId })
      .populate('hospitalId', 'name phone address')
      .populate('acceptedByDonor', 'fullName name bloodGroup phone address email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. GET ACTIVE DONOR REQUESTS
router.get('/active/:donorId', auth, async (req, res) => {
  try {
    const { donorId } = req.params;
    const activeRequests = await BloodRequest.find({
      $or: [
        { acceptedByDonor: donorId },
        { 'respondedDonors.donorId': donorId }
      ],
      status: { $in: ['Accepted', 'In-Transit', 'Arrived', 'Arrived at Desk', 'IN_PROGRESS', 'In_progress'] }
    })
      .populate('hospitalId', 'name phone address')
      .populate('acceptedByDonor', 'fullName name bloodGroup phone address email');

    res.status(200).json({
      success: true,
      data: activeRequests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
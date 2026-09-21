/**
 * Organ Offer Controller — Phase 4
 * Handles offer creation, listing, response (accept/decline), and expiry detection.
 *
 * Status lifecycle:
 *   Offered → Accepted | Declined | Expired
 *
 * Organ status lifecycle (inside OrganDonor.availableOrgans):
 *   Available → Offered  (on successful offer creation)
 *   Offered → Available  (on decline or expiry release)
 *   Offered → Allocated  (on acceptance — organ is reserved for recipient)
 *
 * NOTE: Does NOT mark organ as Transplanted or start transport automatically.
 */

const mongoose = require('mongoose');
const OrganDonor    = require('../models/OrganDonor');
const OrganRecipient = require('../models/OrganRecipient');
const OrganAllocation = require('../models/OrganAllocation');
const OrganNotification = require('../models/OrganNotification');
const { calculateMatchingScore } = require('../services/organMatchingService');
const { checkOrganViability }    = require('../services/organLogisticsService');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateObjectId(id, label, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: `Invalid ${label} ID format.` });
    return false;
  }
  return true;
}

/**
 * Detect whether an allocation's offerExpiry has passed.
 * If expired and still 'Offered', update status to 'Expired' and release organ.
 * Returns true if the offer was (or already was) expired.
 */
async function handleExpiryCheck(allocation) {
  if (!allocation.offerExpiry) return false;
  if (allocation.status !== 'Offered') return false;

  const now = new Date();
  if (now < allocation.offerExpiry) return false;

  // Expire the allocation
  await OrganAllocation.findByIdAndUpdate(allocation._id, {
    $set: { status: 'Expired' }
  });

  // Release organ back to Available (conditional: only if still Offered)
  await OrganDonor.findOneAndUpdate(
    {
      _id: allocation.donorId,
      'availableOrgans.organIdentifier': allocation.organIdentifier,
      'availableOrgans.organStatus': 'Offered'
    },
    { $set: { 'availableOrgans.$.organStatus': 'Available' } }
  );

  // Notify offering hospital
  await OrganNotification.create({
    hospitalId: allocation.offeringHospitalId,
    allocationId: allocation._id,
    donorId: allocation.donorId,
    recipientId: allocation.recipientId,
    type: 'OFFER_EXPIRED',
    message: `Offer for organ '${allocation.organIdentifier}' (${allocation.organType}) has expired.`
  });

  allocation.status = 'Expired'; // mutate in-memory too
  return true;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/organ/offers
 * Create an organ offer after server-side match recalculation.
 */
exports.createOffer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      donorId,
      organIdentifier,
      recipientId,
      receivingHospitalId,
      offerExpiryHours
    } = req.body;

    const offeringHospitalId = req.user.id;

    // ── Validate IDs ──────────────────────────────────────────────────────
    for (const [id, label] of [
      [donorId, 'donor'],
      [recipientId, 'recipient'],
      [receivingHospitalId, 'receivingHospital']
    ]) {
      if (!validateObjectId(id, label, res)) {
        await session.abortTransaction();
        return;
      }
    }

    if (!organIdentifier) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'organIdentifier is required.' });
    }

    // ── Load donor & organ ─────────────────────────────────────────────────
    const donor = await OrganDonor.findById(donorId).session(session);
    if (!donor) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Organ donor not found.' });
    }

    // Only the procurement hospital can create an offer
    if (donor.procurementHospitalId.toString() !== offeringHospitalId) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only the procurement hospital can create an offer for this donor.'
      });
    }

    const organIndex = donor.availableOrgans.findIndex(
      (o) => o.organIdentifier === organIdentifier
    );
    if (organIndex === -1) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: `Organ '${organIdentifier}' not found on this donor.`
      });
    }

    const organ = donor.availableOrgans[organIndex];

    // ── Check organ is still Available ────────────────────────────────────
    if (organ.organStatus !== 'Available') {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: `Organ is not available (current status: ${organ.organStatus}).`
      });
    }

    // ── Viability check ───────────────────────────────────────────────────
    const viabilityCheck = checkOrganViability(organ, 0);
    if (!viabilityCheck.isViable) {
      await session.abortTransaction();
      return res.status(422).json({
        success: false,
        message: `Organ is no longer viable: ${viabilityCheck.reason}`
      });
    }

    // ── Load recipient ────────────────────────────────────────────────────
    const recipient = await OrganRecipient.findById(recipientId).session(session);
    if (!recipient) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Recipient not found.' });
    }

    if (recipient.status !== 'Waiting') {
      await session.abortTransaction();
      return res.status(422).json({
        success: false,
        message: `Recipient is not in 'Waiting' status (current: ${recipient.status}).`
      });
    }

    // ── Server-side match recalculation (do NOT trust front-end scores) ───
    const matchResult = calculateMatchingScore(donor, organ, recipient);
    if (!matchResult.isEligible) {
      await session.abortTransaction();
      return res.status(422).json({
        success: false,
        message: 'Recipient is ineligible for this organ.',
        exclusionReasons: matchResult.exclusionReasons
      });
    }

    // ── Prevent duplicate active offer for the same organ ─────────────────
    const existingOffer = await OrganAllocation.findOne({
      donorId,
      organIdentifier,
      status: 'Offered'
    }).session(session);

    if (existingOffer) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: 'An active offer already exists for this organ. Decline or wait for expiry before creating a new offer.',
        existingAllocationId: existingOffer._id
      });
    }

    // ── Compute expiry ────────────────────────────────────────────────────
    const expiryHours = Number(offerExpiryHours) > 0 ? Number(offerExpiryHours) : 1;
    const offerExpiry = new Date(Date.now() + expiryHours * 3600 * 1000);

    // ── Create OrganAllocation ────────────────────────────────────────────
    const [allocation] = await OrganAllocation.create(
      [
        {
          donorId,
          organIdentifier,
          organType: organ.organType,
          recipientId,
          offeringHospitalId,
          receivingHospitalId,
          priorityScore: matchResult.priorityScore,
          scoreBreakdown: {
            baseUrgencyScore: matchResult.scoreBreakdown.baseUrgencyScore,
            waitingDaysScore: matchResult.scoreBreakdown.waitingDaysScore,
            hlaMatchScore: matchResult.scoreBreakdown.hlaMatchScore
          },
          distanceKm: matchResult.logistics.distanceKm || 0,
          travelTimeMinutes: matchResult.logistics.travelTimeMinutes || 0,
          viabilityWindowHours: organ.viabilityHours,
          remainingViabilityMinutes: viabilityCheck.remainingViabilityMinutes || 0,
          isViable: true,
          status: 'Offered',
          offerExpiry
        }
      ],
      { session }
    );

    // ── Set organ status to Offered ───────────────────────────────────────
    donor.availableOrgans[organIndex].organStatus = 'Offered';
    await donor.save({ session });

    // ── Update recipient status to Offered ────────────────────────────────
    await OrganRecipient.findByIdAndUpdate(
      recipientId,
      { $set: { status: 'Offered' } },
      { session }
    );

    // ── Create notifications ──────────────────────────────────────────────
    const notifBase = {
      allocationId: allocation._id,
      donorId,
      recipientId,
      type: 'OFFER_RECEIVED'
    };

    const notifs = await OrganNotification.insertMany(
      [
        {
          ...notifBase,
          hospitalId: receivingHospitalId,
          message: `New organ offer received: ${organ.organType} (${organIdentifier}) for patient ${recipient.patientName || recipientId}. Offer expires at ${offerExpiry.toISOString()}.`
        },
        {
          ...notifBase,
          hospitalId: offeringHospitalId,
          type: 'OFFER_RECEIVED',
          message: `Offer created for ${organ.organType} (${organIdentifier}) to receiving hospital. Expires: ${offerExpiry.toISOString()}.`
        }
      ],
      { session }
    );

    // Emit live Socket.IO events to hospital rooms
    const io = req.app ? req.app.get('io') : null;
    if (io) {
      notifs.forEach(n => {
        io.to(`hospital_${n.hospitalId}`).emit('organ_notification_received', n);
        io.to(`hospital_${n.hospitalId}`).emit('organ_offer_received', { allocationId: allocation._id });
      });
    }

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: 'Organ offer created successfully.',
      data: {
        allocation,
        matchScore: matchResult.priorityScore,
        scoreBreakdown: matchResult.scoreBreakdown,
        offerExpiry
      }
    });
  } catch (error) {
    await session.abortTransaction();
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/organ/offers/incoming
 * Return all offers where the authenticated hospital is the receiving hospital.
 */
exports.getIncomingOffers = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { status, page = 1, limit = 50 } = req.query;

    const filter = { receivingHospitalId: hospitalId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let offers = await OrganAllocation.find(filter)
      .populate('donorId', 'donorName bloodGroup procurementHospitalId')
      .populate('recipientId', 'patientName organType bloodGroup urgency')
      .populate('offeringHospitalId', 'name city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Request-time expiry detection
    const expiredIds = [];
    offers = offers.map((offer) => {
      if (
        offer.status === 'Offered' &&
        offer.offerExpiry &&
        new Date() >= new Date(offer.offerExpiry)
      ) {
        expiredIds.push(offer._id);
        return { ...offer, status: 'Expired', _expiredNow: true };
      }
      return offer;
    });

    // Batch-expire in DB (fire-and-forget, safe to fail)
    if (expiredIds.length > 0) {
      OrganAllocation.updateMany(
        { _id: { $in: expiredIds }, status: 'Offered' },
        { $set: { status: 'Expired' } }
      ).catch(() => {});
    }

    const total = await OrganAllocation.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: offers,
      meta: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/organ/offers/outgoing
 * Return all offers where the authenticated hospital is the offering hospital.
 */
exports.getOutgoingOffers = async (req, res) => {
  try {
    const hospitalId = req.user.id;
    const { status, page = 1, limit = 50 } = req.query;

    const filter = { offeringHospitalId: hospitalId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let offers = await OrganAllocation.find(filter)
      .populate('donorId', 'donorName bloodGroup')
      .populate('recipientId', 'patientName organType bloodGroup urgency')
      .populate('receivingHospitalId', 'name city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Request-time expiry detection
    const expiredIds = [];
    offers = offers.map((offer) => {
      if (
        offer.status === 'Offered' &&
        offer.offerExpiry &&
        new Date() >= new Date(offer.offerExpiry)
      ) {
        expiredIds.push(offer._id);
        return { ...offer, status: 'Expired', _expiredNow: true };
      }
      return offer;
    });

    if (expiredIds.length > 0) {
      OrganAllocation.updateMany(
        { _id: { $in: expiredIds }, status: 'Offered' },
        { $set: { status: 'Expired' } }
      ).catch(() => {});
    }

    const total = await OrganAllocation.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: offers,
      meta: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/organ/offers/:allocationId/respond
 * Accept or decline an organ offer.
 * Only the receiving hospital may respond.
 */
exports.respondToOffer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { allocationId } = req.params;
    if (!validateObjectId(allocationId, 'allocation', res)) {
      await session.abortTransaction();
      return;
    }

    const { action, reason } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "action must be 'accept' or 'decline'."
      });
    }

    const hospitalId = req.user.id;

    // Load allocation
    const allocation = await OrganAllocation.findById(allocationId).session(session);
    if (!allocation) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Allocation not found.' });
    }

    // Only the receiving hospital may respond
    if (allocation.receivingHospitalId.toString() !== hospitalId) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only the receiving hospital can respond to this offer.'
      });
    }

    // Request-time expiry check
    const wasExpired = await handleExpiryCheck(allocation);
    if (wasExpired) {
      await session.abortTransaction();
      return res.status(410).json({
        success: false,
        message: 'This offer has expired and can no longer be responded to.'
      });
    }

    // Safe status gate — only respond to active Offered allocations
    if (allocation.status !== 'Offered') {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        message: `Cannot respond to an offer with status '${allocation.status}'. Only 'Offered' allocations can be accepted or declined.`
      });
    }

    const respondedAt = new Date();
    const respondedBy = hospitalId;

    if (action === 'accept') {
      // Conditional update to prevent race-prone duplicate acceptance
      const updated = await OrganAllocation.findOneAndUpdate(
        { _id: allocationId, status: 'Offered' },
        {
          $set: {
            status: 'Accepted',
            'acceptDeclineInfo.reason': reason || 'Accepted by receiving hospital.',
            'acceptDeclineInfo.respondedAt': respondedAt,
            'acceptDeclineInfo.respondedBy': respondedBy
          }
        },
        { new: true, session }
      );

      if (!updated) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          message: 'Duplicate response detected. This offer has already been responded to.'
        });
      }

      // Set organ status to Allocated (reserved, awaiting transplant)
      await OrganDonor.findOneAndUpdate(
        {
          _id: allocation.donorId,
          'availableOrgans.organIdentifier': allocation.organIdentifier,
          'availableOrgans.organStatus': 'Offered'
        },
        { $set: { 'availableOrgans.$.organStatus': 'Allocated' } },
        { session }
      );

      // Update recipient status to Allocated
      await OrganRecipient.findByIdAndUpdate(
        allocation.recipientId,
        { $set: { status: 'Allocated' } },
        { session }
      );

      // Notifications for both hospitals
      const acceptNotifs = await OrganNotification.insertMany(
        [
          {
            hospitalId: allocation.offeringHospitalId,
            allocationId: allocation._id,
            donorId: allocation.donorId,
            recipientId: allocation.recipientId,
            type: 'OFFER_ACCEPTED',
            message: `Offer accepted for organ '${allocation.organIdentifier}' (${allocation.organType}). Coordinate transport manually.`
          },
          {
            hospitalId: allocation.receivingHospitalId,
            allocationId: allocation._id,
            donorId: allocation.donorId,
            recipientId: allocation.recipientId,
            type: 'OFFER_ACCEPTED',
            message: `You have accepted the organ offer for '${allocation.organType}' (${allocation.organIdentifier}). Please prepare for transplant.`
          }
        ],
        { session }
      );

      const io = req.app ? req.app.get('io') : null;
      if (io) {
        acceptNotifs.forEach(n => {
          io.to(`hospital_${n.hospitalId}`).emit('organ_notification_received', n);
          io.to(`hospital_${n.hospitalId}`).emit('organ_offer_updated', { allocationId: allocation._id, status: 'Accepted' });
        });
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: 'Offer accepted. Organ status set to Allocated. Please coordinate transport manually.',
        data: updated
      });

    } else {
      // action === 'decline'
      const updated = await OrganAllocation.findOneAndUpdate(
        { _id: allocationId, status: 'Offered' },
        {
          $set: {
            status: 'Declined',
            'acceptDeclineInfo.reason': reason || 'Declined by receiving hospital.',
            'acceptDeclineInfo.respondedAt': respondedAt,
            'acceptDeclineInfo.respondedBy': respondedBy
          }
        },
        { new: true, session }
      );

      if (!updated) {
        await session.abortTransaction();
        return res.status(409).json({
          success: false,
          message: 'Duplicate response detected. This offer has already been responded to.'
        });
      }

      // Release organ back to Available
      await OrganDonor.findOneAndUpdate(
        {
          _id: allocation.donorId,
          'availableOrgans.organIdentifier': allocation.organIdentifier,
          'availableOrgans.organStatus': 'Offered'
        },
        { $set: { 'availableOrgans.$.organStatus': 'Available' } },
        { session }
      );

      // Revert recipient to Waiting
      await OrganRecipient.findByIdAndUpdate(
        allocation.recipientId,
        { $set: { status: 'Waiting' } },
        { session }
      );

      // Notifications
      const declineNotifs = await OrganNotification.insertMany(
        [
          {
            hospitalId: allocation.offeringHospitalId,
            allocationId: allocation._id,
            donorId: allocation.donorId,
            recipientId: allocation.recipientId,
            type: 'OFFER_DECLINED',
            message: `Offer for organ '${allocation.organIdentifier}' (${allocation.organType}) was declined. Organ is now Available again.${reason ? ' Reason: ' + reason : ''}`
          },
          {
            hospitalId: allocation.receivingHospitalId,
            allocationId: allocation._id,
            donorId: allocation.donorId,
            recipientId: allocation.recipientId,
            type: 'OFFER_DECLINED',
            message: `You declined the offer for '${allocation.organType}' (${allocation.organIdentifier}).${reason ? ' Reason: ' + reason : ''}`
          }
        ],
        { session }
      );

      const io = req.app ? req.app.get('io') : null;
      if (io) {
        declineNotifs.forEach(n => {
          io.to(`hospital_${n.hospitalId}`).emit('organ_notification_received', n);
          io.to(`hospital_${n.hospitalId}`).emit('organ_offer_updated', { allocationId: allocation._id, status: 'Declined' });
        });
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: 'Offer declined. Organ status released back to Available.',
        data: updated
      });
    }
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

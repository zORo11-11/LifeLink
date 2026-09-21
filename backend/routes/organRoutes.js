/**
 * Organ API Router — Phase 4
 * Base path: /api/organ
 *
 * All routes require verifyToken.
 * All routes require requireRole('hospital') — organ management is hospital-only.
 */

const express = require('express');
const router = express.Router();

const { verifyToken, requireRole } = require('../middleware/auth');

const organRecipientCtrl    = require('../controllers/organRecipientController');
const organDonorCtrl        = require('../controllers/organDonorController');
const organMatchingCtrl     = require('../controllers/organMatchingController');
const organOfferCtrl        = require('../controllers/organOfferController');
const organNotificationCtrl = require('../controllers/organNotificationController');

// All organ routes are hospital-only
router.use(verifyToken, requireRole('hospital'));

// ── Recipient Routes ──────────────────────────────────────────────────────────
// POST   /api/organ/recipients            — register a new recipient
// GET    /api/organ/recipients            — list own hospital's recipients
// GET    /api/organ/recipients/:id        — get single recipient (own hospital)
// PATCH  /api/organ/recipients/:id        — update allowed fields (own hospital)
router.post('/recipients',           organRecipientCtrl.createRecipient);
router.get('/recipients',            organRecipientCtrl.getRecipients);
router.get('/recipients/:recipientId', organRecipientCtrl.getRecipientById);
router.patch('/recipients/:recipientId', organRecipientCtrl.updateRecipient);

// ── Donor / Procurement Routes ────────────────────────────────────────────────
// POST   /api/organ/donors               — register a new organ donor record
// GET    /api/organ/donors               — list own hospital's donor records
// GET    /api/organ/donors/:donorId      — get single donor (own hospital)
// POST   /api/organ/donors/:donorId/organs — add an organ to a donor record
router.post('/donors',                  organDonorCtrl.createOrganDonor);
router.get('/donors',                   organDonorCtrl.getOrganDonors);
router.get('/donors/:donorId',          organDonorCtrl.getOrganDonorById);
router.post('/donors/:donorId/organs',  organDonorCtrl.addOrganToDonor);

// ── Matching Route ────────────────────────────────────────────────────────────
// GET    /api/organ/matching/:donorId/:organIdentifier
//        — academic recommendation only, read-only, no status mutations
router.get('/matching/:donorId/:organIdentifier', organMatchingCtrl.runMatching);

// ── Offer Routes — NOTE: order matters (specific before parameterised) ─────────
// POST   /api/organ/offers               — create an offer
// GET    /api/organ/offers/incoming      — offers where this hospital is receiving
// GET    /api/organ/offers/outgoing      — offers where this hospital is offering
// POST   /api/organ/offers/:allocationId/respond — accept or decline
router.post('/offers',                     organOfferCtrl.createOffer);
router.get('/offers/incoming',             organOfferCtrl.getIncomingOffers);
router.get('/offers/outgoing',             organOfferCtrl.getOutgoingOffers);
router.post('/offers/:allocationId/respond', organOfferCtrl.respondToOffer);

// ── Notification Routes ───────────────────────────────────────────────────────
// GET    /api/organ/notifications
// PATCH  /api/organ/notifications/mark-all-read
// PATCH  /api/organ/notifications/:id/read
router.get('/notifications',               organNotificationCtrl.getNotifications);
router.patch('/notifications/mark-all-read', organNotificationCtrl.markAllAsRead);
router.patch('/notifications/:id/read',    organNotificationCtrl.markAsRead);

module.exports = router;

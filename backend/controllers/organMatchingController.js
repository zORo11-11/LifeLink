/**
 * Organ Matching Controller — Phase 4
 * GET /api/organ/matching/:donorId/:organIdentifier
 *
 * Academic recommendation only — never auto-allocates or changes organ status.
 */

const mongoose = require('mongoose');
const OrganDonor = require('../models/OrganDonor');
const OrganRecipient = require('../models/OrganRecipient');
const { findBestOrganMatch } = require('../services/organMatchingService');
const { checkOrganViability } = require('../services/organLogisticsService');

function validateObjectId(id, label, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ success: false, message: `Invalid ${label} ID format.` });
    return false;
  }
  return true;
}

/**
 * GET /api/organ/matching/:donorId/:organIdentifier
 *
 * Returns a ranked list of eligible recipients for the requested organ.
 * Does NOT modify any document.
 */
exports.runMatching = async (req, res) => {
  try {
    const { donorId, organIdentifier } = req.params;

    if (!validateObjectId(donorId, 'donor', res)) return;

    // ── 1. Load donor ──────────────────────────────────────────────────────
    const donor = await OrganDonor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Organ donor not found.' });
    }

    // Hospital must be the procurement hospital to run matching
    if (donor.procurementHospitalId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only the procurement hospital can run matching for this donor.'
      });
    }

    // ── 2. Load requested organ ────────────────────────────────────────────
    const organ = donor.availableOrgans.find(
      (o) => o.organIdentifier === organIdentifier
    );
    if (!organ) {
      return res.status(404).json({
        success: false,
        message: `Organ with identifier '${organIdentifier}' not found on this donor.`
      });
    }

    // Quick viability pre‑check (no travel time — worst-case 0 minutes)
    const viabilityCheck = checkOrganViability(organ, 0);
    if (!viabilityCheck.isViable) {
      return res.status(422).json({
        success: false,
        message: `Organ is no longer viable: ${viabilityCheck.reason}`,
        viabilityStatus: viabilityCheck.viabilityStatus
      });
    }

    // ── 3. Load waiting recipients for matching organ type ─────────────────
    const recipients = await OrganRecipient.find({
      organType: organ.organType,
      status: 'Waiting'
    }).lean();

    // ── 4. Run matching engine ─────────────────────────────────────────────
    const { topCandidate, eligibleCandidates, ineligibleCandidates } =
      findBestOrganMatch(organ, donor, recipients);

    // ── 5. Build response ──────────────────────────────────────────────────
    const bestCandidate = topCandidate
      ? {
          recipient: topCandidate.recipient,
          priorityScore: topCandidate.matchEvaluation.priorityScore,
          scoreBreakdown: topCandidate.matchEvaluation.scoreBreakdown,
          compatibilityResult: topCandidate.matchEvaluation.compatibilityResult,
          logistics: topCandidate.matchEvaluation.logistics
        }
      : null;

    const ineligibleSummary = ineligibleCandidates.map((item) => ({
      recipientId: item.recipient._id,
      patientName: item.recipient.patientName,
      exclusionReasons: item.matchEvaluation.exclusionReasons
    }));

    return res.status(200).json({
      success: true,
      academicDisclaimer:
        'This result is an academic demonstration recommendation only. ' +
        'It does not constitute a clinical allocation decision.',
      donorId: donor._id,
      organIdentifier,
      organType: organ.organType,
      organStatus: organ.organStatus,
      viability: {
        viabilityStatus: viabilityCheck.viabilityStatus,
        remainingViabilityMinutes: viabilityCheck.remainingViabilityMinutes,
        expiryTimestamp: viabilityCheck.expiryTimestamp
      },
      matchingSummary: {
        totalEvaluated: recipients.length,
        totalEligible: eligibleCandidates.length,
        totalIneligible: ineligibleCandidates.length
      },
      bestCandidate,
      ineligibleCandidates: ineligibleSummary
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

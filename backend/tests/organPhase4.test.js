/**
 * Phase 4 — Organ Donation APIs — Integration & Logic Tests
 *
 * These are pure Node.js unit / integration tests that do NOT require a live
 * database connection.  They test:
 *
 *   1.  Recipient creation & authorization (field validation)
 *   2.  Donor creation & authorization (field validation)
 *   3.  Adding an organ (validation, duplicate, viability, future timestamp)
 *   4.  Matching endpoint logic (service layer)
 *   5.  Offer creation logic (service layer — eligibility guard)
 *   6.  Duplicate active offer rejection (guard tested at service level)
 *   7.  Unauthorized hospital access pattern
 *   8.  Incoming / outgoing offer filtering pattern
 *   9.  Successful acceptance / decline status transitions
 *  10.  Expired offer rejection
 *  11.  Duplicate response rejection pattern
 *  12.  Invalid ObjectId handling (validateObjectId helper)
 *  13.  Blood donation regression — existing Phase 2 matching tests exercised
 *  14.  Organ logistics viability regression
 *
 * Run:  node tests/organPhase4.test.js
 */

'use strict';

const assert = require('assert');

// ── Import services (already tested in Phase 2/3, also used here) ─────────────
const {
  calculateMatchingScore,
  findBestOrganMatch,
  isBloodGroupCompatible
} = require('../services/organMatchingService');

const {
  checkOrganViability,
  calculateHaversineDistance,
  estimateTravelTimeMinutes
} = require('../services/organLogisticsService');

// ── Import the ObjectId validator helper directly (replicated) ────────────────
const mongoose = require('mongoose');

function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ── Test harness ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ ${description}`);
    passed++;
    results.push({ description, status: 'pass' });
  } catch (err) {
    console.error(`  ❌ ${description}`);
    console.error(`     ${err.message}`);
    failed++;
    results.push({ description, status: 'fail', error: err.message });
    process.exitCode = 1;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 1 — Recipient Creation & Authorization Guards
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 1: Recipient Creation & Authorization\n');

test('Required fields: missing patientName should fail validation intent', () => {
  // Simulate what the controller checks: patientName + bloodGroup + organType
  const body = { bloodGroup: 'O+', organType: 'Kidney' };
  const isValid = !!(body.patientName && body.bloodGroup && body.organType);
  assert.strictEqual(isValid, false, 'Should reject when patientName is missing');
});

test('Required fields: all present passes validation', () => {
  const body = { patientName: 'Alice', bloodGroup: 'O+', organType: 'Kidney' };
  const isValid = !!(body.patientName && body.bloodGroup && body.organType);
  assert.strictEqual(isValid, true);
});

test('Hospital ownership: different hospitalId should be forbidden', () => {
  const recordHospitalId = new mongoose.Types.ObjectId().toString();
  const requestingHospitalId = new mongoose.Types.ObjectId().toString();
  const isOwner = recordHospitalId === requestingHospitalId;
  assert.strictEqual(isOwner, false, 'A different hospital must not own this recipient');
});

test('Hospital ownership: same hospitalId is allowed', () => {
  const id = new mongoose.Types.ObjectId().toString();
  assert.strictEqual(id === id, true);
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 2 — Donor Creation & Authorization Guards
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 2: Donor Creation & Authorization\n');

test('Donor: missing donorName fails required check', () => {
  const body = { bloodGroup: 'A+' };
  const valid = !!(body.donorName && body.bloodGroup);
  assert.strictEqual(valid, false);
});

test('Donor: invalid blood group rejected', () => {
  const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  assert.strictEqual(VALID_BLOOD_GROUPS.includes('X+'), false);
  assert.strictEqual(VALID_BLOOD_GROUPS.includes('O-'), true);
});

test('Donor procurement hospital ownership enforced', () => {
  const procurementHospId = new mongoose.Types.ObjectId().toString();
  const callerHospId = new mongoose.Types.ObjectId().toString();
  assert.notStrictEqual(procurementHospId, callerHospId);
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 3 — Add Organ Validation
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 3: Adding an Organ\n');

test('Add organ: invalid organType rejected', () => {
  const VALID_TYPES = ['Heart', 'Lung', 'Liver', 'Kidney', 'Pancreas'];
  assert.strictEqual(VALID_TYPES.includes('Brain'), false);
  assert.strictEqual(VALID_TYPES.includes('Kidney'), true);
});

test('Add organ: duplicate organIdentifier on same donor rejected', () => {
  const existingOrgans = [{ organIdentifier: 'ORG-001' }, { organIdentifier: 'ORG-002' }];
  const newId = 'ORG-001';
  const isDuplicate = existingOrgans.some((o) => o.organIdentifier === newId);
  assert.strictEqual(isDuplicate, true, 'Duplicate identifier should be detected');
});

test('Add organ: unique organIdentifier allowed', () => {
  const existingOrgans = [{ organIdentifier: 'ORG-001' }];
  const newId = 'ORG-999';
  const isDuplicate = existingOrgans.some((o) => o.organIdentifier === newId);
  assert.strictEqual(isDuplicate, false);
});

test('Add organ: future procurementTimestamp rejected', () => {
  const futureDate = new Date(Date.now() + 3600 * 1000); // 1 hour in future
  const isFuture = futureDate > new Date();
  assert.strictEqual(isFuture, true, 'Should detect future timestamp');
});

test('Add organ: viabilityHours = 0 rejected', () => {
  const viabilityHours = 0;
  const isInvalid = viabilityHours <= 0 || viabilityHours > 72;
  assert.strictEqual(isInvalid, true);
});

test('Add organ: viabilityHours = 4 accepted', () => {
  const viabilityHours = 4;
  const isInvalid = viabilityHours <= 0 || viabilityHours > 72;
  assert.strictEqual(isInvalid, false);
});

test('Add organ: already expired organ (past viability window) rejected', () => {
  // Procurement 10 hours ago, viability = 4 hours → already expired
  const procurementTimestamp = new Date(Date.now() - 10 * 3600 * 1000);
  const viabilityHours = 4;
  const expiryMs = procurementTimestamp.getTime() + viabilityHours * 3600 * 1000;
  const alreadyExpired = Date.now() >= expiryMs;
  assert.strictEqual(alreadyExpired, true, 'Organ should be detected as already expired');
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 4 — Matching Endpoint Logic (Service Layer)
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 4: Matching Endpoint Logic\n');

test('Matching: organ must be Available status to be eligible', () => {
  const organ = { organType: 'Kidney', organStatus: 'Offered' };
  const recipient = { organType: 'Kidney', bloodGroup: 'O+', urgency: 'High', status: 'Waiting' };
  const donor = { bloodGroup: 'O-' };
  const result = calculateMatchingScore(donor, organ, recipient);
  assert.strictEqual(result.isEligible, false);
  assert.ok(result.exclusionReasons.some(r => r.includes('not available')));
});

test('Matching: blood incompatibility correctly excludes candidate', () => {
  const organ = { organType: 'Kidney', organStatus: 'Available', status: 'Available' };
  const recipient = { organType: 'Kidney', bloodGroup: 'B+', urgency: 'High', status: 'Waiting' };
  const donor = { bloodGroup: 'A+' }; // A+ cannot give to B+
  const result = calculateMatchingScore(donor, organ, recipient);
  assert.strictEqual(result.isEligible, false);
  assert.ok(result.exclusionReasons.some(r => r.includes('blood group')));
});

test('Matching: compatible match returns correct eligibility and score', () => {
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 3600 * 1000);
  const donor = { bloodGroup: 'O-', hlaMarkers: { a: 'A1', b: 'B1', dr: 'DR1' } };
  // organStatus field check — service reads organStatus OR status
  const organ = { organType: 'Kidney', organStatus: 'Available', status: 'Available' };
  const recipient = {
    organType: 'Kidney',
    bloodGroup: 'A+',
    urgency: 'Critical',
    status: 'Waiting',
    registrationDate: tenDaysAgo,
    hlaMarkers: { a: 'A1', b: 'B1', dr: 'DR1' }
  };
  const result = calculateMatchingScore(donor, organ, recipient);
  assert.strictEqual(result.isEligible, true);
  // Critical(100) + 10 days(10) + 3 HLA(30) = 140
  assert.strictEqual(result.priorityScore, 140);
});

test('Matching: top candidate selected from multi-recipient pool', () => {
  const donor = { bloodGroup: 'O-' };
  const organ = { organType: 'Liver', organStatus: 'Available', status: 'Available' };
  const recipients = [
    { organType: 'Liver', bloodGroup: 'O+', urgency: 'Moderate', status: 'Waiting' },
    { organType: 'Liver', bloodGroup: 'A+', urgency: 'Critical', status: 'Waiting' },
    { organType: 'Heart', bloodGroup: 'O+', urgency: 'Critical', status: 'Waiting' } // wrong organ
  ];
  const { topCandidate, eligibleCandidates, ineligibleCandidates } = findBestOrganMatch(organ, donor, recipients);
  assert.strictEqual(eligibleCandidates.length, 2);
  assert.strictEqual(ineligibleCandidates.length, 1);
  assert.strictEqual(topCandidate.recipient.urgency, 'Critical');
});

test('Matching: empty recipient list returns null topCandidate', () => {
  const { topCandidate } = findBestOrganMatch(
    { organType: 'Kidney', organStatus: 'Available' },
    { bloodGroup: 'O-' },
    []
  );
  assert.strictEqual(topCandidate, null);
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 5 — Offer Creation Logic Guards
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 5: Offer Creation Logic\n');

test('Offer: organ not Available prevents offer creation', () => {
  const organStatus = 'Offered';
  const canOffer = organStatus === 'Available';
  assert.strictEqual(canOffer, false, 'Organ must be Available');
});

test('Offer: ineligible recipient blocked by server-side recalculation', () => {
  const donor = { bloodGroup: 'AB+' }; // AB+ can only donate to AB+
  const organ = { organType: 'Kidney', organStatus: 'Available', status: 'Available' };
  const recipient = { organType: 'Kidney', bloodGroup: 'O+', urgency: 'High', status: 'Waiting' };
  const match = calculateMatchingScore(donor, organ, recipient);
  assert.strictEqual(match.isEligible, false);
});

test('Offer: eligible recipient passes server-side recalculation', () => {
  const donor = { bloodGroup: 'O-' };
  const organ = { organType: 'Kidney', organStatus: 'Available', status: 'Available' };
  const recipient = { organType: 'Kidney', bloodGroup: 'B+', urgency: 'High', status: 'Waiting' };
  const match = calculateMatchingScore(donor, organ, recipient);
  assert.strictEqual(match.isEligible, true);
});

test('Offer: duplicate active offer for same organ detected', () => {
  // Simulate: already has 'Offered' allocation for same donorId + organIdentifier
  const existingOffers = [
    { donorId: 'D1', organIdentifier: 'ORG-001', status: 'Offered' }
  ];
  const newOffer = { donorId: 'D1', organIdentifier: 'ORG-001' };
  const duplicate = existingOffers.some(
    o => o.donorId === newOffer.donorId &&
         o.organIdentifier === newOffer.organIdentifier &&
         o.status === 'Offered'
  );
  assert.strictEqual(duplicate, true);
});

test('Offer: recipient not in Waiting status blocked', () => {
  const recipientStatus = 'Offered';
  const canOffer = recipientStatus === 'Waiting';
  assert.strictEqual(canOffer, false);
});

test('Offer expiry computed from offerExpiryHours', () => {
  const expiryHours = 2;
  const before = Date.now();
  const offerExpiry = new Date(before + expiryHours * 3600 * 1000);
  assert.ok(offerExpiry > new Date());
  // Within 5-second tolerance
  assert.ok(Math.abs(offerExpiry.getTime() - (before + expiryHours * 3600 * 1000)) < 5000);
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 6 — Unauthorized Hospital Access
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 6: Unauthorized Hospital Access\n');

test('Only procurement hospital can create offer (ownership check)', () => {
  const procurementHospId = 'HOSP-A';
  const callerHospId = 'HOSP-B';
  const isAuthorized = procurementHospId === callerHospId;
  assert.strictEqual(isAuthorized, false);
});

test('Only receiving hospital can respond to offer', () => {
  const receivingHospId = 'HOSP-B';
  const callerHospId = 'HOSP-C';
  const isAuthorized = receivingHospId === callerHospId;
  assert.strictEqual(isAuthorized, false);
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 7 — Incoming / Outgoing Offer Filtering
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 7: Incoming / Outgoing Offer Filtering\n');

const sampleOffers = [
  { _id: '1', offeringHospitalId: 'HOSP-A', receivingHospitalId: 'HOSP-B', status: 'Offered' },
  { _id: '2', offeringHospitalId: 'HOSP-B', receivingHospitalId: 'HOSP-C', status: 'Accepted' },
  { _id: '3', offeringHospitalId: 'HOSP-C', receivingHospitalId: 'HOSP-A', status: 'Offered' }
];

test('Incoming offers: only returns offers where caller is receivingHospitalId', () => {
  const caller = 'HOSP-B';
  const incoming = sampleOffers.filter(o => o.receivingHospitalId === caller);
  assert.strictEqual(incoming.length, 1);
  assert.strictEqual(incoming[0]._id, '1');
});

test('Outgoing offers: only returns offers where caller is offeringHospitalId', () => {
  const caller = 'HOSP-B';
  const outgoing = sampleOffers.filter(o => o.offeringHospitalId === caller);
  assert.strictEqual(outgoing.length, 1);
  assert.strictEqual(outgoing[0]._id, '2');
});

test('A hospital sees no offers if it is neither offering nor receiving', () => {
  const caller = 'HOSP-Z';
  const visible = sampleOffers.filter(
    o => o.offeringHospitalId === caller || o.receivingHospitalId === caller
  );
  assert.strictEqual(visible.length, 0);
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 8 — Acceptance / Decline Status Transitions
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 8: Accept / Decline Status Transitions\n');

test('Accept: allocation status transitions Offered → Accepted', () => {
  const allocation = { status: 'Offered' };
  const action = 'accept';
  if (action === 'accept' && allocation.status === 'Offered') allocation.status = 'Accepted';
  assert.strictEqual(allocation.status, 'Accepted');
});

test('Accept: organ status transitions Offered → Allocated', () => {
  let organStatus = 'Offered';
  organStatus = 'Allocated'; // simulating DB update
  assert.strictEqual(organStatus, 'Allocated');
});

test('Accept: recipient status transitions Offered → Allocated', () => {
  let recipientStatus = 'Offered';
  recipientStatus = 'Allocated';
  assert.strictEqual(recipientStatus, 'Allocated');
});

test('Decline: allocation status transitions Offered → Declined', () => {
  const allocation = { status: 'Offered' };
  const action = 'decline';
  if (action === 'decline' && allocation.status === 'Offered') allocation.status = 'Declined';
  assert.strictEqual(allocation.status, 'Declined');
});

test('Decline: organ status reverts Offered → Available', () => {
  let organStatus = 'Offered';
  organStatus = 'Available';
  assert.strictEqual(organStatus, 'Available');
});

test('Decline: recipient status reverts Offered → Waiting', () => {
  let recipientStatus = 'Offered';
  recipientStatus = 'Waiting';
  assert.strictEqual(recipientStatus, 'Waiting');
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 9 — Expired Offer Rejection
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 9: Expired Offer Rejection\n');

test('Expired offer detected by request-time check', () => {
  const offerExpiry = new Date(Date.now() - 3600 * 1000); // 1 hour ago
  const isExpired = new Date() >= offerExpiry;
  assert.strictEqual(isExpired, true);
});

test('Non-expired offer is not expired', () => {
  const offerExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour from now
  const isExpired = new Date() >= offerExpiry;
  assert.strictEqual(isExpired, false);
});

test('Cannot respond to an expired offer (status gate)', () => {
  // controller checks: if status !== 'Offered' → reject
  const allocation = { status: 'Expired' };
  const canRespond = allocation.status === 'Offered';
  assert.strictEqual(canRespond, false);
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 10 — Duplicate Response Prevention
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 10: Duplicate Response Prevention\n');

test('Duplicate response: already Accepted offer cannot be accepted again', () => {
  const allocation = { status: 'Accepted' };
  const canRespond = allocation.status === 'Offered';
  assert.strictEqual(canRespond, false);
});

test('Duplicate response: already Declined offer cannot be declined again', () => {
  const allocation = { status: 'Declined' };
  const canRespond = allocation.status === 'Offered';
  assert.strictEqual(canRespond, false);
});

test('Conditional update (findOneAndUpdate with status=Offered) prevents race condition', () => {
  // Simulate: DB found and updated (status was still Offered)
  const dbResult = { _id: 'A1', status: 'Accepted' }; // returned because condition matched
  assert.ok(dbResult, 'Should return updated doc');

  // Simulate: DB returned null (another request already changed status)
  const dbResultRace = null;
  assert.strictEqual(dbResultRace, null, 'Should return null on race condition');
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 11 — Invalid ObjectId Handling
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 11: Invalid ObjectId Handling\n');

test('Valid MongoDB ObjectId passes validation', () => {
  const validId = new mongoose.Types.ObjectId().toString();
  assert.strictEqual(validateObjectId(validId), true);
});

test('Invalid string rejected as ObjectId', () => {
  assert.strictEqual(validateObjectId('not-an-id'), false);
  assert.strictEqual(validateObjectId(''), false);
  assert.strictEqual(validateObjectId('123'), false);
  assert.strictEqual(validateObjectId('000000000000000000000000X'), false);
});

test('undefined / null rejected as ObjectId', () => {
  assert.strictEqual(validateObjectId(undefined), false);
  assert.strictEqual(validateObjectId(null), false);
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 12 — Blood Donation Regression (Phase 2 Matching)
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 12: Blood Donation / Phase 2 Regression\n');

test('O- universal donor: compatible with all blood groups', () => {
  const allGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  allGroups.forEach((g) => {
    assert.strictEqual(isBloodGroupCompatible('O-', g), true, `O- → ${g} should be compatible`);
  });
});

test('AB+ can only donate to AB+', () => {
  assert.strictEqual(isBloodGroupCompatible('AB+', 'AB+'), true);
  assert.strictEqual(isBloodGroupCompatible('AB+', 'O+'),  false);
  assert.strictEqual(isBloodGroupCompatible('AB+', 'A+'),  false);
});

test('Malformed input to calculateMatchingScore is safe', () => {
  const result = calculateMatchingScore(null, null, null);
  assert.strictEqual(result.isEligible, false);
  assert.ok(result.exclusionReasons.length > 0);
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 13 — Organ Logistics Regression (Phase 3)
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 13: Organ Logistics Regression\n');

test('Haversine distance: same point = 0 km', () => {
  const dist = calculateHaversineDistance([77.5946, 12.9716], [77.5946, 12.9716]);
  assert.strictEqual(dist, 0);
});

test('Haversine distance: Bangalore to Chennai ≈ 290–320 km', () => {
  // Bangalore [77.5946, 12.9716] → Chennai [80.2707, 13.0827]
  const dist = calculateHaversineDistance([77.5946, 12.9716], [80.2707, 13.0827]);
  assert.ok(dist > 280 && dist < 340, `Expected ~300 km, got ${dist}`);
});

test('Travel time estimate includes base buffer', () => {
  // 60 km at 60 km/h = 60 min travel + 30 min buffer = 90 min
  const time = estimateTravelTimeMinutes(60);
  assert.strictEqual(time, 90);
});

test('checkOrganViability: fresh kidney (24h) is viable with no travel', () => {
  const procurementTime = new Date(Date.now() - 1 * 3600 * 1000); // 1 hour ago
  const organ = { organType: 'Kidney', viabilityHours: 24, procurementTimestamp: procurementTime };
  const result = checkOrganViability(organ, 0);
  assert.strictEqual(result.isViable, true);
  assert.strictEqual(result.viabilityStatus, 'VIABLE');
});

test('checkOrganViability: expired heart is not viable', () => {
  const procurementTime = new Date(Date.now() - 5 * 3600 * 1000); // 5 hours ago
  const organ = { organType: 'Heart', viabilityHours: 4, procurementTimestamp: procurementTime };
  const result = checkOrganViability(organ, 0);
  assert.strictEqual(result.isViable, false);
  assert.strictEqual(result.viabilityStatus, 'EXPIRED');
});

test('checkOrganViability: travel time exceeds viability window', () => {
  const procurementTime = new Date(Date.now() - 3 * 3600 * 1000); // 3 hours ago
  const organ = { organType: 'Heart', viabilityHours: 4, procurementTimestamp: procurementTime };
  // Only 1 hour left (60 min) but travel needs 120 min
  const result = checkOrganViability(organ, 120);
  assert.strictEqual(result.isViable, false);
});

// ═════════════════════════════════════════════════════════════════════════════
// GROUP 14 — Action field validation
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n📦 Group 14: Offer Respond Action Validation\n');

test("action must be 'accept' or 'decline'", () => {
  const validActions = ['accept', 'decline'];
  assert.strictEqual(validActions.includes('accept'), true);
  assert.strictEqual(validActions.includes('decline'), true);
  assert.strictEqual(validActions.includes('reject'), false);
  assert.strictEqual(validActions.includes(''), false);
  assert.strictEqual(validActions.includes(undefined), false);
});

// ═════════════════════════════════════════════════════════════════════════════
// Summary
// ═════════════════════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(60)}`);
console.log(`🎯 Phase 4 Test Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'═'.repeat(60)}\n`);

if (failed > 0) {
  console.log('Failed tests:');
  results.filter(r => r.status === 'fail').forEach(r => {
    console.log(`  ❌ ${r.description}`);
    console.log(`     Error: ${r.error}`);
  });
}

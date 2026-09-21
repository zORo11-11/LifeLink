const assert = require('assert');
const {
  isBloodGroupCompatible,
  calculateWaitingDays,
  calculateOrganPriority,
  calculateHlaMatchScore,
  calculateMatchingScore,
  findBestOrganMatch,
  BLOOD_COMPATIBILITY_MAP
} = require('../services/organMatchingService');

console.log('🧪 Starting Phase 2 Organ Matching Engine Unit Tests...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(description, testFn) {
  totalTests++;
  try {
    testFn();
    passedTests++;
    console.log(`  ✅ Passed: ${description}`);
  } catch (error) {
    console.error(`  ❌ Failed: ${description}`);
    console.error(`     Error: ${error.message}`);
    process.exitCode = 1;
  }
}

// 1. Blood Group Compatibility Tests
runTest('All ABO/Rh Blood Group Compatibility Cases', () => {
  // O- Universal Donor
  const allGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  allGroups.forEach(g => {
    assert.strictEqual(isBloodGroupCompatible('O-', g), true, `O- should donate to ${g}`);
  });

  // O+ Donates only to positive
  assert.strictEqual(isBloodGroupCompatible('O+', 'O+'), true);
  assert.strictEqual(isBloodGroupCompatible('O+', 'A+'), true);
  assert.strictEqual(isBloodGroupCompatible('O+', 'O-'), false);

  // A- Donates to A-, A+, AB-, AB+
  assert.strictEqual(isBloodGroupCompatible('A-', 'A-'), true);
  assert.strictEqual(isBloodGroupCompatible('A-', 'AB+'), true);
  assert.strictEqual(isBloodGroupCompatible('A-', 'B+'), false);

  // A+ Donates to A+, AB+
  assert.strictEqual(isBloodGroupCompatible('A+', 'A+'), true);
  assert.strictEqual(isBloodGroupCompatible('A+', 'AB+'), true);
  assert.strictEqual(isBloodGroupCompatible('A+', 'A-'), false);

  // B- Donates to B-, B+, AB-, AB+
  assert.strictEqual(isBloodGroupCompatible('B-', 'B+'), true);
  assert.strictEqual(isBloodGroupCompatible('B-', 'A+'), false);

  // B+ Donates to B+, AB+
  assert.strictEqual(isBloodGroupCompatible('B+', 'B+'), true);
  assert.strictEqual(isBloodGroupCompatible('B+', 'AB+'), true);
  assert.strictEqual(isBloodGroupCompatible('B+', 'O+'), false);

  // AB- Donates to AB-, AB+
  assert.strictEqual(isBloodGroupCompatible('AB-', 'AB-'), true);
  assert.strictEqual(isBloodGroupCompatible('AB-', 'AB+'), true);
  assert.strictEqual(isBloodGroupCompatible('AB-', 'A+'), false);

  // AB+ Universal Recipient only donates to AB+
  assert.strictEqual(isBloodGroupCompatible('AB+', 'AB+'), true);
  assert.strictEqual(isBloodGroupCompatible('AB+', 'O+'), false);
});

// 2. Incompatible Blood Group Tests
runTest('Incompatible blood groups reject matching', () => {
  assert.strictEqual(isBloodGroupCompatible('A+', 'O-'), false);
  assert.strictEqual(isBloodGroupCompatible('B+', 'A+'), false);
  assert.strictEqual(isBloodGroupCompatible('AB+', 'B+'), false);
});

// 3. Mismatched Organ Types
runTest('Mismatched organ types marked as ineligible with clear reason', () => {
  const donor = { bloodGroup: 'O-' };
  const organ = { organType: 'Kidney', status: 'Available' };
  const recipient = { organType: 'Heart', bloodGroup: 'O+', urgency: 'High', status: 'Waiting' };

  const evalResult = calculateMatchingScore(donor, organ, recipient);
  assert.strictEqual(evalResult.isEligible, false);
  assert.strictEqual(evalResult.compatibilityResult.organTypeMatch, false);
  assert.ok(evalResult.exclusionReasons.some(r => r.includes('Organ type mismatch')));
});

// 4. Unavailable or Expired Organs
runTest('Unavailable or non-active organ status rejected', () => {
  const donor = { bloodGroup: 'O-' };
  const organ = { organType: 'Kidney', status: 'Allocated' };
  const recipient = { organType: 'Kidney', bloodGroup: 'O+', urgency: 'High', status: 'Waiting' };

  const evalResult = calculateMatchingScore(donor, organ, recipient);
  assert.strictEqual(evalResult.isEligible, false);
  assert.strictEqual(evalResult.compatibilityResult.organStatusValid, false);
  assert.ok(evalResult.exclusionReasons.some(r => r.includes('Organ is not available')));
});

// 5. Urgency Score Calculation
runTest('Urgency score mapping (Critical: 100, High: 60, Moderate: 30)', () => {
  assert.strictEqual(calculateOrganPriority({ urgency: 'Critical' }), 100);
  assert.strictEqual(calculateOrganPriority({ urgency: 'High' }), 60);
  assert.strictEqual(calculateOrganPriority({ urgency: 'Moderate' }), 30);
  assert.strictEqual(calculateOrganPriority({}), 30); // Default Moderate
});

// 6. Waiting Days Calculation
runTest('Waiting days calculated and capped at 30', () => {
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  assert.strictEqual(calculateWaitingDays(tenDaysAgo), 10);

  const fiftyDaysAgo = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000);
  assert.strictEqual(calculateWaitingDays(fiftyDaysAgo), 50);

  const eval10 = calculateMatchingScore(
    { bloodGroup: 'O-' },
    { organType: 'Kidney', status: 'Available' },
    { organType: 'Kidney', bloodGroup: 'O+', urgency: 'Moderate', registrationDate: tenDaysAgo, status: 'Waiting' }
  );
  assert.strictEqual(eval10.scoreBreakdown.waitingDaysScore, 10);

  const eval50 = calculateMatchingScore(
    { bloodGroup: 'O-' },
    { organType: 'Kidney', status: 'Available' },
    { organType: 'Kidney', bloodGroup: 'O+', urgency: 'Moderate', registrationDate: fiftyDaysAgo, status: 'Waiting' }
  );
  assert.strictEqual(eval50.scoreBreakdown.waitingDaysScore, 30); // Capped at 30
});

// 7. Missing HLA Data Handling
runTest('Missing HLA data safely handled without error', () => {
  const hlaMatch = calculateHlaMatchScore(undefined, { a: 'A1' });
  assert.strictEqual(hlaMatch.score, 0);
  assert.strictEqual(hlaMatch.matches, 0);

  const hlaMatchEmpty = calculateHlaMatchScore({}, {});
  assert.strictEqual(hlaMatchEmpty.score, 0);
});

// 8. HLA Matching Calculation
runTest('HLA matching scores 10 points per matching locus (A, B, DR)', () => {
  const donorHla = { a: 'A2', b: 'B7', dr: 'DR4' };
  const recipientHla = { a: 'A2', b: 'B8', dr: 'DR4' }; // 2 loci match (A2, DR4)

  const matchRes = calculateHlaMatchScore(donorHla, recipientHla);
  assert.strictEqual(matchRes.matches, 2);
  assert.strictEqual(matchRes.score, 20);
});

// 9. Final Score Calculation
runTest('Final priority score calculation equals sum of components', () => {
  const donor = { bloodGroup: 'O-', hlaMarkers: { a: 'A1', b: 'B1', dr: 'DR1' } };
  const organ = { organType: 'Kidney', status: 'Available' };

  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const recipient = {
    organType: 'Kidney',
    bloodGroup: 'O+',
    urgency: 'High', // 60
    registrationDate: tenDaysAgo, // 10
    hlaMarkers: { a: 'A1', b: 'B1', dr: 'DR1' }, // 30
    status: 'Waiting'
  };

  const evalRes = calculateMatchingScore(donor, organ, recipient);
  assert.strictEqual(evalRes.isEligible, true);
  assert.strictEqual(evalRes.scoreBreakdown.baseUrgencyScore, 60);
  assert.strictEqual(evalRes.scoreBreakdown.waitingDaysScore, 10);
  assert.strictEqual(evalRes.scoreBreakdown.hlaMatchScore, 30);
  assert.strictEqual(evalRes.priorityScore, 100);
});

// 10. Selecting Highest-Scoring Recipient
runTest('findBestOrganMatch ranks eligible candidates by priority score', () => {
  const donor = { bloodGroup: 'O-' };
  const organ = { organType: 'Kidney', status: 'Available' };

  const r1 = { name: 'Rec1', organType: 'Kidney', bloodGroup: 'A+', urgency: 'Moderate', status: 'Waiting' }; // 30
  const r2 = { name: 'Rec2', organType: 'Kidney', bloodGroup: 'O+', urgency: 'Critical', status: 'Waiting' }; // 100
  const r3 = { name: 'Rec3', organType: 'Heart', bloodGroup: 'O+', urgency: 'Critical', status: 'Waiting' }; // Ineligible organ mismatch

  const result = findBestOrganMatch(organ, donor, [r1, r2, r3]);

  assert.strictEqual(result.eligibleCandidates.length, 2);
  assert.strictEqual(result.ineligibleCandidates.length, 1);
  assert.strictEqual(result.topCandidate.recipient.name, 'Rec2');
  assert.strictEqual(result.topCandidate.matchEvaluation.priorityScore, 100);
});

// 11. Empty Recipient List Handling
runTest('Empty recipient list returns null topCandidate gracefully', () => {
  const result = findBestOrganMatch({ organType: 'Kidney' }, { bloodGroup: 'O-' }, []);
  assert.strictEqual(result.topCandidate, null);
  assert.deepStrictEqual(result.eligibleCandidates, []);
});

// 12. Malformed or Incomplete Input Handling
runTest('Malformed or missing input returns safe fallback without crashing', () => {
  const evalNull = calculateMatchingScore(null, null, null);
  assert.strictEqual(evalNull.isEligible, false);
  assert.ok(evalNull.exclusionReasons.length > 0);

  assert.strictEqual(isBloodGroupCompatible('', null), false);
  assert.strictEqual(calculateWaitingDays('invalid-date-string'), 0);
});

console.log(`\n🎉 Summary: ${passedTests}/${totalTests} unit tests passed successfully!\n`);

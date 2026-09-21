const assert = require('assert');
const {
  isValidCoordinate,
  calculateHaversineDistance,
  estimateTravelTimeMinutes,
  checkOrganViability,
  LOGISTICS_CONFIG
} = require('../services/organLogisticsService');
const { calculateMatchingScore } = require('../services/organMatchingService');

console.log('🧪 Starting Phase 3 Organ Logistics Engine Unit Tests...\n');

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
    console.error(`     Error: ${error.stack}`);
    process.exitCode = 1;
  }
}

// 1. Coordinate Validation Tests
runTest('Validates GeoJSON coordinates safely', () => {
  assert.strictEqual(isValidCoordinate([77.5946, 12.9716]), true);
  assert.strictEqual(isValidCoordinate([-122.4194, 37.7749]), true);
  
  assert.strictEqual(isValidCoordinate([]), false);
  assert.strictEqual(isValidCoordinate([77.5946]), false);
  assert.strictEqual(isValidCoordinate(['77', '12']), false);
  assert.strictEqual(isValidCoordinate(null), false);
  assert.strictEqual(isValidCoordinate([-200, 12.9716]), false); // Invalid long
  assert.strictEqual(isValidCoordinate([77.5946, 100]), false); // Invalid lat
});

// 2. Haversine Distance Tests
runTest('Calculates Haversine distance correctly', () => {
  // New York (JFK) to London (LHR) ~ 5540 km
  const jfk = [-73.7781, 40.6413];
  const lhr = [-0.4543, 51.4700];
  const dist = calculateHaversineDistance(jfk, lhr);
  assert.ok(dist >= 5530 && dist <= 5560, `Distance ${dist} out of expected range`);

  // Identical coordinates should be 0
  assert.strictEqual(calculateHaversineDistance(jfk, jfk), 0);

  // Missing coordinates should return null
  assert.strictEqual(calculateHaversineDistance(jfk, null), null);
});

// 3. Travel Time Estimation
runTest('Estimates travel time including base buffer', () => {
  // 60 km at 60 km/h = 1 hour (60 mins) + 30 mins buffer = 90 mins
  assert.strictEqual(estimateTravelTimeMinutes(60), 90);
  
  // 0 km = 30 mins buffer
  assert.strictEqual(estimateTravelTimeMinutes(0), 30);
  
  assert.strictEqual(estimateTravelTimeMinutes(null), null);
  assert.strictEqual(estimateTravelTimeMinutes(-10), null);
});

// 4. Organ Viability Tests
runTest('Checks organ viability based on procurement time and travel', () => {
  const nowMs = Date.now();
  
  // Fresh organ, no travel (viable)
  const freshOrgan = { organType: 'Kidney', procurementTimestamp: new Date(nowMs) };
  const res1 = checkOrganViability(freshOrgan, 0);
  assert.strictEqual(res1.isViable, true);
  assert.strictEqual(res1.viabilityStatus, 'VIABLE');

  // Expired organ (not viable)
  // Procured 25 hours ago, kidney lives for 24 hours
  const expiredMs = nowMs - (25 * 60 * 60 * 1000);
  const expiredOrgan = { organType: 'Kidney', procurementTimestamp: new Date(expiredMs) };
  const res2 = checkOrganViability(expiredOrgan, 0);
  assert.strictEqual(res2.isViable, false);
  assert.strictEqual(res2.viabilityStatus, 'EXPIRED');

  // Valid organ but travel time kills it
  // Heart lives 4 hours (240 mins). Procured 2 hours ago (120 mins remaining). Travel time 3 hours (180 mins).
  const twoHoursAgoMs = nowMs - (2 * 60 * 60 * 1000);
  const travelHeart = { organType: 'Heart', procurementTimestamp: new Date(twoHoursAgoMs) };
  const res3 = checkOrganViability(travelHeart, 180);
  assert.strictEqual(res3.isViable, false);
  assert.strictEqual(res3.viabilityStatus, 'TRAVEL_TIME_EXCEEDS_VIABILITY');
  
  // Missing or invalid organ types
  assert.strictEqual(checkOrganViability({}).isViable, false);
  assert.strictEqual(checkOrganViability({ organType: 'Brain' }).isViable, false); // Unknown
});

runTest('Handles missing procurement timestamp by falling back safely', () => {
  const blankOrgan = { organType: 'Liver' }; // No procurementTimestamp
  const res = checkOrganViability(blankOrgan, 0);
  assert.strictEqual(res.isViable, true); // It defaults to Date.now() if missing
});

runTest('Rejects zero or negative viability hours', () => {
  const organ = { organType: 'Heart', viabilityHours: 0, procurementTimestamp: new Date() };
  const res = checkOrganViability(organ, 0);
  assert.strictEqual(res.isViable, false);
  assert.ok(res.reason.includes('positive'));
});

// 5. Matching Service Integration
runTest('Integrates logistics checks into matching score rejection correctly', () => {
  const donor = { 
    bloodGroup: 'O-',
    location: { coordinates: [-73.7781, 40.6413] }
  };
  
  // Heart (4h limit), procured 3 hours ago -> 1 hour left
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const organ = { organType: 'Heart', status: 'Available', procurementTimestamp: threeHoursAgo };
  
  const recipient = { 
    organType: 'Heart', 
    bloodGroup: 'O+', 
    urgency: 'High', 
    status: 'Waiting',
    location: { coordinates: [-0.4543, 51.4700] } // NYC to LHR is ~ 5540km -> ~92 hours travel
  };

  const evalResult = calculateMatchingScore(donor, organ, recipient);
  
  assert.strictEqual(evalResult.isEligible, false); // Failed viablility check due to travel time
  assert.strictEqual(evalResult.compatibilityResult.logisticsViable, false);
  assert.ok(evalResult.exclusionReasons.some(r => r.includes('Viability failure')));
  
  // Verify distance and travel time populated correctly
  assert.ok(evalResult.logistics.distanceKm > 5000);
  assert.ok(evalResult.logistics.travelTimeMinutes > 5000);
});

runTest('Matching service allows match if location data is missing (graceful degradation)', () => {
  const donor = { bloodGroup: 'O-' }; // No coords
  const organ = { organType: 'Liver', status: 'Available', procurementTimestamp: new Date() };
  const recipient = { organType: 'Liver', bloodGroup: 'O+', urgency: 'High', status: 'Waiting' };

  const evalResult = calculateMatchingScore(donor, organ, recipient);
  assert.strictEqual(evalResult.isEligible, true);
  assert.strictEqual(evalResult.logistics.distanceKm, null);
  assert.strictEqual(evalResult.logistics.travelTimeMinutes, null);
});


console.log(`\n🎉 Summary: ${passedTests}/${totalTests} unit tests passed successfully!\n`);

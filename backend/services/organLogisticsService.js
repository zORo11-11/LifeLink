/**
 * Organ Logistics & Viability Service — Academic Demonstration Utility
 * 
 * NOTE: This uses straight-line mathematical distance and configurable assumptions.
 * It is NOT suitable for actual clinical transportation routing.
 */

// Earth's mean radius in kilometers
const EARTH_RADIUS_KM = 6371;

const LOGISTICS_CONFIG = {
  AVERAGE_TRAVEL_SPEED_KMH: 60.0, // Assumed 60 km/h straight-line speed
  BASE_LOGISTICS_BUFFER_MINUTES: 30, // 30 mins prep/handoff time buffer
  
  // Viability Limits (in hours)
  VIABILITY_WINDOWS: {
    'Heart': 4,
    'Lung': 4,
    'Liver': 8,
    'Pancreas': 12, // Configurable academic default
    'Kidney': 24
  }
};

/**
 * Validates GeoJSON coordinate format [longitude, latitude]
 */
function isValidCoordinate(coord) {
  if (!Array.isArray(coord) || coord.length !== 2) return false;
  const [lng, lat] = coord;
  if (typeof lng !== 'number' || typeof lat !== 'number') return false;
  
  // Valid Longitude: -180 to +180, Latitude: -90 to +90
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
  
  return true;
}

/**
 * Degrees to radians conversion
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate Haversine straight-line distance between two GeoJSON points [lng, lat]
 * Returns distance in kilometers (km)
 */
function calculateHaversineDistance(originCoords, destCoords) {
  if (!isValidCoordinate(originCoords) || !isValidCoordinate(destCoords)) {
    return null; // Return null if coordinates are missing/invalid
  }

  const [lon1, lat1] = originCoords;
  const [lon2, lat2] = destCoords;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return +(EARTH_RADIUS_KM * c).toFixed(2); // Round to 2 decimal places
}

/**
 * Estimate travel time based on distance
 * Returns total required travel time in minutes (including base buffer)
 */
function estimateTravelTimeMinutes(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || distanceKm < 0) {
    return null;
  }

  // Travel time = (Distance / speed) * 60 minutes + Base Buffer
  const travelHours = distanceKm / LOGISTICS_CONFIG.AVERAGE_TRAVEL_SPEED_KMH;
  const pureTravelMinutes = travelHours * 60;
  
  return Math.ceil(pureTravelMinutes + LOGISTICS_CONFIG.BASE_LOGISTICS_BUFFER_MINUTES);
}

/**
 * Check if the organ remains viable given a travel estimate
 */
function checkOrganViability(organ, travelEstimateMinutes = 0) {
  const result = {
    isViable: false,
    expiryTimestamp: null,
    remainingViabilityMinutes: 0,
    viabilityStatus: 'UNKNOWN',
    reason: ''
  };

  if (!organ) {
    result.reason = 'Missing organ data';
    return result;
  }

  const organType = organ.organType || organ.type;
  if (!organType || !LOGISTICS_CONFIG.VIABILITY_WINDOWS[organType]) {
    result.reason = `Unknown organ type: ${organType || 'undefined'}`;
    return result;
  }

  // Fallback to current time if procurement isn't set, but label properly.
  // In a real system, procurement time is critical.
  const procurementTime = organ.procurementTimestamp ? new Date(organ.procurementTimestamp) : new Date();
  if (isNaN(procurementTime.getTime())) {
    result.reason = 'Invalid procurement timestamp';
    return result;
  }

  // Calculate expiry
  let viabilityHours = organ.viabilityHours !== undefined && organ.viabilityHours !== null 
                         ? organ.viabilityHours 
                         : LOGISTICS_CONFIG.VIABILITY_WINDOWS[organType];
  if (viabilityHours <= 0) {
    result.reason = 'Viability hours must be positive';
    return result;
  }

  const expiryMs = procurementTime.getTime() + (viabilityHours * 60 * 60 * 1000);
  result.expiryTimestamp = new Date(expiryMs);

  const nowMs = Date.now();
  
  if (nowMs >= expiryMs) {
    result.viabilityStatus = 'EXPIRED';
    result.reason = 'Organ is already past its viability window';
    return result;
  }

  // Calculate remaining viability after accounting for travel
  const requiredTravelMs = (travelEstimateMinutes || 0) * 60 * 1000;
  const estimatedArrivalMs = nowMs + requiredTravelMs;

  const remainingMsAfterArrival = expiryMs - estimatedArrivalMs;
  
  result.remainingViabilityMinutes = Math.floor(remainingMsAfterArrival / (1000 * 60));

  if (estimatedArrivalMs > expiryMs) {
    result.viabilityStatus = 'TRAVEL_TIME_EXCEEDS_VIABILITY';
    result.reason = 'Estimated arrival time exceeds organ expiry limit';
    return result;
  }

  result.isViable = true;
  result.viabilityStatus = 'VIABLE';
  
  return result;
}

module.exports = {
  LOGISTICS_CONFIG,
  calculateHaversineDistance,
  estimateTravelTimeMinutes,
  checkOrganViability,
  isValidCoordinate
};

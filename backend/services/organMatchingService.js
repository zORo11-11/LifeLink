/**
 * Organ Matching Engine Service — Academic Demonstration Algorithm
 * 
 * NOTE: This algorithm is designed exclusively for academic demonstration
 * and educational decision-support prototyping. It is NOT a clinically
 * validated organ allocation system.
 */

const {
  calculateHaversineDistance,
  estimateTravelTimeMinutes,
  checkOrganViability
} = require('./organLogisticsService');


// Blood Group ABO/Rh Compatibility Matrix
const BLOOD_COMPATIBILITY_MAP = {
  'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

// Urgency Base Scores
const URGENCY_SCORES = {
  'Critical': 100,
  'High': 60,
  'Moderate': 30
};

// Configurable Scoring Constants
const SCORING_CONFIG = {
  WAITING_DAY_WEIGHT: 1,      // 1 point per day waiting
  MAX_WAITING_SCORE: 30,      // Capped waiting score
  HLA_MATCH_LOCUS_SCORE: 10,  // 10 points per matching locus (A, B, DR)
  MAX_HLA_SCORE: 30           // Max score for 3/3 locus match
};

/**
 * Check if donor blood group is compatible with recipient blood group
 */
function isBloodGroupCompatible(donorBloodGroup, recipientBloodGroup) {
  if (!donorBloodGroup || !recipientBloodGroup) return false;
  const donorGroup = String(donorBloodGroup).toUpperCase().trim();
  const recipientGroup = String(recipientBloodGroup).toUpperCase().trim();

  const allowedRecipients = BLOOD_COMPATIBILITY_MAP[donorGroup];
  if (!allowedRecipients) return false;

  return allowedRecipients.includes(recipientGroup);
}

/**
 * Calculate waiting time in days based on registration timestamp
 */
function calculateWaitingDays(registrationDate) {
  if (!registrationDate) return 0;
  const regDate = new Date(registrationDate);
  if (isNaN(regDate.getTime())) return 0;

  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - regDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate base urgency score for recipient
 */
function calculateOrganPriority(recipient) {
  if (!recipient || !recipient.urgency) return URGENCY_SCORES['Moderate'];
  return URGENCY_SCORES[recipient.urgency] || URGENCY_SCORES['Moderate'];
}

/**
 * Calculate HLA similarity match score between donor and recipient
 * Returns score (0-30), matches, and evaluated locus count
 */
function calculateHlaMatchScore(donorHla = {}, recipientHla = {}) {
  let score = 0;
  let matches = 0;
  let evaluatedLoci = 0;

  const loci = ['a', 'b', 'dr'];
  loci.forEach((locus) => {
    const dVal = donorHla && donorHla[locus] ? String(donorHla[locus]).trim().toUpperCase() : '';
    const rVal = recipientHla && recipientHla[locus] ? String(recipientHla[locus]).trim().toUpperCase() : '';

    if (dVal && rVal) {
      evaluatedLoci++;
      if (dVal === rVal) {
        matches++;
        score += SCORING_CONFIG.HLA_MATCH_LOCUS_SCORE;
      }
    }
  });

  return {
    score: Math.min(score, SCORING_CONFIG.MAX_HLA_SCORE),
    matches,
    evaluatedLoci
  };
}

/**
 * Calculate overall matching score and eligibility for donor, organ, and recipient
 */
function calculateMatchingScore(donor, organ, recipient) {
  const result = {
    isEligible: true,
    exclusionReasons: [],
    priorityScore: 0,
    scoreBreakdown: {
      baseUrgencyScore: 0,
      waitingDaysScore: 0,
      hlaMatchScore: 0,
      totalScore: 0
    },
    compatibilityResult: {
      bloodGroupMatch: false,
      organTypeMatch: false,
      organStatusValid: false,
      logisticsViable: true
    },
    logistics: {
      distanceKm: null,
      travelTimeMinutes: null,
      viabilityStatus: null,
      remainingViabilityMinutes: null
    }
  };

  if (!donor || !organ || !recipient) {
    result.isEligible = false;
    result.exclusionReasons.push('Missing donor, organ, or recipient data');
    return result;
  }

  // 1. Organ Type Match
  const organType = organ.organType || organ.type;
  const recipientOrganType = recipient.organType;
  if (!organType || !recipientOrganType || organType.toLowerCase() !== recipientOrganType.toLowerCase()) {
    result.isEligible = false;
    result.compatibilityResult.organTypeMatch = false;
    result.exclusionReasons.push(
      `Organ type mismatch (Donor organ: ${organType || 'Unknown'}, Recipient required: ${recipientOrganType || 'Unknown'})`
    );
  } else {
    result.compatibilityResult.organTypeMatch = true;
  }

  // 2. Organ Status Check
  const organStatus = organ.organStatus || organ.status || 'Available';
  if (organStatus.toLowerCase() !== 'available') {
    result.isEligible = false;
    result.compatibilityResult.organStatusValid = false;
    result.exclusionReasons.push(`Organ is not available (Current status: ${organStatus})`);
  } else {
    result.compatibilityResult.organStatusValid = true;
  }

  // 3. Blood Group Compatibility
  const donorBloodGroup = donor.bloodGroup || organ.bloodGroup;
  const recipientBloodGroup = recipient.bloodGroup;
  const isBloodCompatible = isBloodGroupCompatible(donorBloodGroup, recipientBloodGroup);
  result.compatibilityResult.bloodGroupMatch = isBloodCompatible;

  if (!isBloodCompatible) {
    result.isEligible = false;
    result.exclusionReasons.push(
      `Incompatible blood group (Donor: ${donorBloodGroup || 'Unknown'}, Recipient: ${recipientBloodGroup || 'Unknown'})`
    );
  }

  // 4. Recipient Status Check
  const recipientStatus = recipient.status || 'Waiting';
  if (recipientStatus.toLowerCase() !== 'waiting' && recipientStatus.toLowerCase() !== 'offered') {
    result.isEligible = false;
    result.exclusionReasons.push(`Recipient status is inactive (Current status: ${recipientStatus})`);
  }

  // 5. Logistics & Viability Check (if coordinates are provided)
  let travelEstimateMinutes = 0;
  
  // Try to extract GeoJSON coordinates: [longitude, latitude]
  const originCoords = donor.location?.coordinates || organ.location?.coordinates || donor.hospitalCoords;
  const destCoords = recipient.location?.coordinates || recipient.hospitalCoords;
  
  if (originCoords && destCoords) {
    const distanceKm = calculateHaversineDistance(originCoords, destCoords);
    if (distanceKm !== null) {
      travelEstimateMinutes = estimateTravelTimeMinutes(distanceKm);
      result.logistics.distanceKm = distanceKm;
      result.logistics.travelTimeMinutes = travelEstimateMinutes;
    }
  }

  const viabilityCheck = checkOrganViability(organ, travelEstimateMinutes);
  result.logistics.viabilityStatus = viabilityCheck.viabilityStatus;
  result.logistics.remainingViabilityMinutes = viabilityCheck.remainingViabilityMinutes;
  
  if (!viabilityCheck.isViable) {
    result.isEligible = false;
    result.compatibilityResult.logisticsViable = false;
    result.exclusionReasons.push(`Viability failure: ${viabilityCheck.reason}`);
  }

  // If ineligible, return early
  if (!result.isEligible) {
    return result;
  }

  // 6. Calculate Priority Score Components
  const baseUrgencyScore = calculateOrganPriority(recipient);

  const waitingDays = calculateWaitingDays(recipient.registrationDate || recipient.createdAt);
  const rawWaitingScore = waitingDays * SCORING_CONFIG.WAITING_DAY_WEIGHT;
  const waitingDaysScore = Math.min(rawWaitingScore, SCORING_CONFIG.MAX_WAITING_SCORE);

  const donorHla = donor.hlaMarkers || organ.hlaMarkers || {};
  const recipientHla = recipient.hlaMarkers || {};
  const hlaMatchResult = calculateHlaMatchScore(donorHla, recipientHla);
  const hlaMatchScore = hlaMatchResult.score;

  const totalScore = baseUrgencyScore + waitingDaysScore + hlaMatchScore;

  result.priorityScore = totalScore;
  result.scoreBreakdown = {
    baseUrgencyScore,
    waitingDaysScore,
    hlaMatchScore,
    totalScore
  };

  return result;
}

/**
 * Find ranked recipient candidates for a given organ
 */
function findBestOrganMatch(organ, donor, recipients = []) {
  if (!organ || !donor || !Array.isArray(recipients) || recipients.length === 0) {
    return {
      topCandidate: null,
      eligibleCandidates: [],
      ineligibleCandidates: []
    };
  }

  const evaluatedCandidates = recipients.map((recipient) => {
    const matchEvaluation = calculateMatchingScore(donor, organ, recipient);
    return {
      recipient,
      matchEvaluation
    };
  });

  const eligibleCandidates = evaluatedCandidates
    .filter((item) => item.matchEvaluation.isEligible)
    .sort((a, b) => b.matchEvaluation.priorityScore - a.matchEvaluation.priorityScore);

  const ineligibleCandidates = evaluatedCandidates.filter((item) => !item.matchEvaluation.isEligible);

  return {
    topCandidate: eligibleCandidates.length > 0 ? eligibleCandidates[0] : null,
    eligibleCandidates,
    ineligibleCandidates
  };
}

module.exports = {
  BLOOD_COMPATIBILITY_MAP,
  URGENCY_SCORES,
  SCORING_CONFIG,
  isBloodGroupCompatible,
  calculateWaitingDays,
  calculateOrganPriority,
  calculateHlaMatchScore,
  calculateMatchingScore,
  findBestOrganMatch
};

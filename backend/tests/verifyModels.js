const mongoose = require('mongoose');
const OrganRecipient = require('../models/OrganRecipient');
const OrganDonor = require('../models/OrganDonor');
const OrganAllocation = require('../models/OrganAllocation');
const OrganNotification = require('../models/OrganNotification');

console.log('Testing Mongoose Schema initialization...');

// Test OrganRecipient instantiation
const recipient = new OrganRecipient({
  hospitalId: new mongoose.Types.ObjectId(),
  patientName: 'John Doe',
  bloodGroup: 'O+',
  organType: 'Kidney',
  urgency: 'High',
  hlaMarkers: { a: 'A2', b: 'B7', dr: 'DR4' }
});

const recipientErr = recipient.validateSync();
if (recipientErr) {
  console.error('❌ OrganRecipient validation error:', recipientErr.message);
  process.exit(1);
}
console.log('✅ OrganRecipient model validated successfully');

// Test OrganDonor instantiation
const donor = new OrganDonor({
  procurementHospitalId: new mongoose.Types.ObjectId(),
  donorName: 'Donor 001',
  donorType: 'Deceased',
  bloodGroup: 'O+',
  availableOrgans: [
    {
      organIdentifier: 'KIDNEY-001',
      organType: 'Kidney',
      viabilityHours: 24,
      organStatus: 'Available'
    }
  ],
  location: {
    type: 'Point',
    coordinates: [77.5946, 12.9716]
  }
});

const donorErr = donor.validateSync();
if (donorErr) {
  console.error('❌ OrganDonor validation error:', donorErr.message);
  process.exit(1);
}
console.log('✅ OrganDonor model validated successfully');

// Test OrganAllocation instantiation
const allocation = new OrganAllocation({
  donorId: donor._id,
  organIdentifier: 'KIDNEY-001',
  organType: 'Kidney',
  recipientId: recipient._id,
  offeringHospitalId: donor.procurementHospitalId,
  receivingHospitalId: recipient.hospitalId,
  priorityScore: 85,
  scoreBreakdown: {
    baseUrgencyScore: 60,
    waitingDaysScore: 15,
    hlaMatchScore: 10
  },
  distanceKm: 12.5,
  travelTimeMinutes: 25,
  status: 'Recommended'
});

const allocationErr = allocation.validateSync();
if (allocationErr) {
  console.error('❌ OrganAllocation validation error:', allocationErr.message);
  process.exit(1);
}
console.log('✅ OrganAllocation model validated successfully');

// Test OrganNotification instantiation
const notification = new OrganNotification({
  hospitalId: recipient.hospitalId,
  allocationId: allocation._id,
  recipientId: recipient._id,
  donorId: donor._id,
  type: 'OFFER_RECEIVED',
  message: 'Organ offer available for patient John Doe'
});

const notificationErr = notification.validateSync();
if (notificationErr) {
  console.error('❌ OrganNotification validation error:', notificationErr.message);
  process.exit(1);
}
console.log('✅ OrganNotification model validated successfully');

console.log('🎉 All Phase 1 Mongoose Models verified successfully!');
process.exit(0);

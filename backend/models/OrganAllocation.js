const mongoose = require('mongoose');

const organAllocationSchema = new mongoose.Schema(
  {
    // Donor & Organ References
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganDonor',
      required: [true, 'Donor reference is required'],
      index: true
    },
    organIdentifier: {
      type: String,
      required: [true, 'Organ identifier is required']
    },
    organType: {
      type: String,
      required: [true, 'Organ type is required'],
      enum: ['Heart', 'Lung', 'Liver', 'Kidney', 'Pancreas']
    },

    // Recipient & Hospital References
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrganRecipient',
      required: [true, 'Recipient reference is required'],
      index: true
    },
    offeringHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Offering hospital reference is required'],
      index: true
    },
    receivingHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Receiving hospital reference is required'],
      index: true
    },

    // Matching Scoring Details
    priorityScore: {
      type: Number,
      required: true,
      default: 0
    },
    scoreBreakdown: {
      baseUrgencyScore: { type: Number, default: 0 },
      waitingDaysScore: { type: Number, default: 0 },
      hlaMatchScore: { type: Number, default: 0 }
    },

    // Logistics & Distance Filtering
    distanceKm: {
      type: Number,
      default: 0
    },
    travelTimeMinutes: {
      type: Number,
      default: 0
    },
    travelProvider: {
      type: String,
      default: 'Haversine Local'
    },

    // Viability Information
    viabilityWindowHours: {
      type: Number,
      default: 0
    },
    remainingViabilityMinutes: {
      type: Number,
      default: 0
    },
    isViable: {
      type: Boolean,
      default: true
    },

    // Allocation Lifecycle Status
    // Lifecycle: Recommended -> Offered -> Accepted/Declined/Expired -> TransportInitiated -> Completed
    status: {
      type: String,
      enum: [
        'Recommended',
        'Offered',
        'Accepted',
        'Declined',
        'Expired',
        'TransportInitiated',
        'Completed'
      ],
      default: 'Recommended',
      index: true
    },

    // Offer Expiry Timestamp
    offerExpiry: {
      type: Date,
      default: null
    },

    // Accept / Decline Information
    acceptDeclineInfo: {
      reason: { type: String, default: '' },
      respondedAt: { type: Date, default: null },
      respondedBy: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

organAllocationSchema.index({ donorId: 1, organIdentifier: 1, recipientId: 1 });
organAllocationSchema.index({ receivingHospitalId: 1, status: 1 });
organAllocationSchema.index({ offeringHospitalId: 1, status: 1 });

module.exports = mongoose.models.OrganAllocation || mongoose.model('OrganAllocation', organAllocationSchema);

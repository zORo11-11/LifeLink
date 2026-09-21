const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
  {
    // Connection to requesting hospital
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital ID is required']
    },

    // Form Fields from Dashboard Modal
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true
    },
    targetWard: {
      type: String,
      required: [true, 'Target ward/room is required'],
      trim: true
    },
    bloodType: {
      type: String,
      required: [true, 'Blood type is required'],
      enum: {
        values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        message: '{VALUE} is not a valid blood type'
      }
    },
    requiredUnits: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'At least 1 unit is required']
    },
    urgencyLevel: {
      type: String,
      enum: ['Critical Priority', 'High Priority', 'Moderate', 'Critical', 'Standard'],
      default: 'Critical Priority'
    },
    medicalDetails: {
      type: String,
      default: ''
    },

    // Pipeline tracking step (0 to 4)
    step: {
      type: Number,
      default: 0,
      min: 0,
      max: 4
    },

    // Request Lifecycle Management - Updated enum to allow frontend status strings
    status: {
      type: String,
      enum: [
        'Broadcasted',
        'Broadcast Sent',
        'Donor Accepted',
        'In-Transit',
        'In_progress',
        'Arrived',
        'Completed',
        'Fulfilled',
        'Cancelled'
      ],
      default: 'Broadcasted'
    },

    // Optional tracking assigned donor details
    assignedDonor: {
      type: String,
      default: ''
    },
    acceptedByDonor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor'
    },

    // Donors who responded or pledged
    respondedDonors: [
      {
        donorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Donor'
        },
        status: {
          type: String,
          enum: ['Accepted', 'ACCEPTED', 'En_route', 'Completed', 'Declined'],
          default: 'Accepted'
        },
        respondedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
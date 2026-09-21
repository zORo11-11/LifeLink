const mongoose = require('mongoose');

const organRecipientSchema = new mongoose.Schema(
  {
    // Hospital that registered this recipient
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital reference is required'],
      index: true
    },

    // Patient Details
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true
    },
    patientId: {
      type: String,
      trim: true,
      default: ''
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: {
        values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        message: '{VALUE} is not a valid blood group'
      }
    },
    organType: {
      type: String,
      required: [true, 'Requested organ type is required'],
      enum: {
        values: ['Heart', 'Lung', 'Liver', 'Kidney', 'Pancreas'],
        message: '{VALUE} is not a supported organ type'
      }
    },

    // Urgency Level
    urgency: {
      type: String,
      required: [true, 'Urgency level is required'],
      enum: ['Critical', 'High', 'Moderate'],
      default: 'Moderate'
    },

    // Timestamp of waitlist registration
    registrationDate: {
      type: Date,
      default: Date.now
    },

    // Recipient Status Lifecycle
    status: {
      type: String,
      enum: ['Waiting', 'Offered', 'Allocated', 'Fulfilled', 'Cancelled'],
      default: 'Waiting',
      index: true
    },

    // Optional HLA Typing Information (for academic demonstration matching)
    hlaMarkers: {
      a: { type: String, default: '' },
      b: { type: String, default: '' },
      dr: { type: String, default: '' }
    },

    // Optional Medical Record Metadata (stored as references / metadata only)
    medicalMetadata: {
      conditionSummary: { type: String, default: '' },
      recordUrl: { type: String, default: '' },
      notes: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

organRecipientSchema.index({ hospitalId: 1, status: 1 });
organRecipientSchema.index({ organType: 1, bloodGroup: 1, status: 1 });

module.exports = mongoose.models.OrganRecipient || mongoose.model('OrganRecipient', organRecipientSchema);

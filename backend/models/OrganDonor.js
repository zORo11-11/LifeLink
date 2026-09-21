const mongoose = require('mongoose');

const availableOrganSchema = new mongoose.Schema(
  {
    organIdentifier: {
      type: String,
      required: [true, 'Organ unique identifier is required']
    },
    organType: {
      type: String,
      required: [true, 'Organ type is required'],
      enum: ['Heart', 'Lung', 'Liver', 'Kidney', 'Pancreas']
    },
    viabilityHours: {
      type: Number,
      required: [true, 'Viability hours is required'],
      default: 4
    },
    procurementTimestamp: {
      type: Date,
      default: Date.now
    },
    organStatus: {
      type: String,
      enum: ['Available', 'Offered', 'Allocated', 'Transplanted', 'Expired', 'Discarded'],
      default: 'Available'
    }
  },
  { _id: true }
);

const organDonorSchema = new mongoose.Schema(
  {
    // Procurement hospital reference
    procurementHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Procurement Hospital reference is required'],
      index: true
    },

    // Optional donor reference if linked to existing Donor user model
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      default: null
    },

    donorName: {
      type: String,
      required: [true, 'Donor name/identifier is required'],
      trim: true
    },

    donorType: {
      type: String,
      enum: ['Deceased', 'Living'],
      default: 'Deceased'
    },

    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },

    // List of organs procured from this donor
    availableOrgans: [availableOrganSchema],

    // Donor overall status
    status: {
      type: String,
      enum: ['Available', 'In_Process', 'Completed', 'Cancelled'],
      default: 'Available',
      index: true
    },

    // Optional HLA markers
    hlaMarkers: {
      a: { type: String, default: '' },
      b: { type: String, default: '' },
      dr: { type: String, default: '' }
    },

    // GeoJSON Point location for hospital / procurement site (Longitude, Latitude)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [77.5946, 12.9716] // Default coordinates [lng, lat]
      }
    }
  },
  { timestamps: true }
);

// 2dsphere index for geospatial distance querying
organDonorSchema.index({ location: '2dsphere' });
organDonorSchema.index({ procurementHospitalId: 1, status: 1 });

module.exports = mongoose.models.OrganDonor || mongoose.model('OrganDonor', organDonorSchema);

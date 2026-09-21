const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  donorName: {
    type: String,
    required: true,
    trim: true
  },
  bloodGroup: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  hospitalId: {
    type: String,
    default: null
  },
  hospitalName: {
    type: String,
    default: 'Central Donation Center'
  },
  centerName: {
    type: String,
    default: 'Central Donation Center'
  },
  appointmentDate: {
    type: String,
    required: true
  },
  appointmentTime: {
    type: String,
    default: '09:00 AM'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  notes: {
    type: String,
    default: ''
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  }
}, { timestamps: true });

// Create 2dsphere index for spatial queries
AppointmentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Appointment', AppointmentSchema);

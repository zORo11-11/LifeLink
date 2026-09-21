const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true
  },
  caseId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  bloodType: {
    type: String,
    required: true
  },
  units: {
    type: Number,
    required: true
  },
  urgency: {
    type: String,
    default: 'Standard'
  },
  donorName: {
    type: String,
    default: 'Verified Donor'
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor'
  },
  status: {
    type: String,
    default: 'Completed'
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

auditLogSchema.index({ hospitalId: 1, completedAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

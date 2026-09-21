const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  bloodType: { 
    type: String, 
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  units: { type: Number, required: true, min: 1 },
  expiryDate: { type: Date, required: true },
  status: { type: String, enum: ['Good', 'Expiring Soon', 'Expired'], default: 'Good' }
}, { timestamps: true });

const inventorySchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true
  },
  bloodType: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  units: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['Optimal', 'Low', 'Critical'],
    default: 'Critical'
  },
  batches: [batchSchema]
}, { timestamps: true });

// Compound index for quick lookup per hospital and blood type
inventorySchema.index({ hospitalId: 1, bloodType: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);

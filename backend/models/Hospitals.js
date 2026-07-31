const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  licenseId: { type: String },
  adminName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  phone: { type: String }
}, { timestamps: true });

// Uses existing model or exports a new one to prevent overwrite errors
module.exports = mongoose.models.Hospital || mongoose.model('Hospital', hospitalSchema);
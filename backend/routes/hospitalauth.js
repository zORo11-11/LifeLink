const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Hospital = require('../models/Hospitals');
const { JWT_SECRET } = require('../middleware/auth');

// ==========================================
// 1. HOSPITAL REGISTRATION
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const {
      hospitalName,
      name,
      licenseId,
      adminName,
      email,
      password,
      address,
      city,
      phone
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check for existing hospital
    const existingHospital = await Hospital.findOne({ email: cleanEmail });
    if (existingHospital) {
      return res.status(400).json({
        success: false,
        message: 'A hospital with this email already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create document mapping hospitalName -> name
    const newHospital = new Hospital({
      name: hospitalName || name || 'Unnamed Hospital',
      licenseId: licenseId || `HOSP-${Math.floor(10000 + Math.random() * 90000)}`,
      adminName: adminName || 'Administrator',
      email: cleanEmail,
      password: hashedPassword,
      address: address || '',
      city: city || '',
      phone: phone || ''
    });

    await newHospital.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newHospital._id, role: 'hospital', email: newHospital.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const hospitalData = {
      id: newHospital._id,
      _id: newHospital._id,
      name: newHospital.name,
      email: newHospital.email,
      licenseId: newHospital.licenseId,
      adminName: newHospital.adminName,
      address: newHospital.address,
      city: newHospital.city,
      phone: newHospital.phone
    };

    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully!',
      token,
      hospital: hospitalData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
});

// ==========================================
// 2. HOSPITAL LOGIN
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const hospital = await Hospital.findOne({ email: email.toLowerCase().trim() });
    if (!hospital) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, hospital.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: hospital._id, role: 'hospital', email: hospital.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const hospitalData = {
      id: hospital._id,
      _id: hospital._id,
      name: hospital.name,
      email: hospital.email,
      licenseId: hospital.licenseId,
      adminName: hospital.adminName,
      address: hospital.address,
      city: hospital.city,
      phone: hospital.phone
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      hospital: hospitalData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
});

module.exports = router;
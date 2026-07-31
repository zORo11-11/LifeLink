const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Imports the Mongoose Model
const Hospital = require('../models/Hospitals');

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

    // Check for existing hospital
    const existingHospital = await Hospital.findOne({ email });
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
      licenseId,
      adminName,
      email,
      password: hashedPassword,
      address,
      city,
      phone
    });

    await newHospital.save();

    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully!',
      hospital: {
        id: newHospital._id,
        name: newHospital.name,
        email: newHospital.email
      }
    });
  } catch (error) {
    console.error('SERVER CRASH DETAILS:', error); // Prints exact error in Node Terminal
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const hospital = await Hospital.findOne({ email });
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

    res.status(200).json({
      success: true,
      message: 'Login successful',
      hospital: {
        id: hospital._id,
        name: hospital.name,
        email: hospital.email
      }
    });
  } catch (error) {
    console.error('LOGIN ERROR DETAILS:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
});

module.exports = router;
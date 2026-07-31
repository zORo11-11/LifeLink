const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Donor = require('../models/Donor');

// ==========================================
// 1. DONOR REGISTRATION
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if donor already exists
    const existingDonor = await Donor.findOne({ email });
    if (existingDonor) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already registered' 
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create donor directly from req.body
    const newDonor = new Donor({
      ...req.body,
      password: hashedPassword
    });

    await newDonor.save();

    res.status(201).json({ 
      success: true, 
      message: 'Donor registered successfully!' 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during registration' 
    });
  }
});

// ==========================================
// 2. DONOR LOGIN
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find donor by email
    const donor = await Donor.findOne({ email });
    if (!donor) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // 2. Compare incoming plain text password with stored hashed password
    const isMatch = await bcrypt.compare(password, donor.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // 3. Return success response (with donor details for frontend session/state)
    res.status(200).json({
      success: true,
      message: 'Login successful!',
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        bloodGroup: donor.bloodGroup,
        isAvailable: donor.isAvailable
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during login' 
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Donor = require('../models/Donor');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

// ==========================================
// 1. DONOR REGISTRATION
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, age, phone, address, bloodGroup, allergies, condition, coordinates, location } = req.body;

    if (!email || !password || !fullName || !bloodGroup) {
      return res.status(400).json({ 
        success: false, 
        message: 'Full name, email, password, and blood group are required.' 
      });
    }

    // Check if donor already exists
    const existingDonor = await Donor.findOne({ email: email.toLowerCase().trim() });
    if (existingDonor) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already registered' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Sanitized document creation
    const newDonor = new Donor({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      age: Number(age) || 18,
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      bloodGroup,
      allergies: allergies || '',
      condition: condition || '',
      isAvailable: true,
      totalDonations: 0,
      location: location && location.coordinates ? location : {
        type: 'Point',
        coordinates: Array.isArray(coordinates) && coordinates.length === 2 ? [Number(coordinates[0]), Number(coordinates[1])] : [0, 0]
      }
    });

    await newDonor.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newDonor._id, role: 'donor', email: newDonor.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const donorData = {
      id: newDonor._id,
      _id: newDonor._id,
      name: newDonor.fullName,
      fullName: newDonor.fullName,
      email: newDonor.email,
      bloodType: newDonor.bloodGroup,
      bloodGroup: newDonor.bloodGroup,
      available: newDonor.isAvailable,
      isAvailable: newDonor.isAvailable,
      phone: newDonor.phone,
      address: newDonor.address,
      totalDonations: newDonor.totalDonations
    };

    res.status(201).json({ 
      success: true, 
      message: 'Donor registered successfully!',
      token,
      donor: donorData
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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const donor = await Donor.findOne({ email: email.toLowerCase().trim() });
    if (!donor) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const isMatch = await bcrypt.compare(password, donor.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: donor._id, role: 'donor', email: donor.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const donorData = {
      id: donor._id,
      _id: donor._id,
      name: donor.fullName,
      fullName: donor.fullName,
      email: donor.email,
      bloodType: donor.bloodGroup,
      bloodGroup: donor.bloodGroup,
      available: donor.isAvailable,
      isAvailable: donor.isAvailable,
      phone: donor.phone,
      lastDonated: donor.lastDonated ? new Date(donor.lastDonated).toISOString().split('T')[0] : '',
      address: donor.address,
      totalDonations: donor.totalDonations || 0
    };

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      donor: donorData
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during login' 
    });
  }
});

// ==========================================
// 3. UPDATE DONOR PROFILE (Protected Route)
// ==========================================
router.patch('/profile/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure donors can only update their own profile
    if (req.user.role === 'donor' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Forbidden. Cannot modify another donor profile.' });
    }

    const { totalDonations, lastDonated, lastDonatedDate, isAvailable, available, phone, address, location, coordinates } = req.body;

    const updateData = {};
    if (totalDonations !== undefined) updateData.totalDonations = totalDonations;
    if (lastDonated !== undefined || lastDonatedDate !== undefined) {
      const dVal = lastDonatedDate || lastDonated;
      updateData.lastDonated = dVal;
      updateData.lastDonation = dVal;
      updateData.lastDonatedDate = dVal;
    }
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (available !== undefined) updateData.isAvailable = available;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    if (location) {
      updateData.location = location;
    } else if (Array.isArray(coordinates) && coordinates.length === 2) {
      updateData.location = {
        type: 'Point',
        coordinates: [Number(coordinates[0]), Number(coordinates[1])]
      };
    }

    const updatedDonor = await Donor.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedDonor) {
      return res.status(404).json({ success: false, message: 'Donor profile not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Donor profile updated successfully',
      donor: updatedDonor,
      data: updatedDonor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile'
    });
  }
});

// Helper query for Rule A (90-day window) & Rule B (Manual toggle unavailable)
const getDonorAvailabilityFilter = (query = {}) => {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const filter = {
    // Rule B: Must be available (isAvailable !== false)
    isAvailable: { $ne: false },
    // Rule A: lastDonatedDate / lastDonated / lastDonation must be null or > 90 days ago
    $and: [
      {
        $or: [
          { lastDonatedDate: null },
          { lastDonatedDate: { $exists: false } },
          { lastDonatedDate: { $lt: ninetyDaysAgo } }
        ]
      },
      {
        $or: [
          { lastDonated: null },
          { lastDonated: { $exists: false } },
          { lastDonated: { $lt: ninetyDaysAgo } }
        ]
      },
      {
        $or: [
          { lastDonation: null },
          { lastDonation: { $exists: false } },
          { lastDonation: { $lt: ninetyDaysAgo } }
        ]
      }
    ]
  };

  if (query.bloodGroup && query.bloodGroup !== 'ALL') {
    filter.bloodGroup = query.bloodGroup;
  }
  return filter;
};

// GET list of active/available donors for Hospital Searches, Maps & Lists
router.get('/all', async (req, res) => {
  try {
    const { includeUnavailable } = req.query;
    let filter = {};
    if (includeUnavailable !== 'true') {
      filter = getDonorAvailabilityFilter(req.query);
    } else if (req.query.bloodGroup && req.query.bloodGroup !== 'ALL') {
      filter.bloodGroup = req.query.bloodGroup;
    }

    const donors = await Donor.find(filter, '-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: donors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/donors/search (Search available donors for hospital queries & emergency matching)
router.get('/search', async (req, res) => {
  try {
    const { includeUnavailable } = req.query;
    let filter = {};
    if (includeUnavailable !== 'true') {
      filter = getDonorAvailabilityFilter(req.query);
    } else if (req.query.bloodGroup && req.query.bloodGroup !== 'ALL') {
      filter.bloodGroup = req.query.bloodGroup;
    }

    const donors = await Donor.find(filter, '-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: donors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const AuditLog = require('../models/AuditLog');

// Initial default blood inventory template if hospital has no stock records yet
const DEFAULT_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

// 1. GET HOSPITAL INVENTORY & BATCHES
router.get('/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    let invItems = await Inventory.find({ hospitalId });

    if (!invItems || invItems.length === 0) {
      // Seed default stock types for new hospital
      const seedItems = DEFAULT_TYPES.map(type => ({
        hospitalId,
        bloodType: type,
        units: 0,
        status: 'Critical',
        batches: []
      }));
      invItems = await Inventory.insertMany(seedItems);
    }

    // Extract all active batches
    const allBatches = invItems.flatMap(item => (item.batches || []).map(b => ({
      id: b.batchId,
      _id: b._id,
      bloodType: b.bloodType,
      units: b.units,
      expiry: b.expiryDate ? new Date(b.expiryDate).toISOString().split('T')[0] : '',
      status: b.status
    })));

    // Map summary stock
    const summaryInventory = invItems.map(item => ({
      type: item.bloodType,
      units: item.units,
      status: item.status
    }));

    res.status(200).json({
      success: true,
      inventory: summaryInventory,
      batches: allBatches
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. ADD / REPLENISH INVENTORY BATCH
router.post('/add-batch', async (req, res) => {
  try {
    const { hospitalId, bloodType, units, expiryDays } = req.body;

    if (!hospitalId || !bloodType || !units) {
      return res.status(400).json({ success: false, message: 'Hospital ID, blood type, and units are required.' });
    }

    const numUnits = parseInt(units);
    const days = parseInt(expiryDays) || 42;
    const batchId = `B-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    let invItem = await Inventory.findOne({ hospitalId, bloodType });
    if (!invItem) {
      invItem = new Inventory({ hospitalId, bloodType, units: 0, status: 'Critical', batches: [] });
    }

    invItem.units += numUnits;
    invItem.status = invItem.units > 10 ? 'Optimal' : invItem.units > 5 ? 'Low' : 'Critical';
    invItem.batches.push({
      batchId,
      bloodType,
      units: numUnits,
      expiryDate,
      status: 'Good'
    });

    await invItem.save();

    res.status(200).json({
      success: true,
      message: `Batch ${batchId} added successfully`,
      inventoryItem: invItem
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. DISCARD BATCH
router.delete('/batch/:hospitalId/:batchId', async (req, res) => {
  try {
    const { hospitalId, batchId } = req.params;

    const invItem = await Inventory.findOne({ hospitalId, 'batches.batchId': batchId });
    if (!invItem) {
      return res.status(404).json({ success: false, message: 'Batch not found in inventory.' });
    }

    const targetBatch = invItem.batches.find(b => b.batchId === batchId);
    const unitsToDeduct = targetBatch ? targetBatch.units : 0;

    invItem.batches = invItem.batches.filter(b => b.batchId !== batchId);
    invItem.units = Math.max(0, invItem.units - unitsToDeduct);
    invItem.status = invItem.units > 10 ? 'Optimal' : invItem.units > 5 ? 'Low' : 'Critical';

    await invItem.save();

    res.status(200).json({
      success: true,
      message: `Batch ${batchId} discarded successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. GET AUDIT LOG HISTORY
router.get('/history/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const logs = await AuditLog.find({ hospitalId }).sort({ completedAt: -1 });

    const formattedLogs = logs.map(l => ({
      id: l.caseId,
      _id: l._id,
      patient: l.patientName,
      bloodType: l.bloodType,
      units: l.units,
      urgency: l.urgency,
      donor: l.donorName,
      responseTime: '12 mins',
      status: l.status,
      date: l.completedAt ? new Date(l.completedAt).toISOString().split('T')[0] : ''
    }));

    res.status(200).json({
      success: true,
      history: formattedLogs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. CREATE AUDIT LOG ENTRY
router.post('/history', async (req, res) => {
  try {
    const { hospitalId, caseId, patientName, bloodType, units, urgency, donorName, donorId } = req.body;

    const newLog = await AuditLog.create({
      hospitalId,
      caseId: caseId || `HST-${Math.floor(100 + Math.random() * 900)}`,
      patientName: patientName || 'Patient',
      bloodType: bloodType || 'O+',
      units: Number(units) || 1,
      urgency: urgency || 'Standard',
      donorName: donorName || 'Verified Donor',
      donorId
    });

    res.status(201).json({
      success: true,
      data: newLog
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

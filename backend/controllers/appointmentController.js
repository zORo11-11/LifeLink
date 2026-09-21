const Appointment = require('../models/Appointment');
const Donor = require('../models/Donor');

/**
 * 1. Book New Appointment (POST /api/appointments)
 */
exports.bookAppointment = async (req, res) => {
  try {
    const {
      donorId,
      donorName,
      bloodGroup,
      phone,
      hospitalId,
      hospitalName,
      centerName,
      appointmentDate,
      appointmentTime,
      notes,
      coordinates
    } = req.body;

    if (!donorId || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: 'donorId and appointmentDate are required.'
      });
    }

    // Attempt to lookup donor details if missing
    let resolvedDonorName = donorName;
    let resolvedBloodGroup = bloodGroup;
    let resolvedPhone = phone;

    if (donorId && (!resolvedDonorName || !resolvedBloodGroup)) {
      try {
        const donorObj = await Donor.findById(donorId);
        if (donorObj) {
          if (!resolvedDonorName) resolvedDonorName = donorObj.fullName || donorObj.name;
          if (!resolvedBloodGroup) resolvedBloodGroup = donorObj.bloodGroup || donorObj.bloodType;
          if (!resolvedPhone) resolvedPhone = donorObj.phone;
        }
      } catch (e) {
        console.warn('Donor lookup in appointment creation warning:', e.message);
      }
    }

    const newAppointment = new Appointment({
      donorId,
      donorName: resolvedDonorName || 'Registered Donor',
      bloodGroup: resolvedBloodGroup || 'O+',
      phone: resolvedPhone || '',
      hospitalId: hospitalId || null,
      hospitalName: hospitalName || centerName || 'Central Donation Center',
      centerName: centerName || hospitalName || 'Central Donation Center',
      appointmentDate,
      appointmentTime: appointmentTime || '09:00 AM',
      notes: notes || '',
      location: {
        type: 'Point',
        coordinates: Array.isArray(coordinates) && coordinates.length === 2 
          ? [Number(coordinates[0]), Number(coordinates[1])] 
          : [0, 0]
      }
    });

    await newAppointment.save();

    return res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully!',
      appointment: newAppointment,
      data: newAppointment
    });
  } catch (error) {
    console.error('Error in bookAppointment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error booking appointment'
    });
  }
};

/**
 * 2. Get Hospital Upcoming Appointments & Check-ins (GET /api/appointments/hospital)
 */
exports.getHospitalAppointments = async (req, res) => {
  try {
    const { hospitalId, hospitalName, status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = 'Scheduled'; // Default to active scheduled check-ins
    }

    if (hospitalId) {
      filter.$or = [
        { hospitalId: hospitalId },
        { hospitalName: new RegExp(hospitalId, 'i') }
      ];
    } else if (hospitalName) {
      filter.hospitalName = new RegExp(hospitalName, 'i');
    }

    const appointments = await Appointment.find(filter)
      .populate('donorId', 'fullName name bloodGroup bloodType phone address location')
      .sort({ appointmentDate: 1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('Error in getHospitalAppointments:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching hospital appointments'
    });
  }
};

/**
 * 3. Get Donor Appointments (GET /api/appointments/donor/:donorId)
 */
exports.getDonorAppointments = async (req, res) => {
  try {
    const { donorId } = req.params;
    if (!donorId) {
      return res.status(400).json({ success: false, message: 'donorId parameter is required' });
    }

    const appointments = await Appointment.find({ donorId })
      .sort({ appointmentDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching donor appointments'
    });
  }
};

/**
 * 4. Update Appointment Status (PATCH /api/appointments/:id/status)
 */
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await Appointment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: updated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating appointment status'
    });
  }
};

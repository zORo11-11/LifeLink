const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// 1. Book an appointment (POST /api/appointments)
router.post('/', appointmentController.bookAppointment);

// 2. View upcoming check-ins for hospital (GET /api/appointments/hospital)
router.get('/hospital', appointmentController.getHospitalAppointments);

// 3. View appointments for a specific donor (GET /api/appointments/donor/:donorId)
router.get('/donor/:donorId', appointmentController.getDonorAppointments);

// 4. Update appointment status (PATCH /api/appointments/:id/status)
router.patch('/:id/status', appointmentController.updateAppointmentStatus);

module.exports = router;

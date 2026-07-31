const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Forces Node to use Google DNS
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); 

const app = express();

// Middleware
app.use(cors()); // ✅ Placed first for cross-origin preflight checks
app.use(express.json());

// Load Routes
const authRoutes = require('./routes/auth');
app.use('/api/donors', authRoutes); // ✅ Connected your registration routes

// Basic health check route
app.get('/', (req, res) => {
  res.send('API is running successfully!');
});
// Hospitals routes
const hospitalRoutes = require('./routes/hospitalauth');
app.use('/api/hospitals',hospitalRoutes);
// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas connected successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000; // ✅ FIXED: Changed from 1234 to 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
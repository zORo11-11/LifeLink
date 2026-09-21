const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Forces Node to use Google DNS

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config(); 

const app = express();
const server = http.createServer(app);

// Enable Socket.io server for real-time bi-directional events
let io;
try {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`⚡ Client connected via Socket.IO: ${socket.id}`);

    // Room-join handler — clients emit this after authenticating so that
    // targeted events (e.g. request_updated to a specific donor/hospital)
    // are delivered correctly instead of falling back to a global broadcast.
    socket.on('join_room', ({ userId, role } = {}) => {
      if (!userId || typeof userId !== 'string') return;

      // Every authenticated user joins their personal user room
      socket.join(`user_${userId}`);

      // Hospitals also join a hospital-specific room used by organ offer events
      if (role === 'hospital') {
        socket.join(`hospital_${userId}`);
      }

      console.log(`🏠 Socket ${socket.id} joined room(s) for ${role || 'user'} [${userId}]`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  app.set('io', io);
} catch (e) {
  console.warn('Socket.io load warning:', e.message);
}

// Middleware
app.use(cors()); // Cross-Origin Resource Sharing
app.use(express.json());

// Load Routes
const authRoutes = require('./routes/auth');
app.use('/api/donors', authRoutes);

const donorRoutes = require('./routes/donorRoutes');
app.use('/api/donors', donorRoutes);

const hospitalRoutes = require('./routes/hospitalauth');
app.use('/api/hospitals', hospitalRoutes);

const reqRoutes = require('./routes/reqRoutes');
app.use('/api/requests', reqRoutes);

const inventoryRoutes = require('./routes/inventoryRoutes');
app.use('/api/inventory', inventoryRoutes);

const organRoutes = require('./routes/organRoutes');
app.use('/api/organ', organRoutes);

const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/appointments', appointmentRoutes);

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'LifeLink Central API is running successfully!' });
});

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas connected successfully!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Start HTTP + Socket.IO Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 LifeLink Server running on port ${PORT}`));
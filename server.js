require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Import services
const { startScheduler } = require('./src/services/schedulerService');
const taskRoutes = require('./src/routes/taskRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io for real-time notifications
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to our routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/tasks', taskRoutes);

// Serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start the server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // Start the scheduler
      startScheduler(io);
    });
  })
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

// Import your Route files
const authRoutes = require('./routes/authRoutes'); 
const sosRoutes = require('./routes/sosRoutes'); // <-- 1. ADD THIS LINE
const shelterRoutes = require('./routes/shelterRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Main API Routes
app.use('/api/auth', authRoutes); 
app.use('/api/sos', sosRoutes); // <-- 2. ADD THIS LINE
app.use('/api/shelters', shelterRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Success' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

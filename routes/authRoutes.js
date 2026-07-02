// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db'); // Imports our database connection

// ==========================================
// 1. USER REGISTRATION ENDPOINT
// ==========================================
router.post('/register', async (req, res) => {
    const { name, email, password, phone, role } = req.body;

    // Simple validation
    if (!name || !email || !password || !phone) {
        return res.status(400).json({ error: 'Please enter all required fields.' });
    }

    try {
        // Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'A user with this email already exists.' });
        }

        // Hash the password securely (10 salt rounds)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Assign default role if none provided
        const userRole = role || 'citizen';

        // Insert new user into the database
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role, created_at',
            [name, email, passwordHash, phone, userRole]
        );

        res.status(201).json({
            message: 'User registered successfully!',
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ==========================================
// 2. USER LOGIN ENDPOINT
// ==========================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    try {
        // Find user by email
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid Email or Password.' });
        }

        const user = result.rows[0];

        // Check if password matches the hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid Email or Password.' });
        }

        // Return user data (excluding password hash for security)
        res.status(200).json({
            message: 'Login successful!',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

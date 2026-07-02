// backend/routes/sosRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const twilio = require('twilio'); // <-- NEW: Import Twilio

// Initialize Twilio using your secret keys
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ==========================================
// RECEIVE NEW SOS ALERT
// ==========================================
router.post('/', async (req, res) => {
    const { userId, latitude, longitude, message } = req.body;

    try {
        // 1. Insert the GPS location into the database
        const newSos = await pool.query(
            'INSERT INTO sos_alerts (user_id, latitude, longitude, message) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, latitude, longitude, message]
        );
        
        // 2. NEW: Fire off the real SMS text message!
        try {
            await twilioClient.messages.create({
                body: `🚨 RESCUENET EMERGENCY 🚨\nA citizen needs help!\nLocation: https://maps.google.com/?q=${latitude},${longitude}\nMessage: ${message}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: process.env.MY_PERSONAL_NUMBER
            });
            console.log("✅ Live SMS Sent to your phone!");
        } catch (smsError) {
            console.error("Twilio SMS failed to send:", smsError.message);
        }

        // 3. Tell the frontend it was successful
        res.status(201).json({ 
            message: 'SOS Alert Saved to Database!', 
            alert: newSos.rows[0] 
        });

    } catch (err) {
        console.error("SOS Database Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error while saving SOS' });
    }
});
module.exports = router;
// ==========================================
// UPDATE SOS STATUS (Dispatch Rescue)
// ==========================================
router.put('/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params; // Get the ID from the URL
        
        // Update the database row
        const updateQuery = await pool.query(
            "UPDATE sos_alerts SET status = 'resolved' WHERE id = $1 RETURNING *",
            [id]
        );
        
        if (updateQuery.rows.length === 0) {
            return res.status(404).json({ error: "Alert not found" });
        }

        res.status(200).json({ 
            message: "Rescue Dispatched! Alert resolved.", 
            alert: updateQuery.rows[0] 
        });
    } catch (err) {
        console.error("Resolve SOS Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ==========================================
// FETCH ALL SOS ALERTS (For Rescuers)
// ==========================================
router.get('/', async (req, res) => {
    try {
        // We use a SQL JOIN to grab the victim's name and phone number from the users table
        const activeAlerts = await pool.query(`
            SELECT s.id, s.latitude, s.longitude, s.message, s.status, s.created_at, 
                   u.name, u.phone 
            FROM sos_alerts s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
        `);
        
        res.status(200).json(activeAlerts.rows);
    } catch (err) {
        console.error("Fetch SOS Error:", err.message);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

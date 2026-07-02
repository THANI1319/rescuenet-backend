const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET ALL SHELTERS
router.get('/', async (req, res) => {
    try {
        const shelters = await pool.query('SELECT * FROM shelters ORDER BY name ASC');
        res.status(200).json(shelters.rows);
    } catch (err) {
        console.error("Shelter Fetch Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;

// ==========================================
// UPDATE SHELTER OCCUPANCY (For Volunteers)
// ==========================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { current_occupancy } = req.body;
        
        const updateQuery = await pool.query(
            "UPDATE shelters SET current_occupancy = $1 WHERE id = $2 RETURNING *",
            [current_occupancy, id]
        );
        
        res.status(200).json({ message: "Shelter updated", shelter: updateQuery.rows[0] });
    } catch (err) {
        console.error("Update Shelter Error:", err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

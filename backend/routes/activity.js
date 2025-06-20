const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const Activity = require('../models/Activity');

router.get('/', authenticate, async(req, res) => {
    try {
        // Allow all authenticated users to see activities
        const activities = await Activity.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('userId', 'name');
        res.json(activities);
    } catch (err) {
        console.error('Activity fetch error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
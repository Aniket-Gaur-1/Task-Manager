const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');

router.post('/', authenticate, async(req, res) => {
    try {
        // Note: This is a stateless JWT setup, so logout is client-side only
        // If using sessions or refresh tokens, invalidate them here
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err.message);
        res.status(500).json({ message: 'Server error during logout' });
    }
});

module.exports = router;
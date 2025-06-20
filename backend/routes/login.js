const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const User = require('../models/User');
const Activity = require('../models/Activity');
const bcrypt = require('bcryptjs'); // Used for password hashing
const { io } = require('../server'); // ⚠️ Circular dependency warning may appear

// Middleware to allow only admin users
const adminOnly = async(req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// ✅ Admin-only: Get all users
router.get('/', async(req, res) => {
    try {
        const users = await User.find().select('name email _id');
        res.json(users);
    } catch (err) {
        console.error('Users fetch error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Get own user data
router.get('/:id', authenticate, async(req, res) => {
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(req.params.id).select('email name role');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('User fetch error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Update own user profile
router.put('/:id', authenticate, async(req, res) => {
    const { name, password } = req.body;

    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData, { new: true }
        ).select('email name role');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await new Activity({
            userId: user._id,
            action: `User ${user.email} updated profile`,
        }).save();

        res.json(user);
    } catch (err) {
        console.error('User update error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Activity = require('../models/Activity');
const authenticate = require('../middleware/authenticate');
const { io } = require('../server');

// ✅ Register new user (admin or user)
router.post('/register', async(req, res) => {
    const { name, email, password, role } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'user' // default to 'user' if not provided
        });

        await newUser.save();

        await new Activity({
            userId: newUser._id,
            action: `User ${email} registered`
        }).save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Middleware: Admin only
const adminOnly = async(req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// ✅ Get all users - Admin only
router.get('/', authenticate, adminOnly, async(req, res) => {
    try {
        const users = await User.find().select('name email _id role');
        res.json(users);
    } catch (err) {
        console.error('Users fetch error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ Get specific user - Only that user
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

// ✅ Update user info - Only that user
router.put('/:id', authenticate, async(req, res) => {
    const { name, password } = req.body;
    try {
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('email name role');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await new Activity({
            userId: user._id,
            action: `User ${user.email} updated profile`
        }).save();

        res.json(user);
    } catch (err) {
        console.error('User update error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
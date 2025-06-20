const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const Project = require('../models/Project');

// Admin-only middleware
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Admin access required' });
    }
};

router.get('/', authenticate, async(req, res) => {
    try {
        // Allow users to see their own projects or all if admin
        const projects = await Project.find({
            $or: [
                { createdBy: req.user.id },
                { members: req.user.id }
            ]
        }).populate('createdBy', 'name').populate('members', 'name');
        res.json(projects);
    } catch (err) {
        console.error('Projects fetch error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', authenticate, adminOnly, async(req, res) => {
    const { name, description } = req.body;
    try {
        const project = new Project({ name, description, createdBy: req.user.id, members: [] });
        await project.save();
        res.status(201).json(project);
    } catch (err) {
        console.error('Project creation error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
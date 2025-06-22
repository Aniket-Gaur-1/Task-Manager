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
        console.log('Fetching projects for user ID:', req.user.id); // Debug
        const projects = await Project.find({
            $or: [
                { createdBy: req.user.id },
                { members: { $in: [req.user.id] } }
            ]
        }).populate('createdBy', 'name').populate('members', 'name');
        // Fallback for admin with undefined id
        const allProjects = req.user.role === 'admin' && !req.user.id ?
            await Project.find().populate('createdBy', 'name').populate('members', 'name') :
            projects;
        console.log('Fetched projects:', allProjects); // Debug
        res.json(allProjects);
    } catch (err) {
        console.error('Projects fetch error:', err.message, err.stack);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.post('/', authenticate, adminOnly, async(req, res) => {
    const { name, description } = req.body;
    try {
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }
        const project = new Project({ name, description, createdBy: req.user.id, members: [] });
        await project.save();
        res.status(201).json(project);
    } catch (err) {
        console.error('Project creation error:', err.message, err.stack);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const User = require('../models/User');

module.exports = (io) => {
    const adminOnly = (req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Admin access required' });
        }
    };

    router.get('/', authenticate, async(req, res) => {
        try {
            const query = {
                $or: [
                    { createdBy: req.user.id },
                    { assignedTo: req.user.id },
                ],
            };
            if (req.query.projectId) {
                query.projectId = req.query.projectId;
            }
            const tasks = await Task.find(query)
                .populate('projectId', 'name')
                .populate('assignedTo', 'name');
            res.json(tasks);
        } catch (err) {
            console.error('Tasks fetch error:', err.message);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    });

    router.get('/:id', authenticate, async(req, res) => {
        try {
            const task = await Task.findOne({
                _id: req.params.id,
                $or: [
                    { createdBy: req.user.id },
                    { assignedTo: req.user.id },
                ],
            }).populate('projectId', 'name').populate('assignedTo', 'name');
            if (!task) return res.status(404).json({ message: 'Task not found' });
            res.json(task);
        } catch (err) {
            console.error('Task fetch error:', err.message);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    });

    router.post('/', authenticate, adminOnly, async(req, res) => {
        const { title, description, projectId, status, dueDate, assignedTo } = req.body;
        try {
            if (!title) {
                return res.status(400).json({ message: 'Title is required' });
            }

            const taskData = {
                title,
                description: description || '',
                projectId: projectId || null,
                status: status || 'To Do',
                dueDate: dueDate ? new Date(dueDate) : null,
                createdBy: req.user.id,
                assignedTo: assignedTo || null,
            };

            if (projectId) {
                const project = await Project.findById(projectId);
                if (!project) {
                    return res.status(400).json({ message: 'Invalid project ID' });
                }
            }

            if (assignedTo) {
                const user = await User.findById(assignedTo);
                if (!user) {
                    return res.status(400).json({ message: 'Invalid user ID for assignedTo' });
                }
            }

            const task = new Task(taskData);
            await task.save();
            await new Activity({ userId: req.user.id, action: `Created task ${title}` }).save();
            const populatedTask = await Task.findById(task._id)
                .populate('projectId', 'name')
                .populate('assignedTo', 'name');
            if (io) io.emit('taskCreated', populatedTask);
            res.status(201).json(populatedTask);
        } catch (err) {
            console.error('Task creation error:', err.message, err.stack);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    });

    router.put('/:id', authenticate, adminOnly, async(req, res) => {
        const { title, description, projectId, status, dueDate, assignedTo } = req.body;
        try {
            const task = await Task.findOneAndUpdate({ _id: req.params.id, createdBy: req.user.id }, {
                title,
                description,
                projectId,
                status,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                assignedTo: assignedTo || undefined,
            }, { new: true }).populate('projectId', 'name').populate('assignedTo', 'name');
            if (!task) return res.status(404).json({ message: 'Task not found' });
            await new Activity({ userId: req.user.id, action: `Updated task ${title}` }).save();
            if (io) io.emit('taskUpdated', task);
            res.json(task);
        } catch (err) {
            console.error('Task update error:', err.message);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    });

    router.patch('/:id/status', authenticate, async(req, res) => {
        const { status } = req.body;
        try {
            if (!['To Do', 'In Progress', 'Done'].includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }
            const task = await Task.findOne({
                _id: req.params.id,
                $or: [
                    { createdBy: req.user.id },
                    { assignedTo: req.user.id },
                    { projectId: { $in: await Project.find({ createdBy: req.user.id }).distinct('_id') } },
                ],
            }).populate('projectId', 'createdBy');
            if (!task) return res.status(404).json({ message: 'Task not found' });
            task.status = status;
            await task.save();
            await new Activity({ userId: req.user.id, action: `Updated task ${task.title} status to ${status}` }).save();
            const updatedTask = await Task.findById(req.params.id)
                .populate('projectId', 'name')
                .populate('assignedTo', 'name');
            if (io) io.emit('taskUpdated', updatedTask);
            res.json(updatedTask);
        } catch (err) {
            console.error('Task status update error:', err.message);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    });

    return router;
};
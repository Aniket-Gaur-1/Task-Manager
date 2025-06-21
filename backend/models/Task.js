const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    dueDate: { type: Date }, // Changed from deadline
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Low' },
    status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Made optional
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Made optional
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
});

module.exports = mongoose.model('Task', taskSchema);
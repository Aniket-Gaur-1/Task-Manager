const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    deadline: { type: Date, required: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Low' },
    status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
});

module.exports = mongoose.model('Task', taskSchema);
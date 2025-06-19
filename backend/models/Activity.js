const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    action: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Activity', activitySchema);
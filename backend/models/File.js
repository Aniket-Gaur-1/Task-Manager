const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('File', fileSchema);
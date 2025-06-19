const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Project", projectSchema);
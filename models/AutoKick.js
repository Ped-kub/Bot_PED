const mongoose = require('mongoose');

const autoKickSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    addedBy: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AutoKick', autoKickSchema);
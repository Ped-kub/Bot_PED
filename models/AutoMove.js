const mongoose = require('mongoose');

const autoMoveSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    targetChannelId: { type: String, required: true }, // ID ของห้องปลายทาง
    addedBy: { type: String },
    timestamp: { type: Date, default: Date.now }
});

// กำหนดให้ 1 คน ใน 1 เซิร์ฟเวอร์ มีได้ 1 เป้าหมายเท่านั้น
autoMoveSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('AutoMove', autoMoveSchema);
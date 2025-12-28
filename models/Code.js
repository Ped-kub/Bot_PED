const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    points: { type: Number, required: true },
    maxUses: { type: Number, default: 1 }, // จำนวนคนที่ใช้ได้สูงสุด
    usedBy: { type: [String], default: [] }, // เก็บ Array ID คนที่เติมไปแล้ว
    createdBy: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Code', codeSchema);
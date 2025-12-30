const mongoose = require('mongoose');

const codeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    points: { type: Number, default: 0 },
    reward: { type: String, default: null },
    maxUses: { type: Number, required: true },
    usedBy: { type: [String], default: [] },
    
    // 👇 เพิ่มช่องนี้ครับ (เก็บวันที่หมดอายุ)
    expiresAt: { type: Date, default: null }, 
    
    createdBy: { type: String }
});

module.exports = mongoose.model('Code', codeSchema);
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    points: { type: Number, default: 0 },
    lastGencode: { type: Date, default: null } 
});

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
username: { type: String, required: true },
  email: { type: String, required: true },
  profilePic: String, // Optional
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
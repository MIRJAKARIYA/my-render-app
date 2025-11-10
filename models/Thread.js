// server/models/Thread.js
const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // <-- ref: 'Post'
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Thread', threadSchema);
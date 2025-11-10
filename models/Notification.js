// server/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['new_thread', 'reply', 'mention'], required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }, // NEW: for navigation
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, // NEW: for reply navigation
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who sent it
  message: String, // Custom message, e.g., "User X replied to your post"
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
// server/models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thread: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // NEW
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Post', postSchema);
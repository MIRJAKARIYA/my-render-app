const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const admin = require('firebase-admin');
const Notification = require('../models/Notification');
const router = express.Router();
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: 'Invalid token' });
  }
};
// Create/Update Profile (called after Firebase signup/login)
router.post('/profile', async (req, res) => {
  console.log(req.body)
  const schema = Joi.object({ username: Joi.string().required(), email: Joi.string().email().required(),profilePic:Joi.string() });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      user = new User({ firebaseUid: req.user.uid, ...req.body });
    } else {
      user.username = req.body.username;
      user.email = req.body.email;
    }
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Profile
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// server/routes/users.js (add this route)
router.get('/notifications', authenticate, async (req, res) => {
  try {
    // Find the MongoDB User document using Firebase UID
    const mongoUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!mongoUser) return res.status(404).json({ message: 'User not found' });

    const notifications = await Notification.find({ user: mongoUser._id })
      .populate('fromUser', 'username')
      .populate('threadId', 'title')
      .populate('postId', 'content')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark as read (optional)
router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.uid },
      { read: true },
      { new: true }
    );
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
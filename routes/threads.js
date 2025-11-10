// const express = require('express');
// const Joi = require('joi');
// const Thread = require('../models/Thread');
// const Post = require('../models/Post');
// const User = require('../models/User');
// const admin = require('firebase-admin');
// // const authenticate = require('../middlewares/auth'); // Wait, it's in index.js, but for consistency, extract if needed
// const authenticate = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
  
//   if (!token) return res.status(401).json({ message: 'Unauthorized' });
//   try {
//     const decoded = await admin.auth().verifyIdToken(token);
//     console.log("decoded",decoded)
//     req.user = decoded;
//     next();
//   } catch (err) {
//     console.log(err)
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };
// const router = express.Router();

// // Create Thread (Auth)
// router.post('/', authenticate, async (req, res) => {
//   const schema = Joi.object({ title: Joi.string().required(), initialContent: Joi.string().required() });
//   const { error } = schema.validate(req.body);
//   if (error) return res.status(400).json({ message: error.details[0].message });

//   try {
//     const user = await User.findOne({ firebaseUid: req.user.uid });
//     const thread = new Thread({ title: req.body.title, creator: user._id });
//     await thread.save();

//     const initialPost = new Post({ content: req.body.initialContent, author: user._id, thread: thread._id });
//     await initialPost.save();

//     thread.posts.push(initialPost._id);
//     await thread.save();

//     res.json(thread);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // List Threads (Public, with search)
// router.get('/', async (req, res) => {
//   const { keyword } = req.query;
//   const query = keyword ? { title: { $regex: keyword, $options: 'i' } } : {};
//   try {
//     const threads = await Thread.find(query).populate('creator', 'username').sort({ lastActivity: -1 });
//     res.json(threads);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get Thread by ID (Public)
// // GET thread by ID
// router.get('/:id', async (req, res) => {
//   try {
//     const thread = await Thread.findById(req.params.id)
//       .populate({
//         path: 'posts',
//         populate: { path: 'author', select: 'username' }
//       })
//       .populate('creator', 'username');

//     if (!thread) return res.status(404).json({ message: 'Thread not found' });

//     res.json(thread);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });
// // Admin Delete Thread
// router.delete('/:id', authenticate, async (req, res) => {
//   // Add admin check if needed (e.g., user.role === 'admin')
//   try {
//     await Thread.findByIdAndDelete(req.params.id);
//     await Post.deleteMany({ thread: req.params.id });
//     res.json({ message: 'Thread deleted' });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;



// const express = require('express');
// const Joi = require('joi');
// const Thread = require('../models/Thread');
// const Post = require('../models/Post');
// const User = require('../models/User');
// const Notification = require('../models/Notification'); // ← ADD THIS
// const admin = require('firebase-admin');

// const authenticate = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ message: 'Unauthorized' });
//   try {
//     const decoded = await admin.auth().verifyIdToken(token);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     console.log(err);
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

// const router = express.Router();

// // CREATE THREAD (Auth) – WITH NOTIFICATIONS
// router.post('/', authenticate, async (req, res) => {
//   const schema = Joi.object({ 
//     title: Joi.string().required(), 
//     initialContent: Joi.string().required() 
//   });
//   const { error } = schema.validate(req.body);
//   if (error) return res.status(400).json({ message: error.details[0].message });

//   try {
//     const user = await User.findOne({ firebaseUid: req.user.uid });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // Create thread
//     const thread = new Thread({ 
//       title: req.body.title, 
//       creator: user._id 
//     });
//     await thread.save();

//     // Create initial post
//     const initialPost = new Post({ 
//       content: req.body.initialContent, 
//       author: user._id, 
//       thread: thread._id 
//     });
//     await initialPost.save();

//     thread.posts.push(initialPost._id);
//     await thread.save();

//     // === NOTIFICATION SYSTEM START ===
//     const io = req.app.get('io');

//     // 1. Broadcast to ALL connected users via Socket.io
//     io.emit('newThread', {
//       type: 'new_thread',
//       threadId: thread._id,
//       title: thread.title,
//       creator: user.username,
//       message: `${user.username} created a new thread: "${thread.title}"`
//     });

//     // 2. Save notification for EVERY user in DB
//     const allUsers = await User.find({}, '_id');
//     const notifications = allUsers.map(u => ({
//       user: u._id,
//       type: 'new_thread',
//       threadId: thread._id,
//       fromUser: user._id,
//       message: `${user.username} created a new thread: "${thread.title}"`,
//       read: false
//     }));

//     await Notification.insertMany(notifications);
//     // === NOTIFICATION SYSTEM END ===

//     res.status(201).json(thread);
//   } catch (err) {
//     console.error('Thread creation error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // LIST THREADS (Public, with search)
// router.get('/', async (req, res) => {
//   const { keyword } = req.query;
//   const query = keyword ? { title: { $regex: keyword, $options: 'i' } } : {};
//   try {
//     const threads = await Thread.find(query)
//       .populate('creator', 'username')
//       .sort({ lastActivity: -1 });
//     res.json(threads);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // GET THREAD BY ID (Public)
// router.get('/:id', async (req, res) => {
//   try {
//     const thread = await Thread.findById(req.params.id)
//       .populate({
//         path: 'posts',
//         populate: { path: 'author', select: 'username' }
//       })
//       .populate('creator', 'username');

//     if (!thread) return res.status(404).json({ message: 'Thread not found' });
//     res.json(thread);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // ADMIN DELETE THREAD
// router.delete('/:id', authenticate, async (req, res) => {
//   try {
//     await Thread.findByIdAndDelete(req.params.id);
//     await Post.deleteMany({ thread: req.params.id });
//     res.json({ message: 'Thread deleted' });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;










const express = require('express');
const Joi = require('joi');
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const admin = require('firebase-admin');

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

const router = express.Router();

// CREATE THREAD (Auth) – WITH NOTIFICATIONS
router.post('/', authenticate, async (req, res) => {
  const schema = Joi.object({ 
    title: Joi.string().required(), 
    initialContent: Joi.string().required() 
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    // Find MongoDB user from Firebase UID
    const mongoUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!mongoUser) return res.status(404).json({ message: 'User not found' });

    // Create thread
    const thread = new Thread({ 
      title: req.body.title, 
      creator: mongoUser._id 
    });
    await thread.save();

    // Create initial post
    const initialPost = new Post({ 
      content: req.body.initialContent, 
      author: mongoUser._id, 
      thread: thread._id 
    });
    await initialPost.save();

    thread.posts.push(initialPost._id);
    await thread.save();

    // === NOTIFICATION SYSTEM START ===
    const io = req.app.get('io');

    // 1. Broadcast to ALL connected users via Socket.io
    io.emit('newThread', {
      type: 'new_thread',
      threadId: thread._id,
      title: thread.title,
      creator: mongoUser.username,
      message: `${mongoUser.username} created a new thread: "${thread.title}"`
    });

    // 2. Save notification for EVERY user in DB
    const allUsers = await User.find({}, '_id');
    const notifications = allUsers.map(u => new Notification({
      user: u._id,                    // ← MongoDB _id
      type: 'new_thread',
      threadId: thread._id,
      fromUser: mongoUser._id,        // ← MongoDB _id
      message: `${mongoUser.username} created a new thread: "${thread.title}"`,
      read: false
    }));

    await Notification.insertMany(notifications);
    // === NOTIFICATION SYSTEM END ===

    res.status(201).json(thread);
  } catch (err) {
    console.error('Thread creation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// LIST THREADS (Public, with search)
router.get('/', async (req, res) => {
  const { keyword } = req.query;
  const query = keyword ? { title: { $regex: keyword, $options: 'i' } } : {};
  try {
    const threads = await Thread.find(query)
      .populate('creator', 'username')
      .sort({ lastActivity: -1 });
    res.json(threads);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET THREAD BY ID (Public)
router.get('/:id', async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id)
      .populate({
        path: 'posts',
        populate: { path: 'author', select: 'username' }
      })
      .populate('creator', 'username');

    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN DELETE THREAD
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await Thread.findByIdAndDelete(req.params.id);
    await Post.deleteMany({ thread: req.params.id });
    res.json({ message: 'Thread deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
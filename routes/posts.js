
// const express = require('express');
// const Joi = require('joi');
// const Post = require('../models/Post');
// const Thread = require('../models/Thread');
// const Notification = require('../models/Notification');
// const User = require('../models/User');
// const admin = require('firebase-admin');

// const router = express.Router();

// const authenticate = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ message: 'Unauthorized' });
//   try {
//     const decoded = await admin.auth().verifyIdToken(token);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

// /* ---------- CREATE POST / REPLY ---------- */
// router.post('/', authenticate, async (req, res) => {
//   // NOTE: parentId is OPTIONAL and must be a string when present
//   const schema = Joi.object({
//     content: Joi.string().trim().min(1).required(),
//     threadId: Joi.string().required(),
//     parentId: Joi.string().optional().allow(null, ''), // <-- FIX
//   });

//   const { error } = schema.validate(req.body);
//   if (error) return res.status(400).json({ message: error.details[0].message });

//   try {
//     const user = await User.findOne({ firebaseUid: req.user.uid });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const post = new Post({
//       content: req.body.content,
//       author: user._id,
//       thread: req.body.threadId,
//       parent: req.body.parentId || null, // keep null if not supplied
//       likes: [],
//     });
//     await post.save();

//     const thread = await Thread.findById(req.body.threadId);
//     if (!thread) return res.status(404).json({ message: 'Thread not found' });
//     thread.posts.push(post._id);
//     thread.lastActivity = Date.now();
//     await thread.save();

//     const io = req.app.get('io');

//     // ---- Clean object for socket ----
//     const populatedPost = await Post.findById(post._id)
//       .populate('author', 'username')
//       .lean();

//     const cleanPost = {
//       ...populatedPost,
//       replies: [],
//       likesCount: Array.isArray(populatedPost.likes) ? populatedPost.likes.length : 0,
//       hasLiked: false,
//     };

//     io.to(req.body.threadId).emit('newPost', cleanPost);

//     // ---- REPLY NOTIFICATION ----
//     if (req.body.parentId) {
//       const parentPost = await Post.findById(req.body.parentId).populate('author');
//       if (parentPost && parentPost.author._id.toString() !== user._id.toString()) {
//         const notif = new Notification({
//           user: parentPost.author._id,
//           type: 'reply',
//           post: post._id,
//         });
//         await notif.save();
//         io.to(parentPost.author._id.toString()).emit('notification', {
//           type: 'reply',
//           post: { _id: post._id, content: post.content },
//           from: user.username,
//         });
//       }
//     }

//     // ---- MENTION NOTIFICATION ----
//     const mentions = req.body.content.match(/@(\w+)/g);
//     if (mentions) {
//       for (const m of mentions) {
//         const username = m.slice(1);
//         const mentioned = await User.findOne({ username });
//         if (mentioned && mentioned._id.toString() !== user._id.toString()) {
//           const notif = new Notification({
//             user: mentioned._id,
//             type: 'mention',
//             post: post._id,
//           });
//           await notif.save();
//           io.to(mentioned._id.toString()).emit('notification', {
//             type: 'mention',
//             post: { _id: post._id, content: post.content },
//             from: user.username,
//           });
//         }
//       }
//     }

//     res.status(201).json(cleanPost);
//   } catch (err) {
//     console.error('Post creation error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// /* ---------- LIKE POST ---------- */
// router.post('/:id/like', authenticate, async (req, res) => {
//   try {
//     const user = await User.findOne({ firebaseUid: req.user.uid });
//     const post = await Post.findById(req.params.id);
//     if (!post) return res.status(404).json({ message: 'Post not found' });

//     const userIdStr = user._id.toString();
//     const hasLiked = post.likes.includes(user._id);

//     if (hasLiked) {
//       post.likes = post.likes.filter(id => id.toString() !== userIdStr);
//     } else {
//       post.likes.push(user._id);
//     }
//     await post.save();

//     const io = req.app.get('io');
//     const thread = await Thread.findOne({ posts: post._id });
//     if (thread) {
//       io.to(thread._id.toString()).emit('postLiked', {
//         postId: post._id,
//         likesCount: post.likes.length,
//         hasLiked: !hasLiked,
//       });
//     }

//     res.json({ likesCount: post.likes.length, hasLiked: !hasLiked });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;


// const express = require('express');
// const Joi = require('joi');
// const Post = require('../models/Post');
// const Thread = require('../models/Thread');
// const Notification = require('../models/Notification');
// const User = require('../models/User');
// const admin = require('firebase-admin');

// const router = express.Router();

// const authenticate = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ message: 'Unauthorized' });
//   try {
//     const decoded = await admin.auth().verifyIdToken(token);
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

// /* ---------- CREATE POST / REPLY ---------- */
// router.post('/', authenticate, async (req, res) => {
//   const schema = Joi.object({
//     content: Joi.string().trim().min(1).required(),
//     threadId: Joi.string().required(),
//     parentId: Joi.string().optional().allow(null, ''),
//   });

//   const { error } = schema.validate(req.body);
//   if (error) return res.status(400).json({ message: error.details[0].message });

//   try {
//     const user = await User.findOne({ firebaseUid: req.user.uid });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const post = new Post({
//       content: req.body.content,
//       author: user._id,
//       thread: req.body.threadId,
//       parent: req.body.parentId || null,
//       likes: [],
//     });
//     await post.save();

//     const thread = await Thread.findById(req.body.threadId);
//     if (!thread) return res.status(404).json({ message: 'Thread not found' });
//     thread.posts.push(post._id);
//     thread.lastActivity = Date.now();
//     await thread.save();

//     const io = req.app.get('io');

//     // Clean object for socket
//     const populatedPost = await Post.findById(post._id)
//       .populate('author', 'username')
//       .lean();

//     const cleanPost = {
//       ...populatedPost,
//       replies: [],
//       likesCount: Array.isArray(populatedPost.likes) ? populatedPost.likes.length : 0,
//       hasLiked: false,
//     };

//     io.to(req.body.threadId).emit('newPost', cleanPost);

//     // === REPLY NOTIFICATION (ENHANCED) ===
//     if (req.body.parentId) {
//       const parentPost = await Post.findById(req.body.parentId).populate('author');
//       if (parentPost && parentPost.author._id.toString() !== user._id.toString()) {
//         const notif = new Notification({
//           user: parentPost.author._id,
//           type: 'reply',
//           post: post._id,
//           postId: post._id,           // NEW: for frontend navigation
//           threadId: req.body.threadId, // NEW: for navigation
//           fromUser: user._id,          // NEW: who replied
//           message: `${user.username} replied to your post` // NEW: human-readable
//         });
//         await notif.save();

//         io.to(parentPost.author._id.toString()).emit('notification', {
//           ...notif.toObject(),
//           from: user.username
//         });
//       }
//     }

//     // === MENTION NOTIFICATION (ENHANCED) ===
//     const mentions = req.body.content.match(/@(\w+)/g);
//     if (mentions) {
//       for (const mention of mentions) {
//         const username = mention.slice(1);
//         const mentionedUser = await User.findOne({ username });
//         if (mentionedUser && mentionedUser._id.toString() !== user._id.toString()) {
//           const notif = new Notification({
//             user: mentionedUser._id,
//             type: 'mention',
//             post: post._id,
//             postId: post._id,           // NEW
//             threadId: req.body.threadId, // NEW
//             fromUser: user._id,          // NEW
//             message: `${user.username} mentioned you in a post` // NEW
//           });
//           await notif.save();

//           io.to(mentionedUser._id.toString()).emit('notification', {
//             ...notif.toObject(),
//             from: user.username
//           });
//         }
//       }
//     }

//     res.status(201).json(cleanPost);
//   } catch (err) {
//     console.error('Post creation error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// /* ---------- LIKE POST ---------- */
// router.post('/:id/like', authenticate, async (req, res) => {
//   try {
//     const user = await User.findOne({ firebaseUid: req.user.uid });
//     const post = await Post.findById(req.params.id);
//     if (!post) return res.status(404).json({ message: 'Post not found' });

//     const userIdStr = user._id.toString();
//     const hasLiked = post.likes.includes(user._id);

//     if (hasLiked) {
//       post.likes = post.likes.filter(id => id.toString() !== userIdStr);
//     } else {
//       post.likes.push(user._id);
//     }
//     await post.save();

//     const io = req.app.get('io');
//     const thread = await Thread.findOne({ posts: post._id });
//     if (thread) {
//       io.to(thread._id.toString()).emit('postLiked', {
//         postId: post._id,
//         likesCount: post.likes.length,
//         hasLiked: !hasLiked,
//       });
//     }

//     res.json({ likesCount: post.likes.length, hasLiked: !hasLiked });
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;



const express = require('express');
const Joi = require('joi');
const Post = require('../models/Post');
const Thread = require('../models/Thread');
const Notification = require('../models/Notification');
const User = require('../models/User');
const admin = require('firebase-admin');

const router = express.Router();

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

/* ---------- CREATE POST / REPLY ---------- */
router.post('/', authenticate, async (req, res) => {
  const schema = Joi.object({
    content: Joi.string().trim().min(1).required(),
    threadId: Joi.string().required(),
    parentId: Joi.string().optional().allow(null, ''),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    // Find current user in MongoDB using Firebase UID
    const currentMongoUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!currentMongoUser) return res.status(404).json({ message: 'User not found' });

    const post = new Post({
      content: req.body.content,
      author: currentMongoUser._id,
      thread: req.body.threadId,
      parent: req.body.parentId || null,
      likes: [],
    });
    await post.save();

    const thread = await Thread.findById(req.body.threadId);
    if (!thread) return res.status(404).json({ message: 'Thread not found' });
    thread.posts.push(post._id);
    thread.lastActivity = Date.now();
    await thread.save();

    const io = req.app.get('io');

    // Clean object for socket
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username')
      .lean();

    const cleanPost = {
      ...populatedPost,
      replies: [],
      likesCount: Array.isArray(populatedPost.likes) ? populatedPost.likes.length : 0,
      hasLiked: false,
    };

    io.to(req.body.threadId).emit('newPost', cleanPost);

    // === REPLY NOTIFICATION (ENHANCED) ===
    if (req.body.parentId) {
      const parentPost = await Post.findById(req.body.parentId).populate('author');
      if (parentPost && parentPost.author._id.toString() !== currentMongoUser._id.toString()) {
        const parentMongoUser = parentPost.author; // Already populated

        const notif = new Notification({
          user: parentMongoUser._id,           // ← MongoDB _id
          type: 'reply',
          postId: post._id,
          threadId: req.body.threadId,
          fromUser: currentMongoUser._id,      // ← MongoDB _id
          message: `${currentMongoUser.username} replied to your post`
        });
        await notif.save();

        io.to(parentMongoUser._id.toString()).emit('notification', {
          ...notif.toObject(),
          from: currentMongoUser.username
        });
      }
    }

    // === MENTION NOTIFICATION (ENHANCED) ===
    const mentions = req.body.content.match(/@(\w+)/g);
    if (mentions) {
      for (const mention of mentions) {
        const username = mention.slice(1);
        const mentionedMongoUser = await User.findOne({ username });
        if (mentionedMongoUser && mentionedMongoUser._id.toString() !== currentMongoUser._id.toString()) {
          const notif = new Notification({
            user: mentionedMongoUser._id,        // ← MongoDB _id
            type: 'mention',
            postId: post._id,
            threadId: req.body.threadId,
            fromUser: currentMongoUser._id,      // ← MongoDB _id
            message: `${currentMongoUser.username} mentioned you in a post`
          });
          await notif.save();

          io.to(mentionedMongoUser._id.toString()).emit('notification', {
            ...notif.toObject(),
            from: currentMongoUser.username
          });
        }
      }
    }

    res.status(201).json(cleanPost);
  } catch (err) {
    console.error('Post creation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ author: user._id })
      .populate('thread', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ---------- LIKE POST ---------- */
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const currentMongoUser = await User.findOne({ firebaseUid: req.user.uid });
    if (!currentMongoUser) return res.status(404).json({ message: 'User not found' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userIdStr = currentMongoUser._id.toString();
    const hasLiked = post.likes.includes(currentMongoUser._id);

    if (hasLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userIdStr);
    } else {
      post.likes.push(currentMongoUser._id);
    }
    await post.save();

    const io = req.app.get('io');
    const thread = await Thread.findOne({ posts: post._id });
    if (thread) {
      io.to(thread._id.toString()).emit('postLiked', {
        postId: post._id,
        likesCount: post.likes.length,
        hasLiked: !hasLiked,
      });
    }

    res.json({ likesCount: post.likes.length, hasLiked: !hasLiked });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
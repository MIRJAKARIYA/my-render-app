const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
dotenv.config();
const admin = require('firebase-admin');
const path = require('path');


// Routes (import later)
const userRoutes = require('./routes/users');
const threadRoutes = require('./routes/threads');
const postRoutes = require('./routes/posts');
const aiRoutes = require('./routes/ai');



const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});
app.set('io', io)
// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(helmet());
app.use(express.json());

// Firebase Init
admin.initializeApp({
  credential: admin.credential.cert(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH))
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Auth Middleware (Verify Firebase JWT)
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



app.use('/api/users', authenticate, userRoutes);
app.use('/api/threads', threadRoutes); // Some public, some auth
app.use('/api/posts', authenticate, postRoutes);
app.use('/api/ai', authenticate, aiRoutes);

// Socket.io for Real-Time
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinThread', (threadId) => {
    socket.join(threadId);
  });

  socket.on('newPost', (data) => {
    io.to(data.threadId).emit('updateThread', data);
    // Notify mentioned users or repliers
    if (data.mention) io.to(data.mention.userId).emit('notification', { type: 'mention', post: data });
  });

  socket.on('disconnect', () => console.log('User disconnected'));
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
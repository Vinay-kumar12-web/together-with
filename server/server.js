require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');

const app    = express();
const server = http.createServer(app);

// ── Socket.io ────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 1e8 // 100MB for large messages
});

// ── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Routes ───────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth.routes'));
app.use('/api/rooms',  require('./routes/room.routes'));
app.use('/api/videos', require('./routes/video.routes'));

// ── Video Streaming (Range request support for low bandwidth) ──
app.get('/stream/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Video not found' });
  }

  const stat    = fs.statSync(filePath);
  const fileSize = stat.size;
  const range   = req.headers.range;

  if (range) {
    // Chunked streaming — sends only requested byte range
    // This is what makes video smooth on low bandwidth
    const parts  = range.replace(/bytes=/, '').split('-');
    const start  = parseInt(parts[0], 10);
    const end    = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1); // 1MB chunks
    const chunkSize = (end - start) + 1;

    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': chunkSize,
      'Content-Type':   'video/mp4',
      'Cache-Control':  'no-cache'
    });

    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);
  } else {
    // Full file stream (fallback)
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type':   'video/mp4',
      'Accept-Ranges':  'bytes'
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

// ── Socket.io Real-time Logic ────────────────────────────
// Track who is in which room
const roomUsers = {}; // roomId -> [{ socketId, userId, userName }]

io.on('connection', (socket) => {
  console.log('🔌 Connected:', socket.id);

  // User joins a watch room
  socket.on('join_room', ({ roomId, userId, userName }) => {
    socket.join(roomId);
    socket.data = { roomId, userId, userName };

    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    // Remove old socket for same user if reconnecting
    roomUsers[roomId] = roomUsers[roomId].filter(u => u.userId !== userId);
    roomUsers[roomId].push({ socketId: socket.id, userId, userName });

    // Notify everyone in room
    io.to(roomId).emit('room_users', roomUsers[roomId]);
    socket.to(roomId).emit('user_joined', { userName });
    console.log(`👥 ${userName} joined room ${roomId}`);
  });

  // ── Chat messages ──
  socket.on('send_message', (data) => {
    // Broadcast to everyone in room INCLUDING sender
    io.to(data.roomId).emit('receive_message', {
      id:       Date.now(),
      userId:   data.userId,
      userName: data.userName,
      content:  data.content,
      time:     new Date().toISOString()
    });
  });

  // ── Video sync events ──
  // When one person plays/pauses/seeks, broadcast to partner
  socket.on('video_play', ({ roomId, currentTime }) => {
    socket.to(roomId).emit('video_play', { currentTime });
  });

  socket.on('video_pause', ({ roomId, currentTime }) => {
    socket.to(roomId).emit('video_pause', { currentTime });
  });

  socket.on('video_seek', ({ roomId, currentTime }) => {
    socket.to(roomId).emit('video_seek', { currentTime });
  });

  socket.on('video_change', ({ roomId, videoId, title }) => {
    socket.to(roomId).emit('video_change', { videoId, title });
  });

  // ── Heartbeat / typing ──
  socket.on('typing', ({ roomId, userName }) => {
    socket.to(roomId).emit('typing', { userName });
  });

  socket.on('stop_typing', ({ roomId }) => {
    socket.to(roomId).emit('stop_typing');
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    const { roomId, userName } = socket.data || {};
    if (roomId) {
      roomUsers[roomId] = (roomUsers[roomId] || []).filter(u => u.socketId !== socket.id);
      io.to(roomId).emit('room_users', roomUsers[roomId]);
      socket.to(roomId).emit('user_left', { userName });
    }
    console.log('❌ Disconnected:', socket.id);
  });
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 TogetherWatch server on http://localhost:${PORT}`);
});

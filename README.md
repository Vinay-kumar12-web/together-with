# 💑 TogetherWatch — Watch Movies Together

Stream videos from local storage, chat in real-time, and feel close even when apart.

## ✨ Features
- 🔐 Login & invite system with private room links
- 🎬 Upload & stream local videos (optimized for low bandwidth)
- 🔄 Synchronized playback — play/pause/seek together in real-time
- 💬 Live chat with emoji support
- 💾 Supabase (PostgreSQL) for users, rooms, messages
- ⚡ Socket.io for zero-lag real-time sync

## 🛠 Tech Stack
- **Frontend:** React 18 + React Router
- **Backend:** Node.js + Express + Socket.io
- **Database:** Supabase (PostgreSQL) — free tier
- **Video:** Chunked HTTP streaming (Range requests)

---

## 🚀 Quick Start

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) → create free project
2. Go to SQL Editor → run the SQL in `server/config/schema.sql`
3. Go to Settings → API → copy your `URL` and `anon key`

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Fill in your Supabase URL and key in .env
npm run dev
```
Server runs on **http://localhost:5000**

### 3. Frontend Setup
```bash
cd client
npm install
npm start
```
App runs on **http://localhost:3000**

---

## 📁 Structure
```
togetherwatch/
├── server/
│   ├── server.js          ← Express + Socket.io entry
│   ├── config/
│   │   ├── supabase.js    ← Supabase client
│   │   └── schema.sql     ← Run this in Supabase SQL editor
│   ├── controllers/       ← Route logic
│   ├── middleware/        ← Auth, upload
│   ├── routes/            ← API routes
│   └── uploads/           ← Video files stored here
└── client/
    └── src/
        ├── pages/         ← Login, Room, Home
        ├── components/    ← VideoPlayer, Chat, Navbar
        └── context/       ← AuthContext, SocketContext
```

## 🔑 Environment Variables

### server/.env
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_long_random_secret
PORT=5000
CLIENT_URL=http://localhost:3000
```

### client/.env
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

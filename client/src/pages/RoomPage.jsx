import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import VideoPlayer from '../components/VideoPlayer';
import Chat        from '../components/Chat';
import VideoList   from '../components/VideoList';

export default function RoomPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();
  const { socket } = useSocket();

  const [room,    setRoom]    = useState(null);
  const [videos,  setVideos]  = useState([]);
  const [messages,setMessages]= useState([]);
  const [members, setMembers] = useState([]);
  const [current, setCurrent] = useState(null);
  const [online,  setOnline]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);
  const [tab,     setTab]     = useState('chat'); // 'chat' | 'videos' on mobile

  // Load room data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res  = await authFetch(`/api/rooms/${id}`);
        if (!res.ok) { navigate('/'); return; }
        const data = await res.json();
        setRoom(data.room);
        setVideos(data.videos || []);
        setMessages(data.messages || []);
        setMembers(data.members || []);
        if (data.videos?.length > 0) setCurrent(data.videos[0]);
      } catch { navigate('/'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  // Join socket room
  useEffect(() => {
    if (!socket || !user || !room) return;
    socket.emit('join_room', { roomId: id, userId: user.id, userName: user.name });

    socket.on('room_users',  setOnline);
    socket.on('user_joined', ({ userName }) => {
      // Show join notification in chat
      setMessages(prev => [...prev, {
        id: Date.now(), userId: 'system', userName: 'System',
        content: `💑 ${userName} joined the room`, time: new Date().toISOString()
      }]);
    });
    socket.on('user_left', ({ userName }) => {
      setMessages(prev => [...prev, {
        id: Date.now(), userId: 'system', userName: 'System',
        content: `👋 ${userName} left the room`, time: new Date().toISOString()
      }]);
    });

    // Partner changed video
    socket.on('video_change', ({ videoId }) => {
      setVideos(prev => {
        const v = prev.find(x => x.id === videoId);
        if (v) setCurrent(v);
        return prev;
      });
    });

    return () => {
      socket.off('room_users');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('video_change');
    };
  }, [socket, user, room, id]);

  const handleSelectVideo = (video) => {
    setCurrent(video);
    if (socket) socket.emit('video_change', { roomId: id, videoId: video.id, title: video.title });
    if (window.innerWidth < 768) setTab('chat');
  };

  const handleVideoUpload = (video) => {
    setVideos(prev => [video, ...prev]);
    setCurrent(video);
    if (socket) socket.emit('video_change', { roomId: id, videoId: video.id, title: video.title });
  };

  const copyCode = () => {
    if (room) { navigator.clipboard.writeText(room.invite_code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const isOnline = (uid) => online.some(u => u.userId === uid);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', color: 'rgba(240,232,224,0.4)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem', animation: 'pulse 1.5s infinite' }}>💑</div>
        <p>Setting up your room...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0d0a0f', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Top bar */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(13,10,15,0.95)', backdropFilter: 'blur(10px)', flexWrap: 'wrap', zIndex: 100 }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'rgba(240,232,224,0.4)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.3rem', marginRight: '0.25rem' }}>
          ← Back
        </button>

        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 600, color: '#f0e8e0' }}>
          {room?.name}
        </span>

        {/* Online indicators */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {members.map(m => (
            <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOnline(m.user_id) ? '#90e890' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.72rem', color: 'rgba(240,232,224,0.5)' }}>{m.users?.name}</span>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Invite code */}
        <button onClick={copyCode}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.35rem 0.85rem', color: copied ? '#90e890' : 'rgba(240,232,224,0.5)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.1em', transition: 'color 0.2s' }}>
          {copied ? '✓ Copied!' : `Invite: ${room?.invite_code}`}
        </button>
      </nav>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left: Video area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Video player */}
          <div style={{ padding: '1rem', background: '#050305', flexShrink: 0 }}>
            <VideoPlayer
              video={current}
              socket={socket}
              roomId={id}
              userId={user?.id}
            />
          </div>

          {/* Current video title */}
          {current && (
            <div style={{ padding: '0.6rem 1rem', background: '#0a080c', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.95rem', color: 'rgba(240,232,224,0.6)' }}>
                Now watching: <span style={{ color: '#e8b4c0' }}>{current.title}</span>
              </span>
            </div>
          )}

          {/* Mobile tabs */}
          <div style={{ display: 'none' }} className="mobile-tabs">
            <button onClick={() => setTab('chat')} style={{ flex: 1 }}>💬 Chat</button>
            <button onClick={() => setTab('videos')} style={{ flex: 1 }}>🎬 Videos</button>
          </div>

          {/* Video list (below player on mobile, hidden on desktop — desktop shows on right sidebar) */}
          <div className="video-list-mobile" style={{ flex: 1, minHeight: 0, display: 'none', overflow: 'hidden' }}>
            <VideoList
              videos={videos}
              currentVideo={current}
              onSelect={handleSelectVideo}
              onUpload={handleVideoUpload}
              roomId={id}
              authFetch={authFetch}
            />
          </div>
        </div>

        {/* Right sidebar: Chat + Video list */}
        <div style={{ width: '320px', flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Video library (top half) */}
          <div style={{ height: '35%', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <VideoList
              videos={videos}
              currentVideo={current}
              onSelect={handleSelectVideo}
              onUpload={handleVideoUpload}
              roomId={id}
              authFetch={authFetch}
            />
          </div>

          {/* Chat (bottom half) */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Chat
              socket={socket}
              roomId={id}
              userId={user?.id}
              userName={user?.name}
              avatarColor={user?.avatar_color}
              initialMessages={messages}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 768px) {
          .mobile-tabs { display: flex !important; border-bottom: 1px solid rgba(255,255,255,0.06); }
          .mobile-tabs button { padding: 0.65rem; background: none; border: none; color: rgba(240,232,224,0.5); font-size: 0.85rem; cursor: pointer; font-family: 'DM Sans', sans-serif; border-bottom: 2px solid transparent; }
          .video-list-mobile { display: ${tab === 'videos' ? 'flex' : 'none'} !important; flex-direction: column; }
        }
      `}</style>
    </div>
  );
}

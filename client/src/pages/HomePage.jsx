import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const css = `
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .room-card:hover { border-color: rgba(200,140,160,0.4) !important; transform: translateY(-2px); }
  .room-card { transition: all 0.2s; }
  .action-btn:hover { opacity: 0.85; transform: scale(0.99); }
  .pill-btn:hover { background: rgba(200,140,160,0.2) !important; }
`;

export default function HomePage() {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms,      setRooms]      = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin,   setShowJoin]   = useState(false);
  const [roomName,   setRoomName]   = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [copied,     setCopied]     = useState(null);

  useEffect(() => { loadRooms(); }, []);

  const loadRooms = async () => {
    const res = await authFetch('/api/rooms/my');
    if (res.ok) { const data = await res.json(); setRooms(data); }
  };

  const createRoom = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await authFetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setRooms(r => [data, ...r]);
      setRoomName(''); setShowCreate(false);
      navigate(`/room/${data.id}`);
    } catch { setError('Something went wrong'); }
    finally { setLoading(false); }
  };

  const joinRoom = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await authFetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      navigate(`/room/${data.id}`);
    } catch { setError('Something went wrong'); }
    finally { setLoading(false); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const p = { /* styles */ };

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 10%, #1a0a1a 0%, #0d0a0f 60%, #0a0a1a 100%)', padding: '0', fontFamily: "'DM Sans', sans-serif" }}>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 600, color: '#f0e8e0', letterSpacing: '-0.02em' }}>
            TogetherWatch
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'rgba(240,232,224,0.5)' }}>
              Hi, <span style={{ color: '#e8b4c0' }}>{user?.name}</span>
            </span>
            <button onClick={logout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.4rem 0.9rem', color: 'rgba(240,232,224,0.5)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              Sign out
            </button>
          </div>
        </nav>

        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '3rem 2rem' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: '3rem', animation: 'fadeIn 0.6s ease' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'float 3s ease-in-out infinite' }}>💑</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem', fontWeight: 600, color: '#f0e8e0', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              Your watch rooms
            </h1>
            <p style={{ color: 'rgba(240,232,224,0.4)', fontSize: '0.9rem', margin: 0 }}>
              Create a room, invite your loved one, watch together.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <button className="action-btn" onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }}
              style={{ padding: '1.1rem', background: 'linear-gradient(135deg, #c87890 0%, #9060a0 100%)', border: 'none', borderRadius: '14px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.92rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
              ✦ Create Room
            </button>
            <button className="action-btn" onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); }}
              style={{ padding: '1.1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#f0e8e0', fontFamily: "'DM Sans', sans-serif", fontSize: '0.92rem', cursor: 'pointer', transition: 'all 0.15s' }}>
              ♡ Join with Code
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,140,160,0.2)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
              <p style={{ color: 'rgba(240,232,224,0.6)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 1rem' }}>New Room</p>
              <form onSubmit={createRoom} style={{ display: 'flex', gap: '0.75rem' }}>
                <input value={roomName} onChange={e => setRoomName(e.target.value)}
                  placeholder="e.g. Movie Night 🎬" required
                  style={{ flex: 1, padding: '0.7rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f0e8e0', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', outline: 'none' }} />
                <button type="submit" disabled={loading}
                  style={{ padding: '0.7rem 1.4rem', background: 'linear-gradient(135deg,#c87890,#9060a0)', border: 'none', borderRadius: '10px', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {loading ? '...' : 'Create →'}
                </button>
              </form>
            </div>
          )}

          {/* Join form */}
          {showJoin && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(140,160,200,0.2)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
              <p style={{ color: 'rgba(240,232,224,0.6)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 1rem' }}>Enter Invite Code</p>
              <form onSubmit={joinRoom} style={{ display: 'flex', gap: '0.75rem' }}>
                <input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AB12CD" required maxLength={6}
                  style={{ flex: 1, padding: '0.7rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#f0e8e0', fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', outline: 'none', letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'center' }} />
                <button type="submit" disabled={loading}
                  style={{ padding: '0.7rem 1.4rem', background: 'rgba(140,160,200,0.2)', border: '1px solid rgba(140,160,200,0.3)', borderRadius: '10px', color: '#a0c0e8', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {loading ? '...' : 'Join →'}
                </button>
              </form>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(200,80,80,0.1)', border: '1px solid rgba(200,80,80,0.25)', borderRadius: '10px', padding: '0.7rem 1rem', color: '#f09090', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* Room list */}
          {rooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(240,232,224,0.2)', fontSize: '0.9rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎬</div>
              No rooms yet — create one and invite your partner!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {rooms.map(room => (
                <div key={room.id} className="room-card"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.2rem 1.4rem', cursor: 'pointer' }}
                  onClick={() => navigate(`/room/${room.id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem', fontWeight: 600, color: '#f0e8e0' }}>{room.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(240,232,224,0.35)', marginTop: '0.25rem' }}>
                        {new Date(room.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <button onClick={e => { e.stopPropagation(); copyCode(room.invite_code); }}
                        className="pill-btn"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.35rem 0.75rem', color: copied === room.invite_code ? '#90e890' : 'rgba(240,232,224,0.5)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.1em', transition: 'all 0.2s' }}>
                        {copied === room.invite_code ? '✓ Copied' : room.invite_code}
                      </button>
                      <span style={{ color: 'rgba(240,232,224,0.25)', fontSize: '1rem' }}>→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rooms.length > 0 && (
            <p style={{ textAlign: 'center', color: 'rgba(240,232,224,0.2)', fontSize: '0.78rem', marginTop: '1.5rem' }}>
              Share the room code with your loved one to invite them ♡
            </p>
          )}
        </div>
      </div>
    </>
  );
}

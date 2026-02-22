import { useRef, useEffect, useState, useCallback } from 'react';

const EMOJIS = ['❤️','😂','😭','🥺','🔥','💕','😍','🎉','👏','💯'];

export default function VideoPlayer({ video, socket, roomId, userId }) {
  const videoRef  = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume,   setVolume]   = useState(1);
  const [muted,    setMuted]    = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [buffering,  setBuffering]  = useState(false);
  const [floatEmoji, setFloatEmoji] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const hideTimeout = useRef(null);
  const isSyncing   = useRef(false); // prevent sync loops

  const streamUrl = video
    ? `${process.env.REACT_APP_API_URL}/stream/${video.filename}`
    : null;

  // ── Socket listeners (partner's actions) ──────────────────
  useEffect(() => {
    if (!socket) return;

    const onPlay = ({ currentTime }) => {
      isSyncing.current = true;
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        videoRef.current.play().catch(() => {});
        setPlaying(true);
      }
      setTimeout(() => { isSyncing.current = false; }, 300);
    };

    const onPause = ({ currentTime }) => {
      isSyncing.current = true;
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime;
        videoRef.current.pause();
        setPlaying(false);
      }
      setTimeout(() => { isSyncing.current = false; }, 300);
    };

    const onSeek = ({ currentTime }) => {
      isSyncing.current = true;
      if (videoRef.current) videoRef.current.currentTime = currentTime;
      setTimeout(() => { isSyncing.current = false; }, 300);
    };

    socket.on('video_play',  onPlay);
    socket.on('video_pause', onPause);
    socket.on('video_seek',  onSeek);

    return () => {
      socket.off('video_play',  onPlay);
      socket.off('video_pause', onPause);
      socket.off('video_seek',  onSeek);
    };
  }, [socket]);

  // ── Local controls ─────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
      if (!isSyncing.current && socket)
        socket.emit('video_play', { roomId, currentTime: v.currentTime });
    } else {
      v.pause();
      setPlaying(false);
      if (!isSyncing.current && socket)
        socket.emit('video_pause', { roomId, currentTime: v.currentTime });
    }
  }, [socket, roomId]);

  const seek = useCallback((e) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    const t    = pct * duration;
    v.currentTime = t;
    if (!isSyncing.current && socket)
      socket.emit('video_seek', { roomId, currentTime: t });
  }, [socket, roomId, duration]);

  const sendEmoji = (emoji) => {
    setFloatEmoji({ emoji, id: Date.now() });
    setTimeout(() => setFloatEmoji(null), 2000);
    // Also send as chat message via socket
    if (socket) socket.emit('send_message', { roomId, userId, userName: '', content: emoji });
  };

  // Auto-hide controls
  const showControlsTemp = () => {
    setShowControls(true);
    clearTimeout(hideTimeout.current);
    if (playing) hideTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    return () => clearTimeout(hideTimeout.current);
  }, []);

  useEffect(() => {
    setShowControls(true);
    setPlaying(false);
    setCurrent(0);
  }, [video]);

  const fmt = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  if (!video) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(240,232,224,0.25)', flexDirection: 'column', gap: '0.75rem', minHeight: '300px' }}>
        <div style={{ fontSize: '3rem' }}>🎬</div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem' }}>No video selected</p>
        <p style={{ fontSize: '0.78rem', opacity: 0.6 }}>Upload a video or choose one from the list</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden', userSelect: 'none' }}
      onMouseMove={showControlsTemp}
      onClick={togglePlay}>

      {/* Video element */}
      <video
        ref={videoRef}
        src={streamUrl}
        style={{ width: '100%', display: 'block', maxHeight: '60vh', background: '#000' }}
        onTimeUpdate={() => setCurrent(videoRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
        onEnded={() => setPlaying(false)}
        preload="metadata"
        playsInline
      />

      {/* Buffering spinner */}
      {buffering && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', pointerEvents: 'none' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#e8b4c0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* Floating emoji */}
      {floatEmoji && (
        <div key={floatEmoji.id} style={{ position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)', fontSize: '2.5rem', animation: 'floatUp 2s ease forwards', pointerEvents: 'none', zIndex: 10 }}>
          {floatEmoji.emoji}
        </div>
      )}

      {/* Controls overlay */}
      <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '1.5rem 1rem 0.85rem', opacity: showControls ? 1 : 0, transition: 'opacity 0.3s' }}>

        {/* Progress bar */}
        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', cursor: 'pointer', marginBottom: '0.75rem', position: 'relative' }}
          onClick={seek}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${duration ? (current / duration) * 100 : 0}%`, background: 'linear-gradient(90deg, #c87890, #9060a0)', borderRadius: '2px', transition: 'width 0.2s' }} />
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Play/Pause */}
          <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem', lineHeight: 1 }}>
            {playing ? '⏸' : '▶️'}
          </button>

          {/* Time */}
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            {fmt(current)} / {fmt(duration)}
          </span>

          <div style={{ flex: 1 }} />

          {/* Volume */}
          <button onClick={() => { setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted; }}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1rem', cursor: 'pointer', padding: '0.25rem' }}>
            {muted ? '🔇' : '🔊'}
          </button>

          <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
            onChange={e => { const v = parseFloat(e.target.value); setVolume(v); if (videoRef.current) videoRef.current.volume = v; setMuted(v === 0); }}
            style={{ width: '70px', accentColor: '#c87890', cursor: 'pointer' }} />
        </div>
      </div>

      {/* Quick emoji bar */}
      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '6px', opacity: showControls ? 1 : 0, transition: 'opacity 0.3s' }}
        onClick={e => e.stopPropagation()}>
        {EMOJIS.slice(0, 5).map(em => (
          <button key={em} onClick={() => sendEmoji(em)}
            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            {em}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes floatUp { 0%{opacity:1;transform:translateX(-50%) translateY(0)} 100%{opacity:0;transform:translateX(-50%) translateY(-80px)} }
      `}</style>
    </div>
  );
}

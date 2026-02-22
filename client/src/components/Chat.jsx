import { useState, useEffect, useRef } from 'react';

const EMOJIS = ['❤️','😂','😭','🥺','🔥','💕','😍','🎉','👏','💯','😘','🤣','💖','✨','😊','🙈','💌','🌹','🦋','🫶'];

export default function Chat({ socket, roomId, userId, userName, avatarColor, initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text,     setText]     = useState('');
  const [typing,   setTyping]   = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef   = useRef(null);
  const typingTimer = useRef(null);
  const { authFetch } = window.__authFetch || {};

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set initial messages
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages.length]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      setTyping('');
    };

    const onTyping = ({ userName: name }) => {
      if (name !== userName) setTyping(`${name} is typing...`);
    };

    const onStopTyping = () => setTyping('');

    socket.on('receive_message', onMessage);
    socket.on('typing',          onTyping);
    socket.on('stop_typing',     onStopTyping);

    return () => {
      socket.off('receive_message', onMessage);
      socket.off('typing',          onTyping);
      socket.off('stop_typing',     onStopTyping);
    };
  }, [socket, userName]);

  const send = (e) => {
    e?.preventDefault();
    const content = text.trim();
    if (!content || !socket) return;

    socket.emit('send_message', { roomId, userId, userName, content });
    socket.emit('stop_typing',  { roomId });
    setText('');
    setShowEmoji(false);

    // Also save to DB async (don't await)
    fetch(`${process.env.REACT_APP_API_URL}/api/rooms/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('tw_token')}`
      },
      body: JSON.stringify({ roomId, content })
    }).catch(() => {});
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (socket) {
      socket.emit('typing', { roomId, userName });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => socket.emit('stop_typing', { roomId }), 1500);
    }
  };

  const insertEmoji = (emoji) => {
    setText(t => t + emoji);
    setShowEmoji(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const isMe = (uid) => uid === userId;

  const fmtTime = (iso) => {
    try { return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(240,232,224,0.35)' }}>
          ♡ Live Chat
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(240,232,224,0.2)', fontSize: '0.83rem', padding: '2rem 0' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💌</div>
            Say hello to start chatting!
          </div>
        )}

        {messages.map((msg, i) => {
          const me = isMe(msg.userId || msg.user_id);
          return (
            <div key={msg.id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: me ? 'flex-end' : 'flex-start' }}>
              {!me && (
                <span style={{ fontSize: '0.68rem', color: 'rgba(240,232,224,0.3)', marginBottom: '0.2rem', marginLeft: '0.5rem' }}>
                  {msg.userName || msg.user_name}
                </span>
              )}
              <div style={{
                maxWidth: '78%',
                padding: '0.55rem 0.9rem',
                borderRadius: me ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: me
                  ? 'linear-gradient(135deg, rgba(200,120,144,0.35), rgba(144,96,160,0.35))'
                  : 'rgba(255,255,255,0.07)',
                border: me ? '1px solid rgba(200,120,144,0.2)' : '1px solid rgba(255,255,255,0.06)',
                color: '#f0e8e0',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}>
                {msg.content}
              </div>
              <span style={{ fontSize: '0.62rem', color: 'rgba(240,232,224,0.2)', marginTop: '0.2rem', marginLeft: me ? 0 : '0.5rem', marginRight: me ? '0.5rem' : 0 }}>
                {fmtTime(msg.time || msg.created_at)}
              </span>
            </div>
          );
        })}

        {typing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(240,232,224,0.35)', fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}>
            <span style={{ display: 'flex', gap: '2px' }}>
              {[0,1,2].map(i => <span key={i} style={{ width: '4px', height: '4px', background: 'currentColor', borderRadius: '50%', animation: `bounce 1s ${i * 0.15}s infinite` }} />)}
            </span>
            {typing}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div style={{ padding: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: '0.3rem', background: 'rgba(0,0,0,0.2)' }}>
          {EMOJIS.map(em => (
            <button key={em} onClick={() => insertEmoji(em)}
              style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '6px', transition: 'background 0.15s' }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.target.style.background = 'none'}>
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
        <button onClick={() => setShowEmoji(s => !s)}
          style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0.4rem', flexShrink: 0, opacity: showEmoji ? 1 : 0.5, transition: 'opacity 0.2s' }}>
          😊
        </button>
        <textarea value={text} onChange={handleTyping} onKeyDown={handleKey}
          placeholder="Type a message..." rows={1}
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0.65rem 0.9rem', color: '#f0e8e0', fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif", resize: 'none', outline: 'none', lineHeight: 1.5, maxHeight: '100px' }} />
        <button onClick={send}
          style={{ background: 'linear-gradient(135deg,#c87890,#9060a0)', border: 'none', borderRadius: '12px', padding: '0.6rem 0.9rem', color: '#fff', fontSize: '1rem', cursor: 'pointer', flexShrink: 0 }}>
          ↑
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}

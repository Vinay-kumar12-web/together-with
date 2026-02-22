import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at 30% 20%, #1e0a1e 0%, #0d0a0f 50%, #0a0d1e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '3rem 2.5rem',
    backdropFilter: 'blur(20px)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  logoText: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '2.2rem',
    fontWeight: 600,
    color: '#f0e8e0',
    letterSpacing: '-0.02em',
    display: 'block',
  },
  logoSub: {
    fontSize: '0.78rem',
    color: 'rgba(240,232,224,0.4)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginTop: '0.3rem',
    display: 'block',
  },
  tabs: {
    display: 'flex',
    gap: '0',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '10px',
    padding: '3px',
    marginBottom: '2rem',
  },
  tab: (active) => ({
    flex: 1,
    padding: '0.6rem',
    border: 'none',
    borderRadius: '8px',
    background: active ? 'rgba(200,140,160,0.25)' : 'transparent',
    color: active ? '#e8b4c0' : 'rgba(240,232,224,0.4)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  label: {
    display: 'block',
    fontSize: '0.72rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgba(240,232,224,0.45)',
    marginBottom: '0.4rem',
    marginTop: '1.1rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#f0e8e0',
    fontSize: '0.9rem',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%',
    marginTop: '1.75rem',
    padding: '0.85rem',
    background: 'linear-gradient(135deg, #c87890 0%, #9060a0 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '0.95rem',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    cursor: 'pointer',
    letterSpacing: '0.03em',
    transition: 'opacity 0.2s, transform 0.1s',
  },
  error: {
    background: 'rgba(200,80,80,0.15)',
    border: '1px solid rgba(200,80,80,0.3)',
    borderRadius: '8px',
    padding: '0.65rem 1rem',
    color: '#f08080',
    fontSize: '0.83rem',
    marginTop: '1rem',
  },
  hearts: {
    textAlign: 'center',
    marginTop: '2rem',
    fontSize: '1.3rem',
    opacity: 0.3,
  },
};

export default function AuthPage() {
  const [mode,  setMode]  = useState('login');
  const [form,  setForm]  = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res  = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      login(data.user, data.token);
      navigate('/');
    } catch {
      setError('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <span style={s.logoText}>TogetherWatch</span>
          <span style={s.logoSub}>watch. chat. feel close.</span>
        </div>

        <div style={s.tabs}>
          <button style={s.tab(mode === 'login')}  onClick={() => { setMode('login');  setError(''); }}>Sign In</button>
          <button style={s.tab(mode === 'signup')} onClick={() => { setMode('signup'); setError(''); }}>Create Account</button>
        </div>

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <label style={s.label}>Your name</label>
              <input style={s.input} placeholder="e.g. Priya" value={form.name} onChange={set('name')} required
                onFocus={e => e.target.style.borderColor = 'rgba(200,140,160,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </>
          )}
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required
            onFocus={e => e.target.style.borderColor = 'rgba(200,140,160,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required
            onFocus={e => e.target.style.borderColor = 'rgba(200,140,160,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />

          {error && <div style={s.error}>{error}</div>}

          <button style={s.btn} type="submit" disabled={loading}
            onMouseEnter={e => e.target.style.opacity = '0.85'}
            onMouseLeave={e => e.target.style.opacity = '1'}>
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={s.hearts}>♥ ♥ ♥</div>
      </div>
    </div>
  );
}

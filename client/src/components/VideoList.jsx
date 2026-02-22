import { useState, useRef } from 'react';

export default function VideoList({ videos, currentVideo, onSelect, onUpload, roomId, authFetch }) {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [error,     setError]     = useState('');
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError(''); setUploading(true); setProgress(0);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('roomId', roomId);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

    // Use XMLHttpRequest to track upload progress
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const video = JSON.parse(xhr.responseText);
        onUpload(video);
        setProgress(0);
      } else {
        try { setError(JSON.parse(xhr.responseText).message); }
        catch { setError('Upload failed'); }
      }
      setUploading(false);
    };

    xhr.onerror = () => { setError('Upload failed. Check connection.'); setUploading(false); };

    xhr.open('POST', `${process.env.REACT_APP_API_URL}/api/videos/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('tw_token')}`);
    xhr.send(formData);
  };

  const fmtSize = (bytes) => {
    if (!bytes) return '';
    if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
    if (bytes > 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
    return (bytes / 1e3).toFixed(0) + ' KB';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header + Upload */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: uploading ? '0.75rem' : 0 }}>
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(240,232,224,0.35)' }}>
            🎬 Videos
          </span>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ background: 'linear-gradient(135deg,#c87890,#9060a0)', border: 'none', borderRadius: '8px', padding: '0.35rem 0.8rem', color: '#fff', fontSize: '0.75rem', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: uploading ? 0.6 : 1 }}>
            {uploading ? `${progress}%` : '+ Upload'}
          </button>
          <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        {uploading && (
          <div>
            <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#c87890,#9060a0)', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
            <p style={{ fontSize: '0.72rem', color: 'rgba(240,232,224,0.4)', margin: '0.35rem 0 0' }}>
              Uploading... {progress}% — don't close the tab
            </p>
          </div>
        )}

        {error && <p style={{ fontSize: '0.75rem', color: '#f09090', margin: '0.5rem 0 0' }}>{error}</p>}
      </div>

      {/* Video list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
        {videos.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(240,232,224,0.2)', fontSize: '0.82rem', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>📂</div>
            Upload a video from your device to start watching together
          </div>
        )}

        {videos.map(v => {
          const active = currentVideo?.id === v.id;
          return (
            <div key={v.id} onClick={() => onSelect(v)}
              style={{ padding: '0.75rem 0.9rem', borderRadius: '10px', cursor: 'pointer', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '0.75rem', background: active ? 'rgba(200,120,144,0.15)' : 'transparent', border: active ? '1px solid rgba(200,120,144,0.25)' : '1px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>

              <div style={{ width: '36px', height: '36px', background: active ? 'rgba(200,120,144,0.3)' : 'rgba(255,255,255,0.06)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                {active ? '▶' : '🎞'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', color: active ? '#e8b4c0' : '#f0e8e0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {v.title}
                </div>
                {v.file_size && (
                  <div style={{ fontSize: '0.7rem', color: 'rgba(240,232,224,0.3)', marginTop: '0.15rem' }}>
                    {fmtSize(v.file_size)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

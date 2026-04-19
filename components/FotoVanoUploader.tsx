'use client';
import { useState, useRef } from 'react';

interface Foto { id: string; url: string; didascalia: string; path: string; }

interface Props {
  vanoId: string;
  fotoIniziali?: Foto[];
  onChange?: (foto: Foto[]) => void;
}

export default function FotoVanoUploader({ vanoId, fotoIniziali = [], onChange }: Props) {
  const [foto, setFoto] = useState<Foto[]>(fotoIniziali);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('vano_id', vanoId);

      const res = await fetch('/api/vano/foto', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const { foto: nuova } = await res.json();
      if (nuova) {
        const aggiornate = [...foto, nuova];
        setFoto(aggiornate);
        onChange?.(aggiornate);
      }
    } finally {
      setUploading(false);
    }
  };

  const elimina = async (f: Foto) => {
    if (!confirm('Eliminare questa foto?')) return;
    await fetch('/api/vano/foto', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ fotoId: f.id, path: f.path }),
    });
    const aggiornate = foto.filter(x => x.id !== f.id);
    setFoto(aggiornate);
    onChange?.(aggiornate);
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Grid foto */}
      {foto.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 12 }}>
          {foto.map(f => (
            <div key={f.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: '#F2F1EC' }}>
              <img
                src={f.url}
                alt={f.didascalia}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                onClick={() => setPreview(f.url)}
              />
              <button
                onClick={() => elimina(f)}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  background: 'rgba(220,68,68,0.9)', color: '#fff',
                  border: 'none', borderRadius: '50%', width: 22, height: 22,
                  cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: '2px dashed #E5E3DC', borderRadius: 10, padding: '16px',
          textAlign: 'center', cursor: uploading ? 'wait' : 'pointer',
          background: '#F2F1EC', transition: 'border-color 0.15s',
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
      >
        {uploading ? (
          <div style={{ color: '#D08008', fontSize: 13, fontWeight: 600 }}>Caricamento...</div>
        ) : (
          <>
            <div style={{ fontSize: 24 }}>📷</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              {foto.length === 0 ? 'Aggiungi foto del vano' : '+ Altra foto'}
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }}
        />
      </div>

      {/* Lightbox */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, cursor: 'zoom-out',
          }}
        >
          <img src={preview} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}

function getToken(): string {
  return typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') ?? '' : '';
}

'use client';
import { useState, useEffect } from 'react';

interface SubStatus {
  plan: string;
  status: string;
  trialing: boolean;
  trialDaysLeft: number;
  trial_ends_at?: string;
  current_period_end?: string;
}

const PIANI: Record<string, { nome: string; prezzo: number; colore: string }> = {
  base:  { nome: 'BASE',  prezzo: 9,  colore: '#6B7280' },
  start: { nome: 'START', prezzo: 29, colore: '#3B7FE0' },
  pro:   { nome: 'PRO',   prezzo: 59, colore: '#D08008' },
  titan: { nome: 'TITAN', prezzo: 89, colore: '#1A1A1C' },
};

export default function SettingsAbbonamento() {
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portaling, setPortaling] = useState(false);

  useEffect(() => {
    fetch('/api/subscription/status', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(setSub)
      .finally(() => setLoading(false));
  }, []);

  const apriPortal = async () => {
    setPortaling(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setPortaling(false);
    }
  };

  if (loading) return <div style={loadingStyle}>Caricamento abbonamento...</div>;

  const piano = sub?.plan ? PIANI[sub.plan] : null;
  const statusColor = sub?.status === 'active' ? '#1A9E73' : sub?.trialing ? '#3B7FE0' : '#DC4444';
  const statusLabel = sub?.trialing ? `Trial — ${sub.trialDaysLeft} giorni rimasti` : sub?.status === 'active' ? 'Attivo' : sub?.status === 'past_due' ? 'Pagamento scaduto' : sub?.status ?? 'Nessun piano';

  // fliwoX colori piano
  const pianoColori: Record<string, { bg: string; sh: string }> = {
    base:  { bg: '#6B7280', sh: '#4A5060' },
    start: { bg: '#1A5AAA', sh: '#0A3070' },
    pro:   { bg: '#7A4800', sh: '#503000' },
    titan: { bg: '#0D1F1F', sh: '#000000' },
  };
  const pc = piano?.colore ? pianoColori[sub?.plan ?? ''] ?? { bg: piano.colore, sh: '#333' } : { bg: '#6B7280', sh: '#4A5060' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* fliwoX Card piano */}
      <div style={{ background: pc.bg, borderRadius:18, padding:'20px', boxShadow:`0 8px 0 0 ${pc.sh}`, overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Piano attuale</div>
            <div style={{ color:'#fff', fontSize:32, fontWeight:900, letterSpacing:'-1px', lineHeight:1 }}>{piano?.nome ?? 'Nessuno'}</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: sub?.status === 'active' ? '#4AE0A0' : sub?.trialing ? '#60C0FF' : '#FF6060' }} />
              <span style={{ fontSize:12, fontWeight:900, color:'rgba(255,255,255,0.85)' }}>{statusLabel}</span>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:'#fff', fontSize:32, fontWeight:900, letterSpacing:'-1px' }}>€{piano?.prezzo ?? 0}</div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:700 }}>/mese</div>
            {sub?.current_period_end && (
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:4 }}>
                Rinnovo: {new Date(sub.current_period_end).toLocaleDateString('it-IT')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* fliwoX Azioni */}
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={apriPortal} disabled={portaling} style={{
          flex:1, padding:'15px 0', background:'#28A0A0', color:'#fff',
          border:'none', borderRadius:16, fontSize:15, fontWeight:900,
          cursor: portaling ? 'wait' : 'pointer', opacity: portaling ? 0.7 : 1,
          fontFamily:'Inter, sans-serif', boxShadow:'0 7px 0 0 #156060',
        }}>
          {portaling ? 'Apertura...' : 'Gestisci abbonamento'}
        </button>
        {(!sub || sub.status !== 'active') && (
          <button onClick={() => window.location.href = '/onboarding?step=5'} style={{
            flex:1, padding:'15px 0', background:'#D08008', color:'#fff',
            border:'none', borderRadius:16, fontSize:15, fontWeight:900,
            cursor:'pointer', fontFamily:'Inter, sans-serif', boxShadow:'0 7px 0 0 #7A4800',
          }}>
            Upgrade ↑
          </button>
        )}
      </div>

      {/* fliwoX Trial warning */}
      {sub?.trialing && sub.trialDaysLeft <= 7 && (
        <div style={{ background:'#FFF8DC', border:'2px solid rgba(208,128,8,0.3)', borderRadius:14, padding:'13px 16px', fontSize:13, fontWeight:800, color:'#7A4800', boxShadow:'0 5px 0 0 rgba(208,128,8,0.25)', display:'flex', alignItems:'center', gap:10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D08008" strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
          Trial scade tra <strong>{sub.trialDaysLeft} giorni</strong>. Attiva un piano per non perdere i dati.
        </div>
      )}
    </div>
  );
}

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('sb-access-token') ?? '';
}

const loadingStyle: React.CSSProperties = {
  padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: 14,
};
